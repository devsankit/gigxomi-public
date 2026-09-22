import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function source(relativePath) {
  return readFile(new URL('../' + relativePath, import.meta.url), 'utf8');
}

test('Freelancer navigation items are streamlined to eliminate confusing duplicate service options', async () => {
  const data = await source('src/lib/gigxomi/freelancer-data.ts');

  // Verify freelancerNavItems contains My Services and does NOT contain separate portfolio-drafts or add-service items
  assert.match(data, /export const freelancerNavItems:\s*Array<\{ id: FreelancerSection; label: string; href\?: string \}> = \[\s*\{ id: "dashboard", label: "Dashboard", href: "\/freelancer" \},\s*\{ id: "chats", label: "Chats", href: "\/freelancer\/chat" \},\s*\{ id: "projects", label: "Project Tracking", href: "\/freelancer\/projects" \},\s*\{ id: "apply-work", label: "Apply for Work", href: "\/freelancer\/apply-for-work" \},\s*\{ id: "services", label: "My Services", href: "\/freelancer\/services" \},\s*\{ id: "payouts", label: "Earnings", href: "\/freelancer\/payouts" \},\s*\{ id: "profile", label: "Profile", href: "\/freelancer\/profile" \},\s*\];/);

  // Assert neither portfolio-drafts nor add-service is in the active nav array
  const navBlock = data.match(/export const freelancerNavItems[\s\S]*?\];/)?.[0] || '';
  assert.ok(!navBlock.includes('id: "portfolio-drafts"'), 'portfolio-drafts must not be a standalone sidebar item');
  assert.ok(!navBlock.includes('id: "add-service"'), 'add-service must not be a standalone sidebar item');
  assert.ok(navBlock.includes('id: "services"'), 'services (My Services) must be present in sidebar');
});

test('FreelancerShell maps all service, draft, and portfolio paths to services section', async () => {
  const shell = await source('src/components/freelancer/freelancer-shell.tsx');

  assert.match(shell, /pathname\.startsWith\("\/freelancer\/add-service"\)/);
  assert.match(shell, /pathname\.startsWith\("\/freelancer\/draft-services"\)/);
  assert.match(shell, /pathname\.startsWith\("\/freelancer\/published-services"\)/);
  assert.match(shell, /pathname\.startsWith\("\/freelancer\/portfolio-drafts"\)/);
  assert.match(shell, /pathname\.startsWith\("\/freelancer\/portfolio"\)/);
  assert.match(shell, /pathname\.startsWith\("\/freelancer\/services"\)/);
  assert.match(shell, /return "services";/);
});

test('Legacy service & portfolio routes seamlessly redirect to unified services hub tabs', async () => {
  const addServicePage = await source('src/app/freelancer/add-service/page.tsx');
  const portfolioPage = await source('src/app/freelancer/portfolio/page.tsx');
  const portfolioDraftsPage = await source('src/app/freelancer/portfolio-drafts/page.tsx');
  const portfolioDetailPage = await source('src/app/freelancer/portfolio-drafts/[id]/page.tsx');
  const draftServicesPage = await source('src/app/freelancer/draft-services/page.tsx');
  const publishedServicesPage = await source('src/app/freelancer/published-services/page.tsx');
  const legacySlugPage = await source('src/app/freelancer/[...legacySlug]/page.tsx');

  assert.match(addServicePage, /tab.*?add/);
  assert.match(portfolioPage, /tab.*?portfolio/);
  assert.match(portfolioDraftsPage, /tab.*?portfolio/);
  assert.match(portfolioDetailPage, /tab=portfolio&draft=/);
  assert.match(draftServicesPage, /tab=drafts/);
  assert.match(publishedServicesPage, /tab=published/);
  assert.match(legacySlugPage, /"portfolio"/);
});

