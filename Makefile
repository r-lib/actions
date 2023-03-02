WORKFLOWS := .github/workflows/check-full.yaml \
	.github/workflows/check-release.yaml \
	.github/workflows/check-standard.yaml \
	.github/workflows/lint.yaml \
	.github/workflows/pkgdown.yaml \
	.github/workflows/test-coverage.yaml

all : $(WORKFLOWS)

$(WORKFLOWS) : .github/workflows/%.yaml: examples/%.yaml
	perl -pe 's{r-lib/actions/([\w-]+)\@v2}{./$$1}g' $^ | \
	perl -pe 's{\\$default-branch}{\\$default-branch, v2-branch}g' > $@

.PHONY: clean
clean:
	rm -f $(WORKFLOWS)
