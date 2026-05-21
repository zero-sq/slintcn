import { test } from "node:test";
import assert from "node:assert/strict";
import { catalogFromRegistry, itemByName } from "../slintcn.mjs";

const fakeRegistry = {
  name: "default",
  theme: { type: "registry:theme", title: "Theme", description: "tokens", category: "theme", files: ["theme/tokens.slint"] },
  components: {
    button: { type: "registry:ui", title: "Button", description: "btn", category: "actions", files: ["components/button.slint"], requires: ["theme"] },
    icon: { type: "registry:ui", title: "Icon", description: "icon", category: "media", files: ["components/icon.slint"], requires: ["theme"] },
  },
};

test("catalogFromRegistry flattens theme + components", () => {
  const items = catalogFromRegistry(fakeRegistry);
  assert.equal(items.length, 3);
  assert.deepEqual(items.map((i) => i.name), ["theme", "button", "icon"]);
  const button = items.find((i) => i.name === "button");
  assert.equal(button.category, "actions");
  assert.deepEqual(button.requires, ["theme"]);
});

test("catalogFromRegistry defaults requires to []", () => {
  const items = catalogFromRegistry(fakeRegistry);
  assert.deepEqual(items.find((i) => i.name === "theme").requires, []);
});

test("itemByName resolves theme and components, null for unknown", () => {
  assert.equal(itemByName(fakeRegistry, "theme").type, "registry:theme");
  assert.equal(itemByName(fakeRegistry, "button").title, "Button");
  assert.equal(itemByName(fakeRegistry, "nope"), null);
});
