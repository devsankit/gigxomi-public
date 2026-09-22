import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import test from 'node:test';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
function load(path, mocks = {}, overrides = {}) {
  const code = ts.transpileModule(source(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  new Function('require','module','exports', ...Object.keys(overrides), code)((id) => id === 'server-only' ? {} : id in mocks ? mocks[id] : require(id), loaded, loaded.exports, ...Object.values(overrides));
  return loaded.exports;
}
const policy = load('src/lib/meta/conversion-contract.ts');
const stub = { metaConversionEvent: {} };
const service = (prisma = stub, fetch = () => { throw Error('Unexpected network'); }) => load('src/lib/meta/conversions-api.ts', { '@/lib/prisma': { prisma }, './conversion-contract': policy }, { fetch, process: { env: { META_CAPI_ENABLED:'true', META_CAPI_WEBSITE_ENABLED:'true', META_CAPI_DATASET_ID: '123', META_CAPI_ACCESS_TOKEN: 'TEST_ONLY', META_CAPI_WHATSAPP_DATASET_ID:'456', META_CAPI_WHATSAPP_ACCESS_TOKEN:'WA_TEST_ONLY' } } });

test('public URL policy excludes private pages, tokens, noncanonical hosts and credentials', () => {
  for (const path of ['/admin/chat', '/login', '/signup', '/api/meta/conversions', '/subscription-checkout', '/mobile/billing-return', '/webinar/thank-you/person', '/blog/post?token=secret']) assert.equal(policy.publicMetaUrl(`https://www.gigxomi.com${path}`), null);
  for (const url of ['https://evil.test/', 'http://gigxomi.com/', 'https://gigxomi.com:333/', 'https://user:pass@gigxomi.com/']) assert.equal(policy.publicMetaUrl(url), null);
  assert.equal(policy.publicMetaUrl('https://ankit.gigxomi.com/?utm_source=organic'), 'https://ankit.gigxomi.com/');
  assert.equal(policy.publicMetaUrl('https://www.gigxomi.com/blog/editing?fbclid=abc#email'), 'https://www.gigxomi.com/blog/editing');
});
test('consent must be explicit and complete; opt-out defaults to no tracking', () => {
  for (const cookie of [null, '', '__Host-gx_meta_consent=denied', 'not__Host-gx_meta_consent=granted']) assert.equal(policy.hasMetaConsent(cookie), false);
  assert.equal(policy.hasMetaConsent('other=x; __Host-gx_meta_consent=granted'), true);
});
test('organic webinar source stays distinct without invented click IDs', () => {
  const event = service().buildMetaEvent({ eventName: 'CompleteRegistration', eventId: 'registration-1', source: 'WEBINAR', eventSourceUrl: 'https://ankit.gigxomi.com/' });
  assert.equal(event.custom_data.source_surface, 'webinar');
  assert.equal(event.user_data.fbc, undefined);
  assert.equal(event.user_data.ctwa_clid, undefined);
  assert.equal(event.action_source, 'website');
});
test('hashes contact identifiers and strips URL query while keeping deduplication ID/time', () => {
  const event = service().buildMetaEvent({ eventName: 'Lead', eventId: 'stable-1', eventTime: 123, source: 'WEB', eventSourceUrl: 'https://www.gigxomi.com/?utm_source=abc', userData: { email: ' TEST@example.com ', phone: '+91 99933 28124' } });
  assert.equal(event.user_data.em[0], createHash('sha256').update('test@example.com').digest('hex'));
  assert.equal(event.user_data.ph[0], createHash('sha256').update('919993328124').digest('hex'));
  assert.equal(event.event_source_url, 'https://www.gigxomi.com/');
  assert.equal(event.event_id, 'stable-1'); assert.equal(event.event_time, 123);
});
test('WhatsApp requires actual click ID, WABA and business-messaging channel', () => {
  const input = { eventName: 'LeadSubmitted', eventId: 'wa-1', source: 'WHATSAPP', userData: { ctwaClid: 'original-click', wabaId: '12345' } };
  const event = service().buildMetaEvent(input);
  assert.equal(event.action_source, 'business_messaging'); assert.equal(event.messaging_channel, 'whatsapp');
  assert.equal(event.user_data.ctwa_clid, 'original-click'); assert.equal(event.user_data.whatsapp_business_account_id, '12345');
  assert.equal(event.event_source_url, undefined); assert.equal(event.user_data.ph, undefined);
  assert.throws(() => service().buildMetaEvent({ ...input, userData: {} }));
});
test('enqueue persists first and replay has an empty update; never calls network', async () => {
  const writes = [];
  const api = service({ metaConversionEvent: { upsert: async (args) => writes.push(args) } });
  await api.enqueueMetaConversion({ eventName:'PageView', source:'WEB', eventId:'same', eventSourceUrl:'https://www.gigxomi.com/' });
  assert.deepEqual(writes[0].update, {}); assert.equal(writes[0].create.status, 'PENDING');
});

test('WhatsApp-only rollout refuses website events and filters the delivery queue', async () => {
  let query;
  const prisma = { metaConversionEvent: { updateMany: async () => ({}), deleteMany: async () => ({}), findMany: async (args) => { query=args; return []; }, upsert: async () => { throw Error('Website must not enqueue'); } } };
  const api = load('src/lib/meta/conversions-api.ts', { '@/lib/prisma': { prisma }, './conversion-contract': policy }, { process: { env: { META_CAPI_ENABLED:'true', META_CAPI_WEBSITE_ENABLED:'false', META_CAPI_DATASET_ID:'123', META_CAPI_ACCESS_TOKEN:'TEST_ONLY', META_CAPI_WHATSAPP_DATASET_ID:'456', META_CAPI_WHATSAPP_ACCESS_TOKEN:'WA_TEST_ONLY' } } });
  assert.equal(api.getMetaConversionConfig().websiteEnabled,false);
  assert.deepEqual(await api.enqueueMetaConversion({eventName:'PageView',source:'WEB',eventId:'pv_test',eventSourceUrl:'https://www.gigxomi.com/'}), {queued:false,reason:'website_disabled'});
  await api.deliverMetaConversions('wa_qualified_test');
  assert.deepEqual(query.where.AND[0].OR,[{datasetId:'456',source:{in:['WHATSAPP']}}]);
  assert.equal(query.where.eventId,'wa_qualified_test');
});

test('WhatsApp has its own dataset and token with no website credential fallback', async () => {
  assert.equal(service().getMetaConversionConfig('WHATSAPP').datasetId,'456');
  assert.equal(service().getMetaConversionConfig('WHATSAPP').accessToken,'WA_TEST_ONLY');
  const api = load('src/lib/meta/conversions-api.ts', { '@/lib/prisma': { prisma:stub }, './conversion-contract': policy }, { process: { env: {META_CAPI_ENABLED:'true',META_CAPI_DATASET_ID:'123',META_CAPI_ACCESS_TOKEN:'TEST_ONLY'} } });
  assert.equal(api.getMetaConversionConfig('WHATSAPP').accessToken,'');
  assert.equal((await api.enqueueMetaConversion({source:'WHATSAPP',eventName:'LeadSubmitted',eventId:'wa_test'})).queued,false);
  const db=deliveryStore();
  db.metaConversionEvent.findMany=async()=>[{id:'row',eventId:'wa',datasetId:'456',source:'WHATSAPP',status:'PENDING',attemptCount:0,updatedAt:new Date(0),metadata:{event_id:'wa'}}];
  let request;
  await service(db,async(url,init)=>{request={url,init};return Response.json({events_received:1})}).deliverMetaConversions();
  assert.match(request.url,/\/456\/events$/);
  assert.equal(request.init.headers.Authorization,'Bearer WA_TEST_ONLY');
});
function deliveryStore() {
  const writes = [];
  return { writes, metaConversionEvent: {
    updateMany: async (args) => { writes.push(args); return { count: 1 }; }, deleteMany: async () => ({}),
    findMany: async () => [{ id:'row', eventId:'same', datasetId:'123', status:'PENDING', attemptCount:0, updatedAt:new Date(0), metadata:{ event_id:'same', event_time:123 } }],
    update: async (args) => writes.push(args),
  } };
}
test('delivery uses a lease, bearer header and clears identifiers on accepted event', async () => {
  const db = deliveryStore();
  let request;
  const result = await service(db, async (url, init) => { request = {url, init}; return Response.json({events_received:1, fbtrace_id:'trace'}); }).deliverMetaConversions();
  assert.equal(result.sent, 1); assert.ok(!request.url.includes('access_token'));
  assert.equal(request.init.headers.Authorization, 'Bearer TEST_ONLY');
  assert.equal(JSON.parse(request.init.body).data[0].event_time, 123);
  assert.ok(db.writes.some((write) => write.where.updatedAt && write.data.status === 'SENDING'));
  assert.deepEqual(db.writes.at(-1).data.metadata, {});
});
test('HTTP 200 without event acceptance is retried, not falsely marked sent', async () => {
  const db = deliveryStore();
  const result = await service(db, async () => Response.json({events_received:0})).deliverMetaConversions();
  assert.equal(result.failed, 1); assert.equal(db.writes.at(-1).data.status, 'FAILED');
  assert.equal(policy.deliveryRetryDelay(2), 120000); assert.equal(policy.deliveryRetryDelay(20), 3600000);
});
test('website route rejects client sales, requires consent/origin and bounds requests', () => {
  assert.deepEqual(policy.CLIENT_META_EVENTS, ['PageView', 'ViewContent']);
  const route = source('src/app/api/meta/conversions/route.ts');
  assert.match(route, /length > 4096/); assert.match(route, /count > 30/); assert.match(route, /websiteConversionContext/);
  const gate = load('src/lib/meta/website-conversion.ts', { './conversion-contract':policy });
  assert.equal(gate.websiteConversionContext(new Request('https://www.gigxomi.com/'), 'https://www.gigxomi.com/'), null);
  assert.equal(gate.websiteConversionContext(new Request('https://www.gigxomi.com/', {headers:{origin:'https://evil.test',cookie:'__Host-gx_meta_consent=granted'}}), 'https://www.gigxomi.com/'), null);
});
test('messaging ingress remains independent; attribution only reads processed exact tenant/phone/message', () => {
  for (const channel of ['whatsapp','instagram']) assert.doesNotMatch(source(`src/app/api/meta/${channel}/webhook/route.ts`), /conversions-api|AdAttribution|captureWhatsAppAdLeads/);
  const worker = source('src/lib/meta/whatsapp-ad-attribution.ts');
  for (const text of ['processedAt','routingStatus','META_CAPI_WHATSAPP_TENANT_ID','META_CAPI_WHATSAPP_PHONE_NUMBER_ID','externalMessageId: row.messageId','sourceChannel !== "whatsapp"','"ATTRIBUTED"']) assert.ok(worker.includes(text), text);
  assert.doesNotMatch(worker, /salesLeadAssignment.findFirst|status: "PENDING"/);
  assert.match(source('src/lib/gigxomi/sales-store.ts'), /conversationId: poolItem\.conversationId/);
});

function qualificationDb() {
  const events = new Map(), writes = [];
  const db = {
    salesLeadPoolItem: { findFirst: async () => ({ id: 'pool' }) },
    appConversation: { findFirst: async () => ({ payload: { sourceChannel: 'whatsapp' } }) },
    metaConversionEvent: {
      findUnique: async ({ where }) => events.get(where.eventId) ?? null,
      findFirst: async () => ({ metadata: { event_name:'LeadSubmitted', event_time:100, user_data:{ ctwa_clid:'original', whatsapp_business_account_id:'123' }, action_source:'business_messaging', messaging_channel:'whatsapp' } }),
      create: async ({data}) => { events.set(data.eventId, data); writes.push(data); },
    },
    salesLeadAssignment: { findUniqueOrThrow: async () => ({tags:[],conversationId:'conv'}), update: async ({data}) => writes.push(data) },
  };
  db.$transaction = async (fn) => fn(db);
  return {db,events,writes};
}
function qualification(db) {
  return load('src/lib/meta/sales-qualification.ts', { '@/lib/prisma':{prisma:db}, './conversions-api':{ getMetaConversionConfig:()=>({accessToken:'TEST_ONLY',datasetId:'123'}) } }, {process:{env:{META_CAPI_WHATSAPP_TENANT_ID:'tenant'}}});
}
test('explicit qualification adds CRM label and audit entry; replay cannot send twice', async () => {
  const {db,events,writes} = qualificationDb();
  const api = qualification(db), lead = {id:'lead',conversationId:'conv'};
  assert.equal((await api.getSalesMetaStatus(lead)).eligible, true);
  const first = await api.qualifySalesLeadForMeta(lead,'actor');
  const second = await api.qualifySalesLeadForMeta(lead,'actor');
  assert.equal(first.eventId,second.eventId); assert.equal(events.size,1); assert.equal(writes.length,2);
  assert.deepEqual(writes[1].tags,['Meta qualified lead']);
  assert.equal(writes[1].activityLogs.create.actorUserId,'actor');
  assert.equal(writes[0].metadata.user_data.ctwa_clid,'original');
  assert.equal(writes[0].metadata.event_id,first.eventId);
  assert.equal(writes[0].status,'PENDING');
  assert.equal((await api.getSalesMetaStatus(lead)).qualified,true);
});
test('organic/unclaimed links and Instagram cannot be reported as WhatsApp ad leads', async () => {
  const {db,writes} = qualificationDb();
  db.salesLeadPoolItem.findFirst = async () => null;
  const api = qualification(db), lead={id:'lead',conversationId:'conv'};
  assert.equal((await api.getSalesMetaStatus(lead)).eligible,false);
  await assert.rejects(api.qualifySalesLeadForMeta(lead,'actor'));
  db.salesLeadPoolItem.findFirst=async()=>({id:'pool'});
  db.appConversation.findFirst=async()=>({payload:{sourceChannel:'instagram'}});
  await assert.rejects(api.qualifySalesLeadForMeta(lead,'actor'));
  assert.equal(writes.length,0);
});
test('expired or absent ad attribution fails closed', async () => {
  const {db,writes}=qualificationDb(); db.metaConversionEvent.findFirst=async()=>null;
  const api=qualification(db),lead={id:'lead',conversationId:'conv'};
  assert.equal((await api.getSalesMetaStatus(lead)).eligible,false);
  await assert.rejects(api.qualifySalesLeadForMeta(lead,'actor'));
  assert.equal(writes.length,0);
});
test('qualification API requires role, visible lead and explicit confirmation before post-response delivery', () => {
  const route=source('src/app/api/sales/meta-conversions/route.ts');
  assert.match(route,/requireSessionRole\(\["SUPER_ADMIN", "SALES_AGENT"\]/);
  assert.match(route,/snapshot.visibleLeads.find/);
  assert.match(route,/confirmQualified !== true/);
  assert.match(route,/after\(async/);
  assert.match(route,/deliverMetaConversions\(result.eventId\)/);
});
test('browser and server registration share event ID; checkout is not Purchase', () => {
  const route = source('src/app/api/gapp/webinar/register/route.ts');
  assert.match(route, /"merchantTransactionId" in result \? "Lead" : "CompleteRegistration"/);
  assert.doesNotMatch(route, /eventName: "Purchase"/);
  assert.match(source('src/components/public/gapp-webinar-landing.tsx'), /eventID: payload.metaEvent.eventId/);
  assert.match(source('src/components/public/meta-measurement.tsx'), /autoConfig.*, false/);
});
