# GitHub Actions for the R language

[![R build status](https://github.com/r-lib/actions/workflows/R-CMD-check/badge.svg)](https://github.com/r-lib/actions/actions?workflow=R-CMD-check)
[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This repository stores [GitHub Actions](https://github.com/features/actions)
for R projects, which can be used to do a variety of CI tasks. It also has a
number of [example workflows](https://github.com/r-lib/actions/tree/master/examples) which use
these actions.

1. [r-lib/actions/setup-r](https://github.com/r-lib/actions/tree/master/setup-r) - Sets up [R](https://r-project.org)
1. [r-lib/actions/setup-pandoc](https://github.com/r-lib/actions/tree/master/setup-pandoc) - Sets up [pandoc](https://pandoc.org/)
1. [r-lib/actions/setup-tinytex](https://github.com/r-lib/actions/tree/master/setup-tinytex) - Sets up LaTeX with [tinytex](https://yihui.name/tinytex)
1. [r-lib/actions/pr-fetch](https://github.com/r-lib/actions/tree/master/pr-fetch) - Fetches changes of a PR associated with an event
1. [r-lib/actions/pr-push](https://github.com/r-lib/actions/tree/master/pr-push) - Pushes changes to a PR associated with an event
1. [r-lib/actions/run-rchk](https://github.com/r-lib/actions/tree/master/run-rchk) - Runs [rchk](https://github.com/kalibera/rchk) tests to detect memory protection errors in C source code.

## Examples

See the [r-lib/actions/examples](https://github.com/r-lib/actions/tree/master/examples) directory
for a variety of example workflows using these actions.

## Where to find help

If your build fails and you are unsure of why here are some useful strategies for getting help.

1. Figure out what caused the error. Look for the _first_ time the word
   'error' appears in the build log. Quite often errors at the end of the log are caused
   by an earlier issue, so it is best to look for the root cause.
1. Take advantage of [GitHub's code search](https://github.com/search?q=path%3A.github%2Fworkflows) to find similar yaml files. Use
   'path:.github/workflows' to restrict your search to GitHub Action workflow
   files and also include additional terms specific to your problem. e.g. If you
   need to figure out how to install geospatial libraries such as
   [gdal](https://gdal.org/) use a search like ['gdal path:.github/workflows'](https://github.com/search?q=gdal+path%3A.github%2Fworkflows).
1. Open an issue on [![RStudio
   community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)
   about your problem. Be sure to link to the workflow file you are using and a
   failing build to help others help you.
1. If your issue seems related to GitHub Actions, but is not R specific open an
   issue at the [GitHub Actions
   Community](https://github.community/t5/GitHub-Actions/bd-p/actions) page.
1. If you have done all of the above and are __absolutely__ sure there is a bug
   in one of the R specifc actions listed above, open an [issue
   here](https://github.com/r-lib/actions/issues/new/choose).

## License ![CC0 licensed](https://img.shields.io/github/license/r-lib/actions)

All examples in this repository are published with the [CC0](./LICENSE) license.
