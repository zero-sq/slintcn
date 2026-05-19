.PHONY: verify test build clippy clean snapshot

# Single command for local pre-commit hygiene.
verify: test build clippy

test:
	npm test

build:
	cd examples/showcase && cargo build --quiet

clippy:
	cd examples/showcase && cargo clippy --quiet -- -D warnings

# Headless render the showcase to docs/img/snapshots/ via Slint's
# SoftwareRenderer (no display server required).
snapshot:
	cd examples/showcase && cargo run --quiet --features snapshot --bin snapshot

clean:
	cd examples/showcase && cargo clean
	rm -rf examples/showcase/ui/slintcn
