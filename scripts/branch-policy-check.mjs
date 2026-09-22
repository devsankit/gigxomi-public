#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const strict = process.argv.includes("--strict") || process.env.CI === "true";
const deployWebOnly = process.env.DEPLOY_WEB_ONLY === "true";

function git(args) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 8,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function getBranchName() {
  if (process.env.GITHUB_HEAD_REF) {
    return process.env.GITHUB_HEAD_REF;
  }

  if (process.env.GITHUB_REF_NAME) {
    return process.env.GITHUB_REF_NAME;
  }

  try {
    return git(["rev-parse", "--abbrev-ref", "HEAD"]);
  } catch {
    return "unknown";
  }
}

function readGithubEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !existsSync(eventPath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(eventPath, "utf8"));
  } catch {
    return null;
  }
}

function splitFileList(output) {
  if (!output) {
    return [];
  }

  return output
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean)
    .map((file) => file.replace(/\\/g, "/"));
}

function getCiChangedFiles() {
  if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
    return null;
  }

  const event = readGithubEvent();
  const eventName = process.env.GITHUB_EVENT_NAME;

  try {
    if (eventName === "pull_request" && process.env.GITHUB_BASE_REF) {
      git(["fetch", "--no-tags", "--depth=1", "origin", process.env.GITHUB_BASE_REF]);
      return splitFileList(git(["diff", "--name-only", `origin/${process.env.GITHUB_BASE_REF}...HEAD`]));
    }

    if (eventName === "push" && event?.before && event?.after && !/^0+$/.test(event.before)) {
      return splitFileList(git(["diff", "--name-only", event.before, event.after]));
    }

    if (eventName === "push") {
      return splitFileList(git(["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"]));
    }
  } catch (error) {
    console.warn(`Could not resolve CI diff range, falling back to working tree: ${error.message}`);
  }

  return null;
}

function getChangedFiles() {
  const ciChangedFiles = getCiChangedFiles();
  if (ciChangedFiles) {
    return ciChangedFiles;
  }

  const status = git(["status", "--porcelain=v1", "--untracked-files=normal"]);
  if (!status) {
    return [];
  }

  return status
    .split(/\r?\n/)
    .map((line) => line.replace(/^[ MARCUD?!]{1,2}\s+/, "").trim())
    .map((file) => {
      const renameSeparator = " -> ";
      return file.includes(renameSeparator) ? file.split(renameSeparator).pop() : file;
    })
    .filter(Boolean)
    .map((file) => file.replace(/\\/g, "/"));
}

const branch = getBranchName();
const policyBranch = process.env.GITHUB_BASE_REF || branch;
const changedFiles = getChangedFiles();

const mobilePrefixes = ["mobile-app/", "apps/mobile/"];
const webPrefixes = ["src/", "prisma/", "public/", "app/", "components/", "lib/"];
const forbiddenPatterns = [
  /(^|\/)\.env($|\.)/,
  /(^|\/)node_modules\//,
  /(^|\/)\.expo\//,
  /(^|\/)\.expo-run-logs\//,
  /(^|\/)\.next-run-logs\//,
  /\.aab$/i,
  /\.apk$/i,
  /\.der$/i,
  /play-upload-certificate/i,
];
const sharedMobileReleaseFiles = new Set([
  ".github/workflows/branch-policy.yml",
  ".github/workflows/deploy.yml",
  ".github/workflows/mobile.yml",
  "github/workflows/branch-policy.yml",
  "github/workflows/deploy.yml",
  "github/workflows/mobile.yml",
  ".gitignore",
  "docs/BRANCH_POLICY.md",
  "package.json",
  "package-lock.json",
  "scripts/aab-regression-audit.ps1",
  "scripts/branch-policy-check.mjs",
  "scripts/mobile-readiness-check.mjs",
  "src/lib/mobile-chat-push.ts",
]);
const mainMobileStabilizationFiles = new Set([
  "mobile-app/App.tsx",
  "mobile-app/app.json",
  "mobile-app/eas.json",
  "mobile-app/package.json",
  "mobile-app/package-lock.json",
]);

function isMobileFile(file) {
  return mobilePrefixes.some((prefix) => file.startsWith(prefix));
}

function isWebFile(file) {
  return webPrefixes.some((prefix) => file.startsWith(prefix));
}

function isSharedMobileReleaseFile(file) {
  return sharedMobileReleaseFiles.has(file);
}

function isMainMobileStabilizationFile(file) {
  return mainMobileStabilizationFiles.has(file);
}

function isForbiddenArtifact(file) {
  return forbiddenPatterns.some((pattern) => pattern.test(file));
}

function classifyViolations() {
  const forbidden = changedFiles.filter(isForbiddenArtifact);

  if (policyBranch === "main") {
    const disallowedMobileFiles = deployWebOnly
      ? []
      : changedFiles.filter((file) => isMobileFile(file) && !isMainMobileStabilizationFile(file));
    return [...new Set([...forbidden, ...disallowedMobileFiles])];
  }

  if (policyBranch.includes("mobile")) {
    return [...new Set([...forbidden, ...changedFiles.filter(
      (file) => !isSharedMobileReleaseFile(file) && (isWebFile(file) || !isMobileFile(file)),
    )])];
  }

  return forbidden;
}

const violations = classifyViolations();

console.log(`Branch policy check: ${branch}`);
if (policyBranch !== branch) {
  console.log(`Policy target: ${policyBranch}`);
}
if (changedFiles.length === 0) {
  console.log("No local changes detected.");
  process.exit(0);
}

console.log(`Changed files: ${changedFiles.length}`);

if (policyBranch === "main") {
  console.log("Policy: main is for web, backend, API, and production deploy changes.");
  if (deployWebOnly) {
    console.log("Deploy archive scope: mobile source changes are excluded; artifact and secret checks remain enforced.");
  }
} else if (policyBranch.includes("mobile")) {
  console.log("Policy: mobile branches are for Expo/mobile changes plus mobile release guardrails.");
} else {
  console.log("Policy: feature branches should target main or the mobile branch based on ownership.");
}

if (violations.length > 0) {
  console.log("");
  console.log("Branch policy warnings:");
  for (const file of violations) {
    console.log(`- ${file}`);
  }

  if (strict) {
    console.error("");
    console.error("Strict mode failed. Split these changes onto the correct branch before pushing.");
    process.exit(1);
  }

  console.log("");
  console.log("Run with --strict or in CI to fail on these warnings.");
} else {
  console.log("Branch policy passed.");
}
