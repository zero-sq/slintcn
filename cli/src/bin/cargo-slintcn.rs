//! Cargo subcommand shim: `cargo slintcn <args>` invokes this binary as
//! `cargo-slintcn slintcn <args>`, so we drop the leading `slintcn` token and
//! delegate to the same dispatcher the standalone `slintcn` binary uses.

fn main() {
    let mut args: Vec<String> = std::env::args().skip(1).collect();
    if args.first().map(String::as_str) == Some("slintcn") {
        args.remove(0);
    }
    if let Err(e) = slintcn::run(&args) {
        eprintln!("error: {e}");
        std::process::exit(1);
    }
}
