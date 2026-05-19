# slintcn

**Copy-paste Slint components that don't look like 2009 desktop widgets.**

shadcn proved that developers want to *own* UI code, not fight a theme API.
Slint 1.16 is moving to Fluent as the default — fine for consistency, weak for
modern dark/glass product UI. **slintcn** is the missing layer: tokens + primitives
you copy into your repo and customize.

## Philosophy

| Phase | Focus | Why |
|-------|--------|-----|
| **Now (v0.1)** | SaaS-adjacent dark glass — button, card, input, badge | Matches shadcn mental model; fastest path to "not ugly" |
| **Next** | Dialog, tabs, select, toast, sidebar shell | Complete app chrome without WebView |
| **Later** | Game HUD — hotbar, reticle, keycap hints | Same copy-paste model, different registry style (`game`) |

SaaS-first is a **wedge**, not a ceiling. Once tokens + motion + hover semantics
exist, a second registry (`registry/game/`) is just more `.slint` files.

## Prerequisites

- **Rust** with Slint 1.16 (for the showcase or your Slint app)
- **Node 20+** (the CLI runtime)

## Quick start

```bash
# Run the visual showcase
cd examples/showcase && cargo run

# Install components into your Slint project
cd your-app
node /path/to/slintcn/bin/slintcn.mjs init
node /path/to/slintcn/bin/slintcn.mjs add button card input
```

Files land in `ui/slintcn/` — **you own them**. Change colors in
`ui/slintcn/theme/tokens.slint`, tweak `button.slint` for your product.

```slint
import { Button, ButtonVariant, ButtonSize } from "slintcn/components/button.slint";

Button {
    variant: ButtonVariant.glow;
    size: ButtonSize.lg;
    text: "Ship it";
    clicked => { /* … */ }
}
```

Variants and sizes are **typed enums** — a typo fails to compile rather than
silently falling through to the default styling.

## Components (default registry)

| Component | Variants | Sizes |
|-----------|----------|-------|
| **Button** | default · outline · secondary · ghost · link · destructive · glow · glass | xs · sm · default · lg · icon (× 4 sizes) |
| **Card** | solid · glass · glass-interactive · raised | sm · default |
| **Input** | (focus ring · placeholder · password · auto-focus) | — |
| **Badge** | default · secondary · outline · destructive | sm · default |

Keyboard activation (Enter / Space) and a visible 2px focus ring are wired into
every interactive primitive.

## vs alternatives

| | std-widgets / Fluent | [slint-ui-system](https://crates.io/crates/slint-ui-system) | **slintcn** |
|--|----------------------|--------------------------------------------------------------|-------------|
| Model | Framework widgets | Crate dependency | **Copy-paste** |
| Aesthetic | Platform / Fluent | Neon dashboard | **Dark glass / shadcn-like** |
| Customize | Theme API | Crate version lock | **Edit the `.slint` file** |

## Project layout

```
registry/default/      # Source of truth (published with npm package)
  theme/palette.slint  #   raw color/alpha primitives
  theme/tokens.slint   #   semantic layer (components read this)
  components/*.slint   #   button, card, input, badge
examples/showcase/     # Runnable gallery (regenerated via slintcn add)
bin/slintcn.mjs        # init + add CLI
bin/__test__/          # node:test suite (run via `make test`)
```

Run `make verify` before committing — it runs node tests, `cargo build`, and
`cargo clippy -D warnings` end-to-end.

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md).

## License

MIT