test('Services Hub unifies Published, Drafts, In Review, Add Service, and Portfolio Showcases with live metrics', async () => {
  const sectionContent = await source('src/components/freelancer/freelancer-section-content.tsx');
  const serviceLists = await source('src/components/freelancer/freelancer-service-lists.tsx');

  assert.match(sectionContent, /export type ServicesTabId = "published" \| "drafts" \| "review" \| "add" \| "portfolio"/);
  assert.match(sectionContent, /freelancer-services-hub-panel/);
  assert.match(sectionContent, /freelancer-service-metrics-strip/);
  assert.match(sectionContent, /Live \/ Published/);
  assert.match(sectionContent, /In Review/);
  assert.match(sectionContent, /Portfolio Showcases/);
  assert.match(sectionContent, /PublishedServicesSection/);
  assert.match(sectionContent, /DraftServicesSection filter="drafts"/);
  assert.match(sectionContent, /DraftServicesSection\s+filter="review"/);
  assert.match(sectionContent, /FreelancerDynamicAddServiceSection/);
  assert.match(sectionContent, /PublishingAssistant mode="portfolio"/);

  // Service lists verify review filtering and unified drafts + services
  assert.match(serviceLists, /filter\?:\s*"all" \| "drafts" \| "review"/);
  assert.match(serviceLists, /fetchFreelancerServices/);
  assert.match(serviceLists, /Pending Review/);
});

test('FreelancerLiveDashboard incorporates full mobile app feature parity including LMS Learning', async () => {
  const dashboard = await source('src/components/freelancer/freelancer-live-dashboard.tsx');

  // Growth setup card with real-time presence toggle
  assert.match(dashboard, /freelancer-growth-panel/);
  assert.match(dashboard, /freelancer-presence-card/);
  assert.match(dashboard, /handleToggleAvailability/);
  assert.match(dashboard, /freelancer\/availability/);

  // 3 completion checklist tabs
  assert.match(dashboard, /freelancer-completion-tabs/);
  assert.match(dashboard, /href="\/freelancer\/profile"/);
  assert.match(dashboard, /href="\/freelancer\/services\?tab=portfolio"/);
  assert.match(dashboard, /Skills test/);

  // Refer & Earn card
  assert.match(dashboard, /freelancer-referral-panel/);
  assert.match(dashboard, /10% COMMISSION/);
  assert.match(dashboard, /handleCopyReferral/);
  assert.match(dashboard, /Play Store Link/);

  // Workspace snapshot pipeline & money overview
  assert.match(dashboard, /freelancer-pipeline-panel/);
  assert.match(dashboard, /In progress/);
  assert.match(dashboard, /In review/);
  assert.match(dashboard, /Completed/);
  assert.match(dashboard, /freelancer-revenue-panel/);
  assert.match(dashboard, /Money Overview/);

  // Agency network discovery
  assert.match(dashboard, /freelancer-discovery-panel/);
  assert.match(dashboard, /Agency Network/);
  assert.match(dashboard, /Teams you can grow with/);

  // Learning & LMS card (Mobile app parity)
  assert.match(dashboard, /freelancer-learning-panel/);
  assert.match(dashboard, /Your Learning/);
  assert.match(dashboard, /Build your next advantage/);
  assert.match(dashboard, /\/api\/mobile\/v2\/lms/);
  assert.match(dashboard, /freelancer-course-card/);

  // Quick actions
  assert.match(dashboard, /freelancer-quick-actions-panel/);
  assert.match(dashboard, /Open Chat/);
  assert.match(dashboard, /My Services/);
  assert.match(dashboard, /Apply for Work/);
});

test('CSS classes for Services Hub, Mobile-Aligned Dashboard, and Learning exist in globals.css', async () => {
  const css = await source('src/app/globals.css');

  assert.match(css, /\.freelancer-service-metrics-strip/);
  assert.match(css, /\.freelancer-growth-panel/);
  assert.match(css, /\.freelancer-presence-card/);
  assert.match(css, /\.freelancer-completion-tabs/);
  assert.match(css, /\.freelancer-referral-panel/);
  assert.match(css, /\.freelancer-pipeline-panel/);
  assert.match(css, /\.freelancer-revenue-panel/);
  assert.match(css, /\.freelancer-agency-discovery-grid/);
  assert.match(css, /\.freelancer-learning-panel/);
  assert.match(css, /\.freelancer-course-card/);
  assert.match(css, /\.freelancer-quick-actions-grid/);
});
