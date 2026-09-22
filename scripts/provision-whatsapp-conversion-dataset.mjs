// Explicit setup only. Keeps delivery disabled until the source-aware release is deployed.
// Uses the existing WABA event-management grant; never changes messaging credentials.
import { readFile, writeFile, rename, mkdir, copyFile, chmod } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'dotenv';

async function main() {
  const apply = process.argv.includes('--apply');
  if (process.argv.slice(2).some(arg => arg !== '--apply')) throw Error('Unknown argument');
  if (resolve('.env') !== '/var/www/gigxomi-app/.env') throw Error('Incorrect server directory');
  let snapshot;
  for (let attempt=0;attempt<5;attempt++) {
    try { snapshot=JSON.parse(await readFile('.gigxomi/local-platform-store.json','utf8')); break; }
    catch { await new Promise(resolve => setTimeout(resolve,150)); }
  }
  if (!snapshot) throw Error('No stable snapshot');
  const matches=(snapshot.whatsappStates??[]).filter(s=>String(s.phoneNumber??'').replace(/\D/g,'')==='919993328124');
  if (matches.length!==1) throw Error('Expected exactly one recipient');
  const state=matches[0];
  if (!state.pluginEnabled || !/^\d+$/.test(state.wabaId??'') || !state.accessToken) throw Error('Connection incomplete');
  async function graph(edge, body) {
    const response=await fetch(`https://graph.facebook.com/v25.0/${edge}`, {
      method:body?'POST':'GET', headers:{Authorization:`Bearer ${state.accessToken}`,'Content-Type':'application/json'},
      ...(body?{body:JSON.stringify(body)}:{}), signal:AbortSignal.timeout(15000),
    });
    const result=await response.json();
    if (!response.ok || result.error) throw Error(`Meta error ${result.error?.code??response.status}`);
    return result;
  }
  const owner=await graph(`${state.wabaId}?fields=owner_business_info`);
  if (owner.owner_business_info?.id!=='100910602174128') throw Error('Unexpected WABA owner');
  const permissions=await graph('me/permissions');
  if (!permissions.data?.some(p=>p.permission==='whatsapp_business_manage_events'&&p.status==='granted')) throw Error('Event-management grant missing');
  const linked=await graph(`${state.wabaId}/dataset?fields=id`);
  const ids=Array.isArray(linked.data)?linked.data.map(item=>item.id):linked.id?[linked.id]:[];
  if (ids.length>1) throw Error('Ambiguous dataset association');
  if (!apply) {console.log(JSON.stringify({ready:true,recipient:'…8124',businessVerified:true,eventGrant:true,linkedDatasets:ids,mode:'dry-run'}));return;}
  const backupDir='/var/backups/gigxomi-capi';
  await mkdir(backupDir,{recursive:true,mode:0o700});
  const backup=`${backupDir}/env-before-waba-dataset-${new Date().toISOString().replace(/[:.]/g,'-')}.env`;
  await copyFile('.env',backup); await chmod(backup,0o600);
  async function updateEnv(values) {
    let raw=await readFile('.env','utf8');
    for (const [key,value] of Object.entries(values)) {
      if (/[\r\n]/.test(value)) throw Error('Unsafe config value');
      const pattern=new RegExp(`^(?:export\\s+)?${key}=.*$`,'gm');
      raw=pattern.test(raw)?raw.replace(pattern,`${key}=${value}`):`${raw.trimEnd()}\n${key}=${value}\n`;
    }
    const temp=`.env.waba-${process.pid}.tmp`;
    await writeFile(temp,raw,{mode:0o600,flag:'wx'}); await rename(temp,'.env');
  }
  // Older deployed code must not send WhatsApp events to the website dataset.
  await updateEnv({META_CAPI_ENABLED:'false'});
  const created=ids.length?null:await graph(`${state.wabaId}/dataset`,{dataset_name:'Gigxomi WhatsApp 8124 Conversions'});
  const datasetId=ids[0]??created?.id;
  if (!/^\d+$/.test(datasetId??'')) throw Error('Dataset ID missing; inspect read-back before retrying');
  const verified=await graph(`${state.wabaId}/dataset?fields=id`);
  const confirmed=(verified.data??[verified]).some(item=>item.id===datasetId);
  if (!confirmed) throw Error('Dataset read-back mismatch');
  const env=parse(await readFile('.env','utf8'));
  if (env.META_CAPI_WHATSAPP_DATASET_ID && env.META_CAPI_WHATSAPP_DATASET_ID!==datasetId) throw Error('Existing reporting destination differs');
  await updateEnv({META_CAPI_WHATSAPP_DATASET_ID:datasetId,META_CAPI_WHATSAPP_ACCESS_TOKEN:state.accessToken});
  console.log(JSON.stringify({configured:true,created:Boolean(created),datasetId,linkedToWhatsApp:true,recipient:'…8124',deliveryEnabled:false,backup}));
}
main().catch(error=>{console.error(/^Meta error \d+$/.test(error.message)?error.message:'WhatsApp dataset setup failed; inspect the read-only preflight before retrying.');process.exitCode=1;});
