import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
function load(file,mocks) {
  const code=ts.transpileModule(readFileSync(new URL('../'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};
  new Function('module','exports','require',code)(mod,mod.exports,id=>{if(id==='server-only')return {};if(id in mocks)return mocks[id];throw new Error('Unexpected import '+id);});
  return mod.exports;
}
const now=new Date();
const user={id:'editor',displayName:'Editor',packageStatus:'ACTIVE',packageExpiresAt:null,lastLoginAt:now,freelancerWorkspace:{profile:{bio:'Public bio',email:'private@test',phone:'private',karmaScore:99,socialLinks:['https://example.com/portfolio','javascript:alert(1)']},verification:{status:'APPROVED',identityNumber:'private'}},freelancerTrustSnapshot:{score:73,provisional:true,calculatedAt:now}};
function loaderFixture({users=[user],status='APPROVED',membership=null,requests=[]}={}){
  const calls={}; const result=(name,value)=>async args=>(calls[name]=args,value);
  const prisma={appAuthUser:{findMany:result('users',users)},appFreelancerService:{findMany:result('services',[{id:'service',ownerId:'editor',slug:'reels',status,payload:{title:'Reels',basePrice:1500,sampleVideoUrl:'https://example.com/portfolio'}}])},appTeamMembership:{findMany:result('memberships',membership?[membership]:[])},appTeamRequest:{findMany:result('requests',requests)},appAssignmentRecord:{groupBy:result('projects',[{freelancerId:'editor',_count:{_all:3}}])},appConversation:{groupBy:result('chats',[{assignedFreelancerId:'editor',_count:{_all:2}}])}};
  return {...load('src/lib/api/editor-directory.ts',{'@/lib/prisma':{prisma}}),calls};
}
test('directory uses assessment snapshot, aggregates workload and excludes private fields',async()=>{
  const fixture=loaderFixture();const [editor]=await fixture.loadEditors('tenant');
  assert.equal(editor.trustScore,73);assert.equal(editor.trustProvisional,true);assert.deepEqual(editor.workload,{activeProjects:3,activeChats:2});
  const json=JSON.stringify(editor);assert.ok(!json.includes('private'));assert.ok(!json.includes('javascript:'));
  assert.equal(fixture.calls.memberships.where.tenantId,'tenant');
  assert.deepEqual(fixture.calls.chats.where.status.notIn,['closed','CLOSED']);
});
test('no snapshot is not disguised as zero or karma; unpublished editors stay outside General',async()=>{
  const [editor]=await loaderFixture({users:[{...user,freelancerTrustSnapshot:null}],status:'DRAFT'}).loadEditors('tenant');
  assert.equal(editor.trustScore,null);assert.equal(editor.marketplaceEligible,false);assert.equal(editor.offerEligible,false);assert.equal(editor.directAssignmentEligible,false);
});
test('accepted private Team members retain direct eligibility while offline',async()=>{
  const fixture=loaderFixture({users:[{...user,freelancerWorkspace:{profile:{presenceMode:'OFFLINE'}}}],status:'DRAFT',membership:{id:'membership',freelancerId:'editor',status:'ACTIVE',updatedAt:now}});
  const [editor]=await fixture.loadEditors('tenant','editor');assert.equal(editor.isOnline,false);assert.equal(editor.offerEligible,true);assert.equal(editor.directAssignmentEligible,true);assert.equal(fixture.calls.users.where.id,'editor');
});
function profileRoute(session,editors,fail=false){return load('src/app/api/team/editor-directory/[id]/route.ts',{'next/server':{NextResponse:Response},'@/lib/api/require-session-role':{requireSessionRole:async()=>session?{ok:true,session}:{ok:false,response:Response.json({error:'Authentication required'},{status:401})}},'@/lib/api/editor-directory':{loadEditors:async()=>{if(fail)throw Error('private database detail');return editors;}}});}
test('profile endpoint requires authentication and a tenant',async()=>{
  const context={params:Promise.resolve({id:'editor'})};
  assert.equal((await profileRoute(null,[]).GET(new Request('https://qa.test'),context)).status,401);
  assert.equal((await profileRoute({role:'ADMIN'},[]).GET(new Request('https://qa.test'),context)).status,403);
});
test('profile access hides nonpublic nonmembers and redacts server errors',async()=>{
  const request=new Request('https://qa.test');const context={params:Promise.resolve({id:'editor'})};const session={role:'ADMIN',tenantId:'tenant'};
  assert.equal((await profileRoute(session,[{marketplaceEligible:false,membership:null}]).GET(request,context)).status,404);
  assert.equal((await profileRoute(session,[{marketplaceEligible:false,membership:{status:'ACTIVE'}}]).GET(request,context)).status,200);
  const error=await profileRoute(session,[],true).GET(request,context);assert.equal(error.status,503);assert.ok(!(await error.text()).includes('private database detail'));
});
function directoryRoute(rows, {session={role:'ADMIN',tenantId:'tenant',displayName:'Agency'},failure=false,teamRequests=[]}={}) {
  return load('src/app/api/team/editor-directory/route.ts',{'next/server':{NextResponse:Response},'@/lib/api/require-session-role':{requireSessionRole:async()=>({ok:true,session})},'@/lib/api/resolve-session-tenant':{resolveSessionTenantId:s=>s.tenantId},'@/lib/gigxomi/app-team-flow-service':{listFreelancerTeamRequests:async()=>({ok:true,requests:teamRequests,memberships:[]})},'@/lib/prisma':{prisma:{appAuthUser:{findFirst:async()=>{throw Error('private storage error');}}}},'@/lib/api/editor-directory':{loadEditors:async()=>{if(failure)throw Error('private storage error');return rows;}}});
}
test('directory totals remain authoritative across search and pages',async()=>{
  const rows=[{id:'a',name:'Aarav',title:'Editor',category:'Reels',bio:'',skills:['Reels'],isOnline:false,marketplaceEligible:false,membership:{status:'ACTIVE'},invitation:null},{id:'b',name:'Neha',title:'Motion',category:'Motion',bio:'',skills:['Animation'],isOnline:true,marketplaceEligible:true,membership:null,invitation:{id:'request',status:'INVITED'}}];
  const route=directoryRoute(rows);
  const team=await (await route.GET(new Request('https://qa.test/api/team/editor-directory?scope=team&search=Aarav&limit=1'))).json();
  assert.deepEqual(team.editors.map(e=>e.id),['a']);assert.deepEqual(team.totals,{general:1,active:1,pending:1});assert.equal(team.invitations[0].editorName,'Neha');
  const online=await (await route.GET(new Request('https://qa.test/api/team/editor-directory?scope=team&online=1'))).json();assert.equal(online.editors.length,0);assert.equal(online.totals.active,1);
  const general=await (await route.GET(new Request('https://qa.test/api/team/editor-directory?scope=general'))).json();assert.deepEqual(general.editors.map(e=>e.id),['b']);
});
test('directory failures are JSON errors, never fake empty results or a default tenant',async()=>{
  const response=await directoryRoute([],{failure:true}).GET(new Request('https://qa.test'));assert.equal(response.status,503);assert.equal((await response.json()).code,'DIRECTORY_UNAVAILABLE');
  assert.equal((await directoryRoute([],{session:{role:'ADMIN'}}).GET(new Request('https://qa.test'))).status,403);
});
test('invitation storage failures return a safe retryable response',async()=>{
  const response=await directoryRoute([]).POST(new Request('https://qa.test',{method:'POST',body:JSON.stringify({editorProfileId:'editor'})}));assert.equal(response.status,503);const body=await response.json();assert.equal(body.code,'TEAM_INVITE_UNAVAILABLE');assert.ok(!JSON.stringify(body).includes('private storage error'));
});
test('work interest cannot be presented as an accept-to-join Team invitation',async()=>{
  const work={id:'work-interest',freelancerId:'editor',status:'PENDING',updatedAt:now,metadata:{initiatedBy:'FREELANCER',requestKind:'WORK'}};
  const team={...work,id:'team-request',metadata:{initiatedBy:'FREELANCER',requestKind:'TEAM'}};
  const [workOnly]=await loaderFixture({requests:[work]}).loadEditors('tenant');assert.equal(workOnly.invitation,null);
  const [both]=await loaderFixture({requests:[work,team]}).loadEditors('tenant');assert.equal(both.invitation.id,'team-request');assert.equal(both.invitation.direction,'FREELANCER_TO_AGENCY');
});
test('freelancers never receive Accept controls for requests they sent themselves',async()=>{
  const request={id:'outgoing',tenantId:'tenant',agencyName:'Agency',message:'Introduction',status:'PENDING',createdAt:now,updatedAt:now,metadata:{initiatedBy:'FREELANCER',requestKind:'WORK'}};
  const response=await directoryRoute([],{session:{role:'FREELANCER',userId:'editor'},teamRequests:[request]}).GET(new Request('https://qa.test'));
  const body=await response.json();assert.equal(body.requests.length,0);assert.equal(body.history[0].direction,'FREELANCER_TO_AGENCY');assert.equal(body.history[0].status,'PENDING');assert.equal(body.history[0].requestKind,'WORK');assert.equal(body.history[0].invitedByName,null);
});
