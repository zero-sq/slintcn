import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRegistryItem } from "../slintcn.mjs";

const fakeRegistry = {
  name: "default",
  theme: { type: "registry:theme", title: "Theme", description: "tokens", category: "theme", files: ["theme/tokens.slint", "theme/palette.slint"] },
  components: {
    button: {
      type: "registry:ui", title: "Button", description: "btn", category: "actions",
      files: ["components/button.slint"], requires: ["theme"],
    },
  },
};

const fakeRead = async (rel) => `// SOURCE OF ${rel}`;

test("buildRegistryItem inlines content + maps requires → registryDependencies", async () => {
  const built = await buildRegistryItem("button", fakeRegistry, fakeRead);
  assert.equal(built.name, "button");
  assert.equal(built.type, "registry:ui");
  assert.deepEqual(built.registryDependencies, ["theme"]);
  assert.equal(built.files.length, 1);
  assert.equal(built.files[0].path, "components/button.slint");
  assert.equal(built.files[0].content, "// SOURCE OF components/button.slint");
  assert.equal(built.files[0].type, "text/slint");
});

test("buildRegistryItem handles the theme item (multiple files, no requires)", async () => {
  const built = await buildRegistryItem("theme", fakeRegistry, fakeRead);
  assert.equal(built.type, "registry:theme");
  assert.equal(built.files.length, 2);
  assert.deepEqual(built.registryDependencies, []);
});

test("buildRegistryItem throws on unknown item", async () => {
  await assert.rejects(() => buildRegistryItem("nope", fakeRegistry, fakeRead), /Unknown item/);
});
