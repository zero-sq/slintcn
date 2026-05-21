import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { classifyRequest, installRemoteItem } from "../slintcn.mjs";

test("classifyRequest: bare name → local", () => {
  assert.deepEqual(classifyRequest("button", {}), { kind: "local", name: "button" });
});

test("classifyRequest: https URL → url", () => {
  const u = "https://x.dev/r/button.json";
  assert.deepEqual(classifyRequest(u, {}), { kind: "url", url: u });
});

test("classifyRequest: @ns/name resolves against registries", () => {
  const cfg = { registries: { acme: "https://acme.dev/" } };
  assert.deepEqual(classifyRequest("@acme/button", cfg), {
    kind: "url",
    url: "https://acme.dev/r/button.json",
  });
});

test("classifyRequest: unknown namespace + malformed throw", () => {
  assert.throws(() => classifyRequest("@acme/button", { registries: {} }), /Unknown registry namespace/);
  assert.throws(() => classifyRequest("@bad", { registries: {} }), /Invalid namespaced ref/);
});

test("installRemoteItem: fetches deps once, writes files import-rewritten", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "slintcn-remote-"));
  const config = {
    themeDir: path.join(dir, "theme"),
    componentsDir: path.join(dir, "components"),
    outDir: dir,
  };

  const base = "https://x.dev/r/";
  const items = {
    [`${base}theme.json`]: {
      name: "theme", registryDependencies: [],
      files: [{ path: "theme/tokens.slint", content: "export global Tokens {}" }],
    },
    [`${base}button.json`]: {
      name: "button", registryDependencies: ["theme"],
      files: [{ path: "components/button.slint", content: 'import { Tokens } from "../theme/tokens.slint";' }],
    },
  };

  let themeFetches = 0;
  const fetchFn = async (url) => {
    if (url === `${base}theme.json`) themeFetches++;
    if (!items[url]) return { ok: false, status: 404 };
    return { ok: true, status: 200, json: async () => items[url] };
  };

  // Request button twice in one session → theme fetched once (visited set).
  const visited = new Set();
  await installRemoteItem(`${base}button.json`, config, dir, { fetchFn, visited });
  await installRemoteItem(`${base}button.json`, config, dir, { fetchFn, visited });

  assert.equal(themeFetches, 1, "theme should be fetched once");
  // Files landed where routeDest sends them.
  await access(path.join(config.themeDir, "tokens.slint"));
  const buttonSrc = await readFile(path.join(config.componentsDir, "button.slint"), "utf8");
  // Import rewritten to the user's layout (theme is a sibling dir → ../theme/).
  assert.match(buttonSrc, /from "\.\.\/theme\/tokens\.slint"/);

  await rm(dir, { recursive: true, force: true });
});
