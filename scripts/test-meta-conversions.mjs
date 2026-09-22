// Sends synthetic events only to Meta Test Events, never to production reporting.
import 'dotenv/config';
import { createHash, randomUUID } from 'node:crypto';
const testCode = process.env.META_CAPI_TEST_EVENT_CODE;
if (!/^TEST\d+$/.test(testCode ?? '')) throw new Error('A Meta Test Events code is required');
const token = process.env.META_CAPI_ACCESS_TOKEN;
const dataset = process.env.META_CAPI_DATASET_ID;
if (!token || !/^\d+$/.test(dataset ?? '')) throw new Error('Server CAPI credentials are missing');
const events = ['https://www.gigxomi.com/', 'https://ankit.gigxomi.com/'].map((url) => ({
  event_name: 'PageView', event_id: `qa_${randomUUID()}`, event_time: Math.floor(Date.now() / 1000),
  action_source: 'website', event_source_url: url,
  user_data: { external_id: [createHash('sha256').update('gigxomi-synthetic-capi-test-not-a-customer').digest('hex')], client_ip_address: '192.0.2.1', client_user_agent: 'Gigxomi-CAPI-Validation/1.0' },
  custom_data: { source_surface: url.includes('ankit.') ? 'webinar' : 'web' },
}));
const response = await fetch(`https://graph.facebook.com/v25.0/${dataset}/events`, {
  method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: events, test_event_code: testCode }), signal: AbortSignal.timeout(15000),
});
const result = await response.json();
console.log(JSON.stringify({ status: response.status, events_received: result.events_received, messages: result.messages, trace_id: result.fbtrace_id,
  error: result.error && { code: result.error.code, subcode: result.error.error_subcode, message: result.error.message, detail: result.error.error_user_msg } }));
if (!response.ok || result.events_received !== events.length) process.exitCode = 1;
