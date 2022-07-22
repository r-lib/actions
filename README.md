# GitHub Actions for the R language

[![R build status](https://github.com/r-lib/actions/workflows/R-CMD-check/badge.svg)](https://github.com/r-lib/actions/actions?workflow=R-CMD-check)
[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This repository stores [GitHub Actions](https://github.com/features/actions)
for R projects, which can be used to do a variety of CI tasks. It also has a
number of [example workflows](https://github.com/r-lib/actions/tree/v2/examples) which use
these actions.

## Getting started

See [this blog post](https://www.tidyverse.org/blog/2022/06/actions-2-0-0/) on the Tidyverse blog.

## Releases and tags

We use major version tags to mark breaking changes in these actions.
For the current version, please use the `v2` tag, e.g.:

```yaml
- uses: r-lib/actions/setup-r@v2
```

The `v2` tag occasionally changes, to introduce non-breaking fixes and
improvements. These changes use more fine-grained tags, e.g. `v2.0.1`.
You can refer to these as well in your workflow files if you need to.

## List of actions

1. [r-lib/actions/setup-r](https://github.com/r-lib/actions/tree/v2/setup-r) - Sets up [R](https://r-project.org)
1. [r-lib/actions/setup-r-dependencies](https://github.com/r-lib/actions/tree/v2/setup-r-dependencies) - Installs packages declared in `DESCRIPTION`
1. [r-lib/actions/setup-renv](https://github.com/r-lib/actions/tree/v2/setup-renv) - Installs packages from renv lockfile
1. [r-lib/actions/setup-pandoc](https://github.com/r-lib/actions/tree/v2/setup-pandoc) - Sets up [pandoc](https://pandoc.org/)
1. [r-lib/actions/setup-tinytex](https://github.com/r-lib/actions/tree/v2/setup-tinytex) - Sets up LaTeX with [tinytex](https://yihui.name/tinytex)
1. [r-lib/actions/check-r-package](https://github.com/r-lib/actions/tree/v2/check-r-package) - Runs `R CMD check` on an R package
1. [r-lib/actions/pr-fetch](https://github.com/r-lib/actions/tree/v2/pr-fetch) - Fetches changes of a PR associated with an event
1. [r-lib/actions/pr-push](https://github.com/r-lib/actions/tree/v2/pr-push) - Pushes changes to a PR associated with an event
1. [r-lib/actions/run-rchk](https://github.com/r-lib/actions/tree/v2/run-rchk) - Runs [rchk](https://github.com/kalibera/rchk) tests to detect memory protection errors in C source code

## What's new?

See the [`v2` release notes](https://github.com/r-lib/actions/releases/tag/v2).
These notes are kept current with the changes in `v2`.

## Examples

See the [r-lib/actions/examples](https://github.com/r-lib/actions/tree/v2/examples) directory
for a variety of example workflows using these actions.

## Where to find help

If your build fails, and you are unsure of why, here are some useful strategies for getting help.

1. Figure out what caused the error. Look for the _first_ time the word
   'error' appears in the build log. Quite often errors at the end of the log are caused
   by an earlier issue, so it is best to look for the root cause.
1. Take advantage of [GitHub's code search](https://github.com/search?q=path%3A.github%2Fworkflows) to find similar yaml files.
   Use 'path:.github/workflows' to restrict your search to GitHub Action workflow files and also include additional terms specific to your problem.
   e.g. If you need to figure out how to install geospatial libraries such as [gdal](https://gdal.org/), use a search like ['gdal path:.github/workflows'](https://github.com/search?q=gdal+path%3A.github%2Fworkflows).
   If you want to restrict results only to GitHub Actions workflows that use R you can add search for ['"setup-r" path:.github/workflows](https://github.com/search?q=%22setup-r%22+path%3A.github%2Fworkflows)
1. Open an issue on [![RStudio
   community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)
   about your problem. Be sure to link to the workflow file you are using and a
   failing build to help others help you.
1. If your issue seems related to GitHub Actions, but is not specific to R, open an
   issue at the [GitHub Actions
   Community](https://github.community/t5/GitHub-Actions/bd-p/actions) page.
1. If you have done all of the above and are __absolutely__ sure there is a bug
   in one of the R specific actions listed above, check if there is an open issue
   about it [in this repo](https://github.com/r-lib/actions/issues). Look at the
   pinned issues at the top first! We pin issues that affect many people, and the
   issue discussions often contain workarounds.
1. Otherwise open a [new issue in this repo](https://github.com/r-lib/actions/issues/new/choose).
   
> If using a general search engine or GitHub search about your problem/idea, please note that content published prior to the Fall 2019 is probably outdated because the beta version of GitHub Actions was different. More recent posts or answers could be outdated too since GitHub Actions evolve, so refer to [GitHub Actions official docs](https://help.github.com/en/actions) in case of doubt (and to existing working workflows) and [GitHub changelog](https://github.blog/changelog/).

## Common questions

1. *Why are my builds with plots failing on macOS?*\
\
  You need to install XQuartz to do plotting with the default quartz device on macOS. This can be done by adding the following to your workflow.
    ```yaml
    - if: runner.os == 'macOS'
      run: brew install --cask xquartz
    ```

1. *Why are my Windows builds failing with an error about `configure.ac` having CRLF line endings?*\
\
  On Windows, when your repo is checked out using git, the line endings are automatically changed to CRLF. R's check process specifically checks if the `configure.ac` file has these line endings, and will error if it does. To avoid this, add a `.gitattributes` file to the top level of your package with the following to configure git to always use LF line endings for this file: \
  `configure.ac text eol=lf`
  
1. *How can I customize an action to run R code?*\
\
The safest way is to add a `step` to your action, specifying `Rscript {0}` as the `shell` for that step. Here's an example from the [bookdown action](https://github.com/r-lib/actions/tree/v2-branch/examples#build-bookdown-site):
    ```yaml
    - name: Build site
      run: bookdown::render_book("index.Rmd", quiet = TRUE)
      shell: Rscript {0}
   ```
  
## Additional resources

- [GitHub Actions for R](https://www.jimhester.com/talk/2020-rsc-github-actions/), Jim Hester's talk at rstudio::conf 2020. [Recording](https://resources.rstudio.com/rstudio-conf-2020/azure-pipelines-and-github-actions-jim-hester), [slidedeck](https://speakerdeck.com/jimhester/github-actions-for-r).
- [GitHub Actions advent calendar](https://www.edwardthomson.com/blog/github_actions_advent_calendar.html) a series of blogposts by Edward Thomson, one of the GitHub Actions product managers
  highlighting features of GitHub Actions.
- [GitHub Actions with R](https://ropenscilabs.github.io/actions_sandbox/) - a short online book about using GitHub Actions with R, produced as part of the [rOpenSci OzUnconf](https://ozunconf19.ropensci.org/).
- [Awesome Actions](https://github.com/sdras/awesome-actions#awesome-actions---) - a curated list of custom actions. **Note** that many of these are from early in the GitHub Actions beta and may no longer work.

## License ![CC0 licensed](https://img.shields.io/github/license/r-lib/actions)

All examples in this repository are published with the [CC0](./LICENSE) license.
