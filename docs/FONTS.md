# Fonts

slintcn ships **no embedded fonts**. The default look uses your platform's
system UI font — San Francisco on macOS, Segoe UI on Windows, the configured
GTK / KDE font on Linux. For most product UI that's fine.

If you want a specific typeface (Inter, Geist, IBM Plex, etc.) the standard
Slint pattern is: register the font in Rust at startup, then reference it
by `font-family` in your `.slint` files.

## 1. Register the font from a file

```rust
fn main() -> Result<(), slint::PlatformError> {
    slint::register_font_from_path(
        std::path::Path::new("assets/fonts/Inter.ttf")
    ).expect("failed to load Inter");

    let ui = AppWindow::new()?;
    ui.run()
}
```

Variants (Inter-Medium.ttf, Inter-SemiBold.ttf, …) should each be registered
separately; Slint picks the right one by `font-weight`.

## 2. Or embed it in the binary

For single-file distribution, bundle the TTF via `include_bytes!()` and
register from memory — no asset directory needed:

```rust
slint::register_font_from_memory(
    include_bytes!("../assets/fonts/Inter.ttf")
).expect("failed to load Inter");
```

## 3. Reference it from Slint

```slint
Text {
    text: "Hello";
    font-family: "Inter";
    font-weight: Tokens.typography-weight-semibold;
}
```

To make the whole UI use it without touching every Text, set the font on the
top-level Window:

```slint
export component AppWindow inherits Window {
    default-font-family: "Inter";
    // …
}
```

Every `Text` inside will inherit unless it overrides.

## Inter / Geist specifics

- **Inter** (https://rsms.me/inter/) ships TTF + variable font. Use the
  variable file (`Inter[slnt,wght].ttf`) when one weight range is enough;
  for granular per-weight control, register Inter-Regular / Inter-Medium
  / Inter-SemiBold separately.
- **Geist** (https://vercel.com/font) ships individual weight files. Same
  pattern — register each weight you use.

## License & redistribution

Both Inter and Geist are SIL-OFL licensed. You may redistribute the TTF
files with your binary as long as the OFL notice is preserved. Drop the
license text into `assets/fonts/LICENSE-OFL` next to the font files.

## Why no embedded default

slintcn is copy-paste UI code — adding a 200 KB+ TTF binary to the registry
would bloat every install and force a typography choice on users who'd
rather use their system font. Embedding stays your call.
