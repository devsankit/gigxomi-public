import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Freelancer navigation includes Project Tracking", () => {
  const dataPath = path.join(process.cwd(), "src", "lib", "gigxomi", "freelancer-data.ts");
  const content = fs.readFileSync(dataPath, "utf8");

  assert.ok(content.includes('"projects"'), "FreelancerSection must include 'projects'");
  assert.ok(content.includes('/freelancer/projects'), "freelancerNavItems must link to /freelancer/projects");
  assert.ok(content.includes('"Project Tracking"'), "freelancerNavItems must have label 'Project Tracking'");
});

test("Freelancer shell maps projects section and icon", () => {
  const shellPath = path.join(process.cwd(), "src", "components", "freelancer", "freelancer-shell.tsx");
  const content = fs.readFileSync(shellPath, "utf8");

  assert.ok(content.includes("FolderKanban"), "FreelancerShell must import FolderKanban");
  assert.ok(content.includes("projects: FolderKanban"), "navIcons must map projects to FolderKanban");
  assert.ok(content.includes('projects: "Project Tracking"'), "sectionTitles must map projects to 'Project Tracking'");
  assert.ok(content.includes('/freelancer/projects'), "getActiveFreelancerSection must check /freelancer/projects");
});

test("Lead status API allows FREELANCER role", () => {
  const apiPath = path.join(process.cwd(), "src", "app", "api", "conversations", "[id]", "lead-status", "route.ts");
  const content = fs.readFileSync(apiPath, "utf8");

  assert.ok(content.includes('"FREELANCER"'), "lead-status route must allow FREELANCER role");
});

test("Freelancer projects pages and components exist", () => {
  const pagePath = path.join(process.cwd(), "src", "app", "freelancer", "projects", "page.tsx");
  assert.ok(fs.existsSync(pagePath), "src/app/freelancer/projects/page.tsx must exist");
  const pageContent = fs.readFileSync(pagePath, "utf8");
  assert.ok(pageContent.includes("FreelancerProjectTrackingKanban"), "Projects page must render FreelancerProjectTrackingKanban");

  const redirectPath = path.join(process.cwd(), "src", "app", "freelancer", "project-tracking", "page.tsx");
  assert.ok(fs.existsSync(redirectPath), "src/app/freelancer/project-tracking/page.tsx must exist");
  const redirectContent = fs.readFileSync(redirectPath, "utf8");
  assert.ok(redirectContent.includes('permanentRedirect("/freelancer/projects")'), "Legacy route must redirect to /freelancer/projects");

  const compPath = path.join(process.cwd(), "src", "components", "freelancer", "freelancer-project-tracking-kanban.tsx");
  assert.ok(fs.existsSync(compPath), "FreelancerProjectTrackingKanban component must exist");
  const compContent = fs.readFileSync(compPath, "utf8");
  assert.ok(compContent.includes("export function FreelancerProjectTrackingKanban"), "Component must export FreelancerProjectTrackingKanban");
  assert.ok(compContent.includes("pt-kanban-root"), "Component must use pt-kanban-root styling");
  assert.ok(compContent.includes("activeColumns"), "Component must dynamically compute activeColumns from manager leadStatuses");
});

test("Freelancer legacy slug whitelist includes projects and project-tracking", () => {
  const slugPath = path.join(process.cwd(), "src", "app", "freelancer", "[...legacySlug]", "page.tsx");
  const content = fs.readFileSync(slugPath, "utf8");

  assert.ok(content.includes('"projects"'), "KNOWN_FREELANCER_INTERNAL_ROUTES must include 'projects'");
  assert.ok(content.includes('"project-tracking"'), "KNOWN_FREELANCER_INTERNAL_ROUTES must include 'project-tracking'");
});
