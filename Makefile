WORKFLOWS := .github/workflows/check-full.yaml \
	.github/workflows/check-release.yaml \
	.github/workflows/check-standard.yaml \
	.github/workflows/lint.yaml \
	.github/workflows/pkgdown.yaml \
	.github/workflows/test-coverage.yaml

all : $(WORKFLOWS)

$(WORKFLOWS) : .github/workflows/%.yaml: examples/%.yaml Makefile
	perl -pe 's{r-lib/actions/([\w-]+)\@v2}{./$$1}g' $< | \
	perl -pe 's{actions/checkout\@v4}{actions/checkout\@0ad4b8fadaa221de15dcec353f45205ec38ea70b}g' | \
	perl -pe 's{actions/upload-artifact\@v4}{actions/upload-artifact\@65462800fd760344b1a7b4382951275a0abb4808}g' | \
	perl -pe 's{codecov/codecov-action\@v4}{codecov/codecov-action\@f1b7348826d750ac29741abc9d1623d8da5dcd4f}g' | \
	perl -pe 's{JamesIves/github-pages-deploy-action\@v4[.]5[.]0}{JamesIves/github-pages-deploy-action\@65b5dfd4f5bcd3a7403bbc2959c144256167464e}g' | \
	perl -pe 's{main, master}{main, master, v2-branch}g' > $@

.PHONY: clean
clean:
	rm -f $(WORKFLOWS)
