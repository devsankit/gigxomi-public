// Read-only, aggregate-only inspection. No message bodies, contact details or tokens in output.
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
const snapshot = JSON.parse(await readFile('.gigxomi/local-platform-store.json', 'utf8'));
const matches = (snapshot.whatsappStates ?? []).filter((s) => String(s.phoneNumber ?? '').replace(/\D/g, '') === '919993328124');
if (matches.length !== 1) throw new Error(`Expected one 8124 connection, found ${matches.length}`);
const state = matches[0];
let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl?.startsWith('prisma+postgres://')) {
  const key = new URL(databaseUrl).searchParams.get('api_key');
  databaseUrl = JSON.parse(Buffer.from(key.includes('.') ? key.split('.')[1] : key, 'base64url').toString()).databaseUrl;
}
const url = new URL(databaseUrl);
const pool = new Pool({ host: url.hostname, port: Number(url.port || 5432), database: url.pathname.slice(1), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), ssl: url.hostname.includes('pooler.supabase.com') ? { rejectUnauthorized: false } : undefined });
try {
  const { rows } = await pool.query(`SELECT count(*)::int AS inbound_messages,
    count(*) FILTER (WHERE "processedAt" IS NOT NULL)::int AS processed_messages,
    count(*) FILTER (WHERE "payloadJson"->'message'->'referral'->>'ctwa_clid' IS NOT NULL)::int AS ad_click_referrals,
    max("createdAt") AS latest_inbound, max("processedAt") AS latest_processed
    FROM whatsapp_webhook_message_events WHERE "tenantId"=$1 AND "phoneNumberId"=$2 AND "createdAt">now()-interval '7 days'`, [state.tenantId, state.phoneNumberId]);
  const hasLedger = (await pool.query("SELECT to_regclass('public.meta_conversion_events') AS ledger")).rows[0].ledger;
  const ledger = hasLedger ? (await pool.query('SELECT source,status,count(*)::int AS count FROM meta_conversion_events GROUP BY source,status')).rows : [];
  console.log(JSON.stringify({ recipient: '…8124', pluginEnabled: state.pluginEnabled, window: '7 days', ...rows[0], conversionSchemaDeployed: Boolean(hasLedger), conversionEnabled: process.env.META_CAPI_ENABLED === 'true', websiteEnabled: process.env.META_CAPI_WEBSITE_ENABLED === 'true', ledger }, null, 2));
} finally { await pool.end(); }
