WORKFLOWS := .github/workflows/check-full.yaml \
	.github/workflows/check-release.yaml \
	.github/workflows/check-standard.yaml \
	.github/workflows/lint.yaml \
	.github/workflows/pkgdown.yaml \
	.github/workflows/test-coverage.yaml

all : $(WORKFLOWS)

$(WORKFLOWS) : .github/workflows/%.yaml: examples/%.yaml Makefile
	perl -pe 's{r-lib/actions/([\w-]+)\@v2}{./$$1}g' $< | \
	perl -pe 's{actions/checkout\@v6}{actions/checkout\@de0fac2e4500dabe0009e67214ff5f5447ce83dd}g' | \
	perl -pe 's{actions/upload-artifact\@v7}{actions/upload-artifact\@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a}g' | \
	perl -pe 's{codecov/codecov-action\@v6}{codecov/codecov-action\@57e3a136b779b570ffcdbf80b3bdc90e7fab3de2}g' | \
	perl -pe 's{JamesIves/github-pages-deploy-action\@v4[.]5[.]0}{JamesIves/github-pages-deploy-action\@65b5dfd4f5bcd3a7403bbc2959c144256167464e}g' | \
	perl -pe 's{main, master}{main, master, v2-branch}g' | \
	if [ "$*" = "check-full" ]; then \
	  perl -pe 's{(- \{os: ubuntu-latest,  r: \x27oldrel-4\x27\})}{$$1\n          - {os: ubuntu-22.04-arm, r: \x27release\x27 }}g' | \
	  perl -pe 's{(- uses: \./setup-r-dependencies)}{- uses: gaborcsardi/quarto-actions/setup\@fix/linux-arm64\n\n      $$1}g'; \
	else cat; fi > $@

.PHONY: clean
clean:
	rm -f $(WORKFLOWS)
