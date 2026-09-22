// Server-only rollout helper. Dry-run by default; never prints credentials.
import { readFile, copyFile, chmod, mkdir, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { parse } from 'dotenv';

async function main() {
  if (process.argv.slice(2).some((arg) => arg !== '--apply-whatsapp')) throw new Error('Unknown argument');
  const envPath = resolve('.env');
  if (envPath !== '/var/www/gigxomi-app/.env') throw new Error('Run only from the verified production application directory');
  const raw = await readFile(envPath, 'utf8');
  const env = parse(raw);
  if (env.META_CAPI_DATASET_ID !== '1071501248618259' || !env.META_CAPI_ACCESS_TOKEN?.trim()) throw new Error('The verified dataset/token configuration is missing');
  if (!/^\d+$/.test(env.META_CAPI_WHATSAPP_DATASET_ID ?? '') || !env.META_CAPI_WHATSAPP_ACCESS_TOKEN?.trim()) throw new Error('Provision the separate WhatsApp dataset/credential first');
  const snapshot = JSON.parse(await readFile('.gigxomi/local-platform-store.json', 'utf8'));
  const matches = (snapshot.whatsappStates ?? []).filter((state) => String(state.phoneNumber ?? '').replace(/\D/g, '') === '919993328124');
  if (matches.length !== 1) throw new Error('Expected exactly one saved 8124 connection');
  const state = matches[0];
  if (!state.pluginEnabled || !/^[a-zA-Z0-9_-]+$/.test(state.tenantId ?? '') || !/^\d+$/.test(state.phoneNumberId ?? '') || !/^\d+$/.test(state.wabaId ?? '')) throw new Error('Saved WhatsApp connection is incomplete');
  if (env.META_CAPI_WHATSAPP_TENANT_ID && env.META_CAPI_WHATSAPP_TENANT_ID !== state.tenantId) throw new Error('Configured tenant differs from verified connection');
  if (env.META_CAPI_WHATSAPP_PHONE_NUMBER_ID && env.META_CAPI_WHATSAPP_PHONE_NUMBER_ID !== state.phoneNumberId) throw new Error('Configured phone ID differs from verified connection');
  const start = env.META_CAPI_WHATSAPP_START_AT || new Date().toISOString();
  if (!Number.isFinite(Date.parse(start))) throw new Error('Invalid existing attribution start time');
  const values = {
    META_CAPI_ENABLED: 'true', META_CAPI_WEBSITE_ENABLED: 'false',
    META_CAPI_WHATSAPP_TENANT_ID: state.tenantId,
    META_CAPI_WHATSAPP_PHONE_NUMBER_ID: state.phoneNumberId,
    META_CAPI_WHATSAPP_START_AT: start,
    ...(!env.CRON_SECRET ? { CRON_SECRET: randomBytes(32).toString('hex') } : {}),
  };
  if (!process.argv.includes('--apply-whatsapp')) {
    console.log(JSON.stringify({ ready: true, mode: 'dry-run', recipient: '…8124', websiteWillRemainDisabled: true, existingCronSecret: Boolean(env.CRON_SECRET) }));
    return;
  }
  const backupDir = '/var/backups/gigxomi-capi';
  await mkdir(backupDir, { recursive: true, mode: 0o700 });
  const backup = `${backupDir}/env-before-whatsapp-${new Date().toISOString().replace(/[:.]/g, '-')}.env`;
  await copyFile(envPath, backup);
  await chmod(backup, 0o600);
  let next = raw;
  for (const [key, value] of Object.entries(values)) {
    const line = new RegExp(`^(?:export\\s+)?${key}=.*$`, 'gm');
    next = line.test(next) ? next.replace(line, `${key}=${value}`) : `${next.trimEnd()}\n${key}=${value}\n`;
  }
  const temporaryPath = `${envPath}.meta-capi-${process.pid}.tmp`;
  await writeFile(temporaryPath, next, { mode: 0o600, flag: 'wx' });
  await rename(temporaryPath, envPath);
  console.log(JSON.stringify({ configured: true, recipient: '…8124', websiteEnabled: false, backup, restartRequired: true }));
}
main().catch(() => { console.error('WhatsApp CAPI configuration failed preflight or write; inspect configuration without exposing secrets.'); process.exitCode = 1; });
