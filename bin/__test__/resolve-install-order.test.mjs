import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveInstallOrder } from "../slintcn.mjs";

const fakeRegistry = {
  theme: { files: ["theme/tokens.slint"] },
  components: {
    button: { files: ["components/button.slint"], requires: ["theme"] },
    label: { files: ["components/label.slint"], requires: ["theme"] },
    separator: { files: ["components/separator.slint"], requires: ["theme"] },
    "popup-helpers": { files: ["components/popup-helpers.slint"], requires: ["theme"] },
    dialog: {
      files: ["components/dialog.slint"],
      requires: ["theme", "popup-helpers", "button", "label", "separator"],
    },
    "alert-dialog": {
      files: ["components/alert-dialog.slint"],
      requires: ["dialog"],
    },
  },
};

describe("resolveInstallOrder", () => {
  it("returns just theme when nothing requested", () => {
    assert.deepEqual(resolveInstallOrder(["theme"], fakeRegistry), ["theme"]);
  });

  it("installs theme before a component that requires it", () => {
    const order = resolveInstallOrder(["button"], fakeRegistry);
    assert.deepEqual(order, ["theme", "button"]);
  });

  it("orders transitive deps before the dependent component", () => {
    const order = resolveInstallOrder(["dialog"], fakeRegistry);
    // Each prereq must precede dialog.
    const idx = (n) => order.indexOf(n);
    assert.ok(idx("theme") >= 0, "theme included");
    assert.ok(idx("popup-helpers") >= 0, "popup-helpers included");
    assert.ok(idx("button") >= 0, "button included");
    assert.ok(idx("label") >= 0, "label included");
    assert.ok(idx("separator") >= 0, "separator included");
    assert.ok(idx("dialog") >= 0, "dialog included");
    assert.ok(idx("theme") < idx("popup-helpers"));
    assert.ok(idx("popup-helpers") < idx("dialog"));
    assert.ok(idx("button") < idx("dialog"));
    assert.ok(idx("label") < idx("dialog"));
    assert.ok(idx("separator") < idx("dialog"));
  });

  it("handles diamond deps without duplicating shared nodes", () => {
    // alert-dialog -> dialog -> {button, label, separator, popup-helpers, theme}
    // Also explicitly request label: it must appear exactly once.
    const order = resolveInstallOrder(["alert-dialog", "label"], fakeRegistry);
    const count = order.filter((n) => n === "label").length;
    assert.equal(count, 1, "label appears exactly once");
    const themeCount = order.filter((n) => n === "theme").length;
    assert.equal(themeCount, 1, "theme appears exactly once");
  });

  it("preserves user-requested order for siblings (stable)", () => {
    // When two requested items have no dep relationship, the order they were
    // requested in is preserved.
    const a = resolveInstallOrder(["button", "label"], fakeRegistry);
    const b = resolveInstallOrder(["label", "button"], fakeRegistry);
    // theme is first in both; relative order of button vs label flips.
    assert.equal(a.indexOf("theme"), 0);
    assert.equal(b.indexOf("theme"), 0);
    assert.ok(a.indexOf("button") < a.indexOf("label"));
    assert.ok(b.indexOf("label") < b.indexOf("button"));
  });

  it("throws on unknown component", () => {
    assert.throws(
      () => resolveInstallOrder(["nope"], fakeRegistry),
      /Unknown component: nope/,
    );
  });
});
