.PHONY: verify test build clippy clean

# Single command for local pre-commit hygiene.
verify: test build clippy

test:
	npm test

build:
	cd examples/showcase && cargo build --quiet

clippy:
	cd examples/showcase && cargo clippy --quiet -- -D warnings

clean:
	cd examples/showcase && cargo clean
	rm -rf examples/showcase/ui/slintcn
