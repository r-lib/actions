WORKFLOWS := .github/workflows/check-full.yaml \
	.github/workflows/check-release.yaml \
	.github/workflows/check-standard.yaml \
	.github/workflows/lint.yaml \
	.github/workflows/pkgdown.yaml \
	.github/workflows/test-coverage.yaml

all : $(WORKFLOWS)

$(WORKFLOWS) : .github/workflows/%.yaml: examples/%.yaml Makefile
	perl -pe 's{r-lib/actions/([\w-]+)\@v2}{./$$1}g' $< | \
	perl -pe 's{actions/checkout\@v6}{actions/checkout\@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2}g' | \
	perl -pe 's{actions/upload-artifact\@v7}{actions/upload-artifact\@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1}g' | \
	perl -pe 's{codecov/codecov-action\@v6}{codecov/codecov-action\@57e3a136b779b570ffcdbf80b3bdc90e7fab3de2 # v6.0.0}g' | \
	perl -pe 's{JamesIves/github-pages-deploy-action\@v4[.]8[.]0}{JamesIves/github-pages-deploy-action\@d92aa235d04922e8f08b40ce78cc5442fcfbfa2f # v4.8.0}g' | \
	perl -pe 's{main, master}{main, master, v2-branch}g' > $@

.PHONY: clean
clean:
	rm -f $(WORKFLOWS)
