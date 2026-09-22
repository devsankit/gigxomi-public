import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function source(relativePath) {
  return readFile(new URL('../' + relativePath, import.meta.url), 'utf8');
}

test('Work Hub replaces red error helper-text with work-hub-proposal-text and badges', async () => {
  const component = await source('src/components/admin/admin-work-hub-client.tsx');
  const css = await source('src/app/globals.css');

  assert.match(component, /className="work-hub-proposal-text"/);
  assert.ok(!component.includes('className="helper-text"'), 'helper-text must be completely eliminated from work-hub');
  assert.match(css, /\.work-hub-proposal-text\s*\{[^}]*color:\s*#94A3B8/i);
});

test('Applications table renders badges for Quote, Turnaround, Karma, Status, and modern action buttons', async () => {
  const component = await source('src/components/admin/admin-work-hub-client.tsx');

  assert.match(component, /work-hub-quote-badge/);
  assert.match(component, /work-hub-turnaround-badge/);
  assert.match(component, /work-hub-karma-badge/);
  assert.match(component, /work-hub-status-badge/);
  assert.match(component, /work-hub-btn-select/);
  assert.match(component, /work-hub-btn-shortlist/);
  assert.match(component, /work-hub-btn-reject/);
});

test('Freelancer name is an interactive trigger opening the Freelancer Profile & Portfolio modal', async () => {
  const component = await source('src/components/admin/admin-work-hub-client.tsx');

  assert.match(component, /work-hub-freelancer-trigger/);
  assert.match(component, /openFreelancerProfile/);
  assert.match(component, /fetch\(`\/api\/team\/editor-directory\/\$\{encodeURIComponent\(application\.freelancerId\)\}`/);
});

test('Strict Privacy Rule: Freelancer contact details (phone, email) are NEVER rendered', async () => {
  const component = await source('src/components/admin/admin-work-hub-client.tsx');

  assert.ok(!component.includes('editorProfile.phone'), 'Phone number must never be rendered');
  assert.ok(!component.includes('editorProfile.email'), 'Personal email must never be rendered');
  assert.ok(!component.includes('application.phone'), 'Phone must never be rendered');
  assert.ok(!component.includes('application.email'), 'Email must never be rendered');
  assert.ok(!component.includes('user.phone'), 'User phone must never be rendered');
  assert.ok(!component.includes('user.email'), 'User email must never be rendered');
});

test('Freelancer Profile Modal contains rich portfolio, pitch, trust score, skills, services, and actions', async () => {
  const component = await source('src/components/admin/admin-work-hub-client.tsx');

  assert.match(component, /work-hub-modal-shell/);
  assert.match(component, /work-hub-verification-badge/);
  assert.match(component, /work-hub-trust-badge/);
  assert.match(component, /Application Pitch & Proposal/);
  assert.match(component, /Work & Portfolio Samples/);
  assert.match(component, /combinedPortfolioLinks/);
  assert.match(component, /target="_blank"/);
  assert.match(component, /rel="noopener noreferrer"/);
  assert.match(component, /Skills & Software/);
  assert.match(component, /skillsList/);
  assert.match(component, /Published Services & Standard Rates/);
  assert.match(component, /servicesList/);

  assert.match(component, /handleModalReview\("ACCEPT"\)/);
  assert.match(component, /handleModalReview\("SHORTLIST"\)/);
  assert.match(component, /handleModalReview\("REJECT"\)/);
});

test('Portfolio parsing normalizes raw domains, supports multiple links, and extracts notes', async () => {
  const component = await source('src/components/admin/admin-work-hub-client.tsx');

  assert.match(component, /function normalizeUrlCandidate/);
  assert.match(component, /function parsePortfolioReferences/);
  assert.match(component, /function getPortfolioMeta/);
  assert.match(component, /portfolioNotes/);
  assert.match(component, /Submission Reference Note:/);
});

test('Modal provides inline action alerts and video preview support', async () => {
  const component = await source('src/components/admin/admin-work-hub-client.tsx');
  const css = await source('src/app/globals.css');

  assert.match(component, /modalActionError/);
  assert.match(component, /modalActionNotice/);
  assert.match(component, /work-hub-modal-alert-error/);
  assert.match(component, /work-hub-modal-alert-success/);
  assert.match(component, /work-hub-video-preview/);

  assert.match(css, /\.work-hub-modal-alert-error/);
  assert.match(css, /\.work-hub-modal-alert-success/);
  assert.match(css, /\.work-hub-video-preview/);
  assert.match(css, /\.work-hub-applications-table-shell/);
});

test('Modal manages background body scroll locking and tab deep-linking', async () => {
  const component = await source('src/components/admin/admin-work-hub-client.tsx');

  assert.match(component, /document\.body\.style\.overflow = "hidden"/);
  assert.match(component, /handleTabClick/);
  assert.match(component, /window\.location\.hash/);
  assert.match(component, /hash === "applications"/);
});
