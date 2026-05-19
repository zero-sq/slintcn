# slintcn roadmap

## v0.1 — prove "not ugly"

- [x] `Tokens` dark glass theme
- [x] Button (8 variants, 8 sizes)
- [x] Card, Input, Badge
- [x] Showcase app
- [x] CLI `init` + `add`

## v0.1.1 — foundation hardening (current)

Pays down the v0.1 debt that would compound across every overlay
added in v0.2. No new components — every existing surface upgraded
to be Slint-idiomatic, accessible, and dogfood-verified.

- [x] Token system split: `Palette` (raw) + `Tokens` (semantic) for
      cheap future light-theme swap
- [x] Typed enums for variant / size — `variant: "outlin"` typos
      become compile errors instead of silent fallthroughs
- [x] Button refactor: per-variant resolution into rest/hover pairs;
      adding a 9th variant is one row, not six ternary edits
- [x] Keyboard activation (Enter / Space) + visible 2px focus ring
      on Button and Input, driven by `Tokens.color-ring`
- [x] Card hover is self-tracked via internal `TouchArea`
- [x] CLI `rewriteImports` actually rewrites + honors
      `themeDir` / `componentsDir` config (covered by `node:test`)
- [x] Showcase regenerates itself through `slintcn add` on every
      `cargo build` — no more bypass of the user code path
- [x] `make verify` (npm test + cargo build + clippy -D warnings)

## v0.2 — shadcn parity (SaaS shell)

- [ ] Dialog / Sheet (modal scrim + glass panel)
- [ ] Tabs
- [ ] Label + Separator
- [ ] `slintcn init` scaffolds Rust `build.rs` import paths
- [ ] Font guide (Inter / Geist embedding in Slint)
- [ ] Icon slot pattern (optional `image` prop + lucide PNG pipeline doc)

## v0.3 — developer experience

- [ ] `npx slintcn@latest` published package
- [ ] Registry index on GitHub (raw URL like shadcn)
- [ ] Visual regression: render showcase frames in CI
- [ ] Second theme: `light` (same components, swapped tokens)

## v1.0 — expand beyond SaaS

- [ ] `registry/game/` — HudPill, SlotTile, KeycapHint
- [ ] `registry/embedded/` — compact density preset
- [ ] Optional codegen from `components.toml` (spine-rs integration)

## Design principles (non-negotiable)

1. **Copy-paste over crate dependency** for primitives
2. **Hover / press / focus** must match web shadcn semantics (pointer cursor, 1px press, no fake 4px bounce)
3. **No runtime backdrop-blur** on Slint until platform supports it — fake glass with scrim + hairline (documented)
4. **Tokens are the only source of color** in components
