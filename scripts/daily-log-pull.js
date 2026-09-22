const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(process.cwd(), 'logs');

function summarizeDailyLogs() {
  if (!fs.existsSync(LOGS_DIR)) {
    console.log('No logs directory found on server yet.');
    return;
  }

  const files = fs.readdirSync(LOGS_DIR).filter((f) => f.startsWith('mobile-events-') && f.endsWith('.log'));
  if (!files.length) {
    console.log('No mobile telemetry log files recorded yet.');
    return;
  }

  const latestFile = files.sort().reverse()[0];
  console.log('Reviewing latest log file:', latestFile);

  const content = fs.readFileSync(path.join(LOGS_DIR, latestFile), 'utf8');
  const lines = content.trim().split('\n').filter(Boolean);

  const events = [];
  for (const line of lines) {
    try {
      events.push(JSON.parse(line));
    } catch {}
  }

  const errors = events.filter((e) => e.level === 'error');
  const touchpoints = events.filter((e) => e.level !== 'error');

  console.log('--- DAILY TELEMETRY SUMMARY ---');
  console.log('Total Touchpoint Events:', touchpoints.length);
  console.log('Total Errors Detected:', errors.length);

  if (errors.length > 0) {
    console.log('\n--- TOP ERRORS CLUSTERED ---');
    const grouped = {};
    for (const err of errors) {
      const key = `[${err.eventName}] ${err.error?.message || JSON.stringify(err.error)}`;
      grouped[key] = (grouped[key] || 0) + 1;
    }
    for (const [msg, count] of Object.entries(grouped)) {
      console.log(`[${count}x] ${msg}`);
    }
  } else {
    console.log('Status: All mobile touchpoints running smoothly with 0 errors.');
  }
}

summarizeDailyLogs();
