import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

async function loadRegistry() {
  const raw = await readFile(
    path.join(ROOT, "registry", "default", "registry.json"),
    "utf8",
  );
  return JSON.parse(raw);
}

const VALID_TYPES = new Set([
  "registry:ui",
  "registry:theme",
  "registry:lib",
  "registry:block",
]);

function assertItemShape(name, item) {
  for (const field of ["type", "title", "description", "category", "files"]) {
    assert.ok(item[field] !== undefined, `${name}: missing "${field}"`);
  }
  assert.ok(VALID_TYPES.has(item.type), `${name}: invalid type "${item.type}"`);
  assert.ok(Array.isArray(item.files) && item.files.length > 0, `${name}: files must be a non-empty array`);
  for (const f of item.files) {
    assert.match(f, /\.slint$/, `${name}: file "${f}" must be a .slint path`);
  }
}

test("registry has required top-level metadata", async () => {
  const reg = await loadRegistry();
  for (const field of ["name", "version", "theme", "components"]) {
    assert.ok(reg[field] !== undefined, `registry missing "${field}"`);
  }
  assert.equal(reg.theme.type, "registry:theme");
});

test("every item carries type/title/description/category/files", async () => {
  const reg = await loadRegistry();
  assertItemShape("theme", reg.theme);
  for (const [name, item] of Object.entries(reg.components)) {
    assertItemShape(name, item);
  }
});

test("every `requires` references a real item or 'theme'", async () => {
  const reg = await loadRegistry();
  const known = new Set(["theme", ...Object.keys(reg.components)]);
  for (const [name, item] of Object.entries(reg.components)) {
    for (const req of item.requires ?? []) {
      assert.ok(known.has(req), `${name}: requires unknown item "${req}"`);
    }
  }
});
