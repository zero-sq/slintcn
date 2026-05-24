//! Install-pipeline tests with an injected fetcher — no network, no disk.

use slintcn::*;
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};

struct Fake(HashMap<String, String>);
impl Fetcher for Fake {
    fn get(&self, url: &str) -> Result<String, String> {
        self.0.get(url).cloned().ok_or_else(|| format!("404 {url}"))
    }
}

const BASE: &str = "https://reg.test";

fn fake_registry() -> Fake {
    let mut m = HashMap::new();
    m.insert(
        format!("{BASE}/r/theme.json"),
        r#"{
          "name":"theme","type":"registry:theme","registryDependencies":[],
          "files":[
            {"path":"theme/palette.slint","content":"PALETTE_NEUTRAL",
             "variants":{"zinc":"PALETTE_ZINC","slate":"PALETTE_SLATE"}},
            {"path":"theme/tokens.slint","content":"TOKENS"}
          ]
        }"#
        .to_string(),
    );
    m.insert(
        format!("{BASE}/r/button.json"),
        r#"{
          "name":"button","type":"registry:ui","title":"Button","category":"forms",
          "description":"A button.","registryDependencies":["theme"],
          "files":[{"path":"components/button.slint","content":"BUTTON_SRC"}]
        }"#
        .to_string(),
    );
    m.insert(
        format!("{BASE}/r/dialog.json"),
        r#"{
          "name":"dialog","type":"registry:ui","registryDependencies":["theme","button"],
          "files":[{"path":"components/dialog.slint","content":"DIALOG_SRC"}]
        }"#
        .to_string(),
    );
    Fake(m)
}

fn config_in(dir: &Path) -> Config {
    let mut c = load_config(dir, Some(BASE.to_string()), None).unwrap();
    c.registry = BASE.to_string();
    c
}

#[test]
fn plans_component_with_its_theme_dependency() {
    let fake = fake_registry();
    let cfg = config_in(Path::new("/proj"));
    let mut visited = HashSet::new();
    let mut writes = Vec::new();
    plan_remote(&item_url(BASE, "button"), &cfg, &fake, &mut visited, &mut writes).unwrap();

    let dests: Vec<PathBuf> = writes.iter().map(|w| w.dest.clone()).collect();
    assert!(dests.contains(&PathBuf::from("/proj/ui/slintcn/theme/palette.slint")));
    assert!(dests.contains(&PathBuf::from("/proj/ui/slintcn/theme/tokens.slint")));
    assert!(dests.contains(&PathBuf::from("/proj/ui/slintcn/components/button.slint")));

    // Content is written verbatim (default layout needs no import rewriting).
    let button = writes.iter().find(|w| w.rel == "components/button.slint").unwrap();
    assert_eq!(button.content, "BUTTON_SRC");
}

#[test]
fn dedupes_shared_theme_across_two_components() {
    let fake = fake_registry();
    let cfg = config_in(Path::new("/proj"));
    let mut visited = HashSet::new();
    let mut writes = Vec::new();
    // dialog depends on theme + button; button also depends on theme.
    plan_remote(&item_url(BASE, "dialog"), &cfg, &fake, &mut visited, &mut writes).unwrap();

    let palette_count = writes
        .iter()
        .filter(|w| w.rel == "theme/palette.slint")
        .count();
    assert_eq!(palette_count, 1, "theme must be planned exactly once");
    assert!(writes.iter().any(|w| w.rel == "components/dialog.slint"));
    assert!(writes.iter().any(|w| w.rel == "components/button.slint"));
}

#[test]
fn base_color_swaps_palette_variant() {
    let fake = fake_registry();
    let mut cfg = config_in(Path::new("/proj"));
    cfg.base_color = "zinc".into();
    let mut visited = HashSet::new();
    let mut writes = Vec::new();
    plan_remote(&item_url(BASE, "theme"), &cfg, &fake, &mut visited, &mut writes).unwrap();

    let palette = writes.iter().find(|w| w.rel == "theme/palette.slint").unwrap();
    assert_eq!(palette.content, "PALETTE_ZINC");
    // tokens.slint has no variant → untouched.
    let tokens = writes.iter().find(|w| w.rel == "theme/tokens.slint").unwrap();
    assert_eq!(tokens.content, "TOKENS");
}

#[test]
fn neutral_base_color_keeps_default_palette() {
    let fake = fake_registry();
    let cfg = config_in(Path::new("/proj")); // neutral
    let mut visited = HashSet::new();
    let mut writes = Vec::new();
    plan_remote(&item_url(BASE, "theme"), &cfg, &fake, &mut visited, &mut writes).unwrap();
    let palette = writes.iter().find(|w| w.rel == "theme/palette.slint").unwrap();
    assert_eq!(palette.content, "PALETTE_NEUTRAL");
}

#[test]
fn add_writes_files_to_disk_via_run_with() {
    let tmp = std::env::temp_dir().join(format!("slintcn-test-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&tmp);
    std::fs::create_dir_all(&tmp).unwrap();

    let fake = fake_registry();
    let args = vec![
        "add".to_string(),
        "button".to_string(),
        "--registry".to_string(),
        BASE.to_string(),
    ];
    run_with(&args, &fake, &tmp).unwrap();

    let button = tmp.join("ui/slintcn/components/button.slint");
    let palette = tmp.join("ui/slintcn/theme/palette.slint");
    assert_eq!(std::fs::read_to_string(&button).unwrap(), "BUTTON_SRC");
    assert_eq!(std::fs::read_to_string(&palette).unwrap(), "PALETTE_NEUTRAL");

    let _ = std::fs::remove_dir_all(&tmp);
}

#[test]
fn init_creates_config_and_installs_theme() {
    let tmp = std::env::temp_dir().join(format!("slintcn-init-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&tmp);
    std::fs::create_dir_all(&tmp).unwrap();

    let fake = fake_registry();
    let args = vec![
        "init".to_string(),
        "--base-color".to_string(),
        "zinc".to_string(),
        "--registry".to_string(),
        BASE.to_string(),
    ];
    run_with(&args, &fake, &tmp).unwrap();

    let config = std::fs::read_to_string(tmp.join("slintcn.json")).unwrap();
    assert!(config.contains("\"baseColor\": \"zinc\""));
    // theme installed, palette swapped to the zinc variant
    let palette = std::fs::read_to_string(tmp.join("ui/slintcn/theme/palette.slint")).unwrap();
    assert_eq!(palette, "PALETTE_ZINC");

    let _ = std::fs::remove_dir_all(&tmp);
}

#[test]
fn unknown_command_errors() {
    let fake = fake_registry();
    let err = run_with(&["frobnicate".to_string()], &fake, Path::new("/tmp")).unwrap_err();
    assert!(err.contains("unknown command"));
}
