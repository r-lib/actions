WORKFLOWS := .github/workflows/check-full.yaml \
	.github/workflows/check-release.yaml \
	.github/workflows/check-standard.yaml \
	.github/workflows/check-pak.yaml \
	.github/workflows/lint.yaml \
	.github/workflows/pkgdown.yaml \
	.github/workflows/pkgdown-pak.yaml \
	.github/workflows/test-coverage.yaml \
	.github/workflows/test-coverage-pak.yaml

all : $(WORKFLOWS)

$(WORKFLOWS) : .github/workflows/%.yaml: examples/%.yaml
	perl -pe 's{(r-lib/actions/[\w-]+@)v1}{$$1master}g' $^ > $@

examples/check-pak.yaml : examples/check-full.yaml
	cp $^ $@

examples/pkgdown-pak.yaml : examples/pkgdown.yaml
	cp $^ $@

.PHONY: clean
clean:
	rm -f $(WORKFLOWS)
