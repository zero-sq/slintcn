// slintcn — visual-regression snapshot tool.
//
// Renders the showcase to PNG via Slint's SoftwareRenderer + a custom
// Platform impl that uses MinimalSoftwareWindow. No display server
// required; runs in CI / containers / headless macs.
//
// Build with:   cargo build --features snapshot --bin snapshot
// Run with:     cargo run   --features snapshot --bin snapshot
//
// Output: docs/img/snapshots/<active-section>.png
//
// v0.7 captures the default section (active-section: 0). Per-section
// snapshots are v0.8 — needs the property to be mutable from outside
// before `draw_if_needed` so we can iterate.

use slint::platform::software_renderer::{
    MinimalSoftwareWindow, RepaintBufferType,
};
use slint::ComponentHandle;
use std::rc::Rc;

slint::include_modules!();

struct SnapshotPlatform {
    window: Rc<MinimalSoftwareWindow>,
    start: std::time::Instant,
}

impl slint::platform::Platform for SnapshotPlatform {
    fn create_window_adapter(
        &self,
    ) -> Result<Rc<dyn slint::platform::WindowAdapter>, slint::PlatformError> {
        Ok(self.window.clone())
    }

    fn duration_since_start(&self) -> std::time::Duration {
        self.start.elapsed()
    }
}

const WIDTH: u32 = 1100;
const HEIGHT: u32 = 760;

fn main() {
    let window = MinimalSoftwareWindow::new(RepaintBufferType::ReusedBuffer);
    window.set_size(slint::PhysicalSize::new(WIDTH, HEIGHT));

    slint::platform::set_platform(Box::new(SnapshotPlatform {
        window: window.clone(),
        start: std::time::Instant::now(),
    }))
    .expect("set_platform failed (already called?)");

    let ui = AppWindow::new().expect("AppWindow::new failed");
    ui.show().expect("show failed");

    // One render pass is enough for a static snapshot — no animation to
    // advance, no user interaction to process.
    let mut buffer: Vec<slint::platform::software_renderer::Rgb565Pixel> =
        vec![Default::default(); (WIDTH * HEIGHT) as usize];
    window.draw_if_needed(|renderer| {
        renderer.render(&mut buffer, WIDTH as usize);
    });

    // Convert Rgb565 to Rgba8 for PNG.
    let mut rgba = Vec::with_capacity((WIDTH * HEIGHT * 4) as usize);
    for px in &buffer {
        let raw: u16 = unsafe { std::mem::transmute_copy(px) };
        let r = (((raw >> 11) & 0x1f) as u32 * 255 / 31) as u8;
        let g = (((raw >> 5)  & 0x3f) as u32 * 255 / 63) as u8;
        let b = (( raw        & 0x1f) as u32 * 255 / 31) as u8;
        rgba.extend_from_slice(&[r, g, b, 255]);
    }

    let out = std::path::Path::new("../../docs/img/snapshots");
    std::fs::create_dir_all(out).expect("create snapshots dir");
    let path = out.join("showcase-buttons.png");
    let file = std::fs::File::create(&path).expect("create PNG file");
    let w = std::io::BufWriter::new(file);
    let mut encoder = png::Encoder::new(w, WIDTH, HEIGHT);
    encoder.set_color(png::ColorType::Rgba);
    encoder.set_depth(png::BitDepth::Eight);
    let mut writer = encoder.write_header().expect("png header");
    writer.write_image_data(&rgba).expect("png data");
    println!("snapshot → {}", path.display());
}
