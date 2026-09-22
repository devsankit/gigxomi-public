import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const sourcePath = new URL("../src/lib/gigxomi/agency-editor-eligibility.ts", import.meta.url);
const source = ts.transpileModule(await readFile(sourcePath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const { findConfirmedAgencyEditorForManagedUser } = await import(moduleUrl);

function freelancer(overrides = {}) {
  return {
    id: "auth-editor-a",
    role: "FREELANCER",
    assignedRole: "FREELANCER",
    tenantId: "freelancer-home",
    displayName: "Editor A",
    email: "editor-a@example.test",
    phone: "+919900000001",
    packageStatus: "ACTIVE",
    ...overrides,
  };
}

const confirmedEditor = {
  editorProfileId: "profile-editor-a",
  displayName: "Editor A",
  email: "editor-a@example.test",
  phone: "+91 99000 00001",
};

test("a confirmed active team editor is searchable by its linked login", () => {
  assert.equal(
    findConfirmedAgencyEditorForManagedUser(freelancer(), [confirmedEditor])?.editorProfileId,
    "profile-editor-a",
  );
});

test("a freelancer without confirmed agency membership is excluded", () => {
  assert.equal(findConfirmedAgencyEditorForManagedUser(freelancer(), []), null);
});

test("an active team editor remains assignable when marketplace access expires", () => {
  assert.equal(
    findConfirmedAgencyEditorForManagedUser(freelancer({ packageStatus: "EXPIRED" }), [confirmedEditor])?.editorProfileId,
    "profile-editor-a",
  );
});

test("ambiguous identity matches fail closed", () => {
  assert.equal(
    findConfirmedAgencyEditorForManagedUser(freelancer(), [
      confirmedEditor,
      { ...confirmedEditor, editorProfileId: "duplicate-profile" },
    ]),
    null,
  );
});

test("an exact app user membership wins over a duplicate legacy profile", () => {
  const directMembership = {
    editorProfileId: "auth-editor-a",
    displayName: "Editor A",
  };
  assert.equal(
    findConfirmedAgencyEditorForManagedUser(freelancer(), [confirmedEditor, directMembership])?.editorProfileId,
    "auth-editor-a",
  );
});
