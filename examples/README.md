
<!-- README.md is generated from README.Rmd. Please edit that file -->

# Example workflows

Package workflows:

- [`check-release`](#quickstart-ci-workflow) - A simple CI workflow to
  check with the release version of R.
- [`check-standard`](#standard-ci-workflow) - A standard CI workflow to
  check with the release version of R on the three major OSs.
- [`check-full`](#tidyverse-ci-workflow) - A more complex CI workflow
- [`test-coverage`](#test-coverage-workflow) - Run `covr::codecov()` on
  an R package.
- [`lint`](#lint-workflow) - Run `lintr::lint_package()` on an R
  package.
- [`pr-commands`](#commands-workflow) - Adds `/document` and `/style`
  commands for pull requests.
- [`pkgdown`](#build-pkgdown-site) - Build a
  [pkgdown](https://pkgdown.r-lib.org/) site for an R package and deploy
  it to [GitHub Pages](https://pages.github.com/) or [Cloudflare
  Pages](https://pages.cloudflare.com/).
- [`document`](#document-package) - Run `roxygen2::roxygenise()` on an R
  package.
- [`style`](#style-package) - Run `styler::style_pkg()` on an R package.

RMarkdown workflows:

- [`render-rmarkdown`](#render-rmarkdown) - Render one or more Rmarkdown
  files when they change and commit the result.
- [`bookdown`](#build-bookdown-site) - Build a
  [bookdown](https://bookdown.org) site and deploy it to [GitHub
  Pages](https://pages.github.com/) or [Cloudflare
  Pages](https://pages.cloudflare.com/).
- [`bookdown-gh-pages`](#build-bookdown-site-alternative-workflow) -
  Alternative workflow to build a [bookdown](https://bookdown.org) site
  and deploy it to [GitHub Pages](https://pages.github.com/).
- [`blogdown`](#build-blogdown-site) - Build a
  [blogdown](https://bookdown.org/yihui/blogdown/) site and deploy it to
  [GitHub Pages](https://pages.github.com/) or [Cloudflare
  Pages](https://pages.cloudflare.com/).
- [`blogdown-gh-pages`](#build-blogdown-site-alternative-workflow) -
  Alternative workflow to build a
  [blogdown](https://bookdown.org/yihui/blogdown/) site and deploy it to
  [GitHub Pages](https://pages.github.com/).

Other workflows:

- [Bioconductor](#bioconductor-friendly-workflow) - A CI workflow for
  packages to be released on Bioconductor.
- [`lint-project`](#lint-project-workflow) - Run `lintr::lint_dir()` on
  an R project.
- [`shiny-deploy`](#shiny-app-deployment) - Deploy a Shiny app to
  shinyapps.io or RStudio Connect.

Options and advice:

- [Forcing binaries](#forcing-binaries) - An environment variable to
  always use binary packages.

## Quickstart CI workflow

`usethis::use_github_action("check-release")`

This workflow installs latest release R version on linux and runs R CMD
check via the [rcmdcheck](https://github.com/r-lib/rcmdcheck) package.
If this is the first time you have used CI for a project this is
probably what you want to use.

### When should you use it?

1.  You have a simple R package
2.  There is no OS-specific code
3.  You want a quick start with R CI

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/v2/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

name: R-CMD-check.yaml

permissions: read-all

jobs:
  R-CMD-check:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
      R_KEEP_PKG_SOURCE: yes
    steps:
      - uses: actions/checkout@v4

      - uses: r-lib/actions/setup-r@v2
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-r-dependencies@v2
        with:
          extra-packages: any::rcmdcheck
          needs: check

      - uses: r-lib/actions/check-r-package@v2
        with:
          upload-snapshots: true
          build_args: 'c("--no-manual","--compact-vignettes=gs+qpdf")'
```

## Standard CI workflow

`usethis::use_github_action("check-standard")`

This workflow runs R CMD check via the
[rcmdcheck](https://github.com/r-lib/rcmdcheck) package on the three
major OSs (linux, macOS and Windows) with the current, development, and
previous versions of R. If you plan to someday submit your package to
CRAN or Bioconductor this is likely the workflow you want to use.

### When should you use it?

1.  You plan to submit your package to CRAN or Bioconductor
2.  Your package has OS-specific code

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/v2/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

name: R-CMD-check.yaml

permissions: read-all

jobs:
  R-CMD-check:
    runs-on: ${{ matrix.config.os }}

    name: ${{ matrix.config.os }} (${{ matrix.config.r }})

    strategy:
      fail-fast: false
      matrix:
        config:
          - {os: macos-latest,   r: 'release'}
          - {os: windows-latest, r: 'release'}
          - {os: ubuntu-latest,   r: 'devel', http-user-agent: 'release'}
          - {os: ubuntu-latest,   r: 'release'}
          - {os: ubuntu-latest,   r: 'oldrel-1'}

    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
      R_KEEP_PKG_SOURCE: yes

    steps:
      - uses: actions/checkout@v4

      - uses: r-lib/actions/setup-pandoc@v2

      - uses: r-lib/actions/setup-r@v2
        with:
          r-version: ${{ matrix.config.r }}
          http-user-agent: ${{ matrix.config.http-user-agent }}
          use-public-rspm: true

      - uses: r-lib/actions/setup-r-dependencies@v2
        with:
          extra-packages: any::rcmdcheck
          needs: check

      - uses: r-lib/actions/check-r-package@v2
        with:
          upload-snapshots: true
          build_args: 'c("--no-manual","--compact-vignettes=gs+qpdf")'
```

## Tidyverse CI workflow

`usethis::use_github_action("check-full")`

This workflow installs the last 5 minor R versions and runs R CMD check
via the [rcmdcheck](https://github.com/r-lib/rcmdcheck) package on the
three major OSs (linux, macOS and Windows). This workflow is what the
tidyverse teams uses on their repositories, but is overkill for less
widely used packages, which are better off using the simpler quickstart
CI workflow.

### When should you use it?

1.  You are a tidyverse developer
2.  You have a complex R package
3.  With OS-specific code
4.  And you want to ensure compatibility with many older R versions

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/v2/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
#
# NOTE: This workflow is overkill for most R packages and
# check-standard.yaml is likely a better choice.
# usethis::use_github_action("check-standard") will install it.
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

name: R-CMD-check.yaml

permissions: read-all

jobs:
  R-CMD-check:
    runs-on: ${{ matrix.config.os }}

    name: ${{ matrix.config.os }} (${{ matrix.config.r }})

    strategy:
      fail-fast: false
      matrix:
        config:
          - {os: macos-latest,   r: 'release'}

          - {os: windows-latest, r: 'release'}
          # use 4.1 to check with rtools40's older compiler
          - {os: windows-latest, r: '4.1'}

          - {os: ubuntu-latest,  r: 'devel', http-user-agent: 'release'}
          - {os: ubuntu-latest,  r: 'release'}
          - {os: ubuntu-latest,  r: 'oldrel-1'}
          - {os: ubuntu-latest,  r: 'oldrel-2'}
          - {os: ubuntu-latest,  r: 'oldrel-3'}
          - {os: ubuntu-latest,  r: 'oldrel-4'}

    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
      R_KEEP_PKG_SOURCE: yes

    steps:
      - uses: actions/checkout@v4

      - uses: r-lib/actions/setup-pandoc@v2

      - uses: r-lib/actions/setup-r@v2
        with:
          r-version: ${{ matrix.config.r }}
          http-user-agent: ${{ matrix.config.http-user-agent }}
          use-public-rspm: true

      - uses: r-lib/actions/setup-r-dependencies@v2
        with:
          extra-packages: any::rcmdcheck
          needs: check

      - uses: r-lib/actions/check-r-package@v2
        with:
          upload-snapshots: true
          build_args: 'c("--no-manual","--compact-vignettes=gs+qpdf")'
```

## Test coverage workflow

`usethis::use_github_action("test-coverage")`

This example uses the [covr](https://covr.r-lib.org) package to query
the test coverage of your package and upload the result to
[codecov.io](https://codecov.io)

In theory reporting to codecov.io works automatically, but unfortunately
in practice it often fails, unless a `CODECOV_TOKEN` secret is set in
the repository, containing a Codecov repository upload token.

If you use the `codecov/codecov-action` action to upload your test
results to GitHub, like the example here, then you can also use a global
organization token in an organization secret called `CODECOV_TOKEN`.
This way you can avoid having to add a secret to each repository of your
organization.

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/v2/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

name: test-coverage.yaml

permissions: read-all

jobs:
  test-coverage:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}

    steps:
      - uses: actions/checkout@v4

      - uses: r-lib/actions/setup-r@v2
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-r-dependencies@v2
        with:
          extra-packages: any::covr, any::xml2
          needs: coverage

      - name: Test coverage
        run: |
          cov <- covr::package_coverage(
            quiet = FALSE,
            clean = FALSE,
            install_path = file.path(normalizePath(Sys.getenv("RUNNER_TEMP"), winslash = "/"), "package")
          )
          covr::to_cobertura(cov)
        shell: Rscript {0}

      - uses: codecov/codecov-action@v4
        with:
          fail_ci_if_error: ${{ github.event_name != 'pull_request' && true || false }}
          file: ./cobertura.xml
          plugin: noop
          disable_search: true
          token: ${{ secrets.CODECOV_TOKEN }}

      - name: Show testthat output
        if: always()
        run: |
          ## --------------------------------------------------------------------
          find '${{ runner.temp }}/package' -name 'testthat.Rout*' -exec cat '{}' \; || true
        shell: bash

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-test-failures
          path: ${{ runner.temp }}/package
```

## Lint workflow

`usethis::use_github_action("lint")`

This example uses the [lintr](https://github.com/r-lib/lintr) package to
lint your package and return the results as build annotations.

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/v2/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

name: lint.yaml

permissions: read-all

jobs:
  lint:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v4

      - uses: r-lib/actions/setup-r@v2
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-r-dependencies@v2
        with:
          extra-packages: any::lintr, local::.
          needs: lint

      - name: Lint
        run: lintr::lint_package()
        shell: Rscript {0}
        env:
          LINTR_ERROR_ON_LINT: true
```

## Commands workflow

`usethis::use_github_action("pr-commands")`

This workflow enables the use of 2 R specific commands in pull request
issue comments. `/document` will use
[roxygen2](https://roxygen2.r-lib.org/) to rebuild the documentation for
the package and commit the result to the pull request. `/style` will use
[styler](https://styler.r-lib.org/) to restyle your package.

### When should you use it?

1.  You get frequent pull requests, often with documentation only fixes.
2.  You regularly style your code with styler, and require all additions
    be styled as well.

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/v2/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  issue_comment:
    types: [created]

name: pr-commands.yaml

permissions: read-all

jobs:
  document:
    if: ${{ github.event.issue.pull_request && (github.event.comment.author_association == 'MEMBER' || github.event.comment.author_association == 'OWNER') && startsWith(github.event.comment.body, '/document') }}
    name: document
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v4

      - uses: r-lib/actions/pr-fetch@v2
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}

      - uses: r-lib/actions/setup-r@v2
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-r-dependencies@v2
        with:
          extra-packages: any::roxygen2
          needs: pr-document

      - name: Document
        run: roxygen2::roxygenise()
        shell: Rscript {0}

      - name: commit
        run: |
          git config --local user.name "$GITHUB_ACTOR"
          git config --local user.email "$GITHUB_ACTOR@users.noreply.github.com"
          git add man/\* NAMESPACE
          git commit -m 'Document'

      - uses: r-lib/actions/pr-push@v2
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}

  style:
    if: ${{ github.event.issue.pull_request && (github.event.comment.author_association == 'MEMBER' || github.event.comment.author_association == 'OWNER') && startsWith(github.event.comment.body, '/style') }}
    name: style
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v4

      - uses: r-lib/actions/pr-fetch@v2
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}

      - uses: r-lib/actions/setup-r@v2

      - name: Install dependencies
        run: install.packages("styler")
        shell: Rscript {0}

      - name: Style
        run: styler::style_pkg()
        shell: Rscript {0}

      - name: commit
        run: |
          git config --local user.name "$GITHUB_ACTOR"
          git config --local user.email "$GITHUB_ACTOR@users.noreply.github.com"
          git add \*.R
          git commit -m 'Style'

      - uses: r-lib/actions/pr-push@v2
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```

## Render Rmarkdown

`usethis::use_github_action("render-rmarkdown")`

This example automatically re-builds any Rmarkdown file in the
repository whenever it changes and commits the results to the same
branch.

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/v2/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    paths: ['**.Rmd']

name: render-rmarkdown.yaml

permissions: read-all

jobs:
  render-rmarkdown:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: r-lib/actions/setup-pandoc@v2

      - uses: r-lib/actions/setup-r@v2

      - uses: r-lib/actions/setup-renv@v2

      - name: Render Rmarkdown files and Commit Results
        run: |
          RMD_PATH=($(git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep '[.]Rmd$'))
          Rscript -e 'for (f in commandArgs(TRUE)) if (file.exists(f)) rmarkdown::render(f)' ${RMD_PATH[*]}
          git config --local user.name "$GITHUB_ACTOR"
          git config --local user.email "$GITHUB_ACTOR@users.noreply.github.com"
          git commit ${RMD_PATH[*]/.Rmd/.md} -m 'Re-build Rmarkdown files' || echo "No changes to commit"
          git push origin || echo "No changes to commit"
```

## Build pkgdown site

`usethis::use_github_action("pkgdown")`

This example builds a [pkgdown](https://pkgdown.r-lib.org/) site for a
repository and pushes the built package to [GitHub
Pages](https://pages.github.com/) or [Cloudflare
Pages](https://pages.cloudflare.com/). The inclusion of
[`workflow_dispatch`](https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows#workflow_dispatch)
means the workflow can be [run manually, from the
browser](https://docs.github.com/en/actions/managing-workflow-runs/manually-running-a-workflow),
or [triggered via the GitHub REST
API](https://docs.github.com/en/rest/reference/actions/#create-a-workflow-dispatch-event).

You’ll need to update your setting on GitHub to deploy the `gh-pages`
(unless configured otherwise) branch of your repository to GitHub Pages.

Similarly, connect your Cloudflare Pages app to the `gh-pages` branch of
your repository on your Cloudflare dashboard. You’ll need to set
`exit 0` as the build command for pkgdown sites. See the Cloudflare
Pages documentation for details.

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/v2/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
  release:
    types: [published]
  workflow_dispatch:

name: pkgdown.yaml

permissions: read-all

jobs:
  pkgdown:
    runs-on: ubuntu-latest
    # Only restrict concurrency for non-PR jobs
    concurrency:
      group: pkgdown-${{ github.event_name != 'pull_request' || github.run_id }}
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - uses: r-lib/actions/setup-pandoc@v2

      - uses: r-lib/actions/setup-r@v2
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-r-dependencies@v2
        with:
          extra-packages: any::pkgdown, local::.
          needs: website

      - name: Build site
        run: pkgdown::build_site_github_pages(new_process = FALSE, install = FALSE)
        shell: Rscript {0}

      - name: Deploy to GitHub pages 🚀
        if: github.event_name != 'pull_request'
        uses: JamesIves/github-pages-deploy-action@v4.5.0
        with:
          clean: false
          branch: gh-pages
          folder: docs
```

## Document package

`usethis::use_github_action("document")`

This example documents an R package whenever a file in the `R/`
directory changes, then commits and pushes the changes to the same
branch.

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/v2/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    paths: ["R/**"]

name: document.yaml

permissions: read-all

jobs:
  document:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup R
        uses: r-lib/actions/setup-r@v2
        with:
          use-public-rspm: true

      - name: Install dependencies
        uses: r-lib/actions/setup-r-dependencies@v2
        with:
          extra-packages: any::roxygen2
          needs: roxygen2

      - name: Document
        run: roxygen2::roxygenise()
        shell: Rscript {0}

      - name: Commit and push changes
        run: |
          git config --local user.name "$GITHUB_ACTOR"
          git config --local user.email "$GITHUB_ACTOR@users.noreply.github.com"
          git add man/\* NAMESPACE DESCRIPTION
          git commit -m "Update documentation" || echo "No changes to commit"
          git pull --ff-only
          git push origin
```

## Style package

`usethis::use_github_action("style")`

This example styles the R code in a package, then commits and pushes the
changes to the same branch.

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/v2/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    paths: ["**.[rR]", "**.[qrR]md", "**.[rR]markdown", "**.[rR]nw", "**.[rR]profile"]

name: style.yaml

permissions: read-all

jobs:
  style:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup R
        uses: r-lib/actions/setup-r@v2
        with:
          use-public-rspm: true

      - name: Install dependencies
        uses: r-lib/actions/setup-r-dependencies@v2
        with:
          extra-packages: any::styler, any::roxygen2
          needs: styler

      - name: Enable styler cache
        run: styler::cache_activate()
        shell: Rscript {0}

      - name: Determine cache location
        id: styler-location
        run: |
          cat(
            "location=",
            styler::cache_info(format = "tabular")$location,
            "\n",
            file = Sys.getenv("GITHUB_OUTPUT"),
            append = TRUE,
            sep = ""
          )
        shell: Rscript {0}

      - name: Cache styler
        uses: actions/cache@v4
        with:
          path: ${{ steps.styler-location.outputs.location }}
          key: ${{ runner.os }}-styler-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-styler-
            ${{ runner.os }}-

      - name: Style
        run: styler::style_pkg()
        shell: Rscript {0}

      - name: Commit and push changes
        run: |
          if FILES_TO_COMMIT=($(git diff-index --name-only ${{ github.sha }} \
              | egrep --ignore-case '\.(R|[qR]md|Rmarkdown|Rnw|Rprofile)$'))
          then
            git config --local user.name "$GITHUB_ACTOR"
            git config --local user.email "$GITHUB_ACTOR@users.noreply.github.com"
            git commit ${FILES_TO_COMMIT[*]} -m "Style code (GHA)"
            git pull --ff-only
            git push origin
          else
            echo "No changes to commit."
          fi
```

## Build bookdown site

`usethis::use_github_action("bookdown")`

This example builds a [bookdown](https://bookdown.org) site for a
repository and then deploys the site via [GitHub
Pages](https://pages.github.com/) or Cloudflare Pages. It uses
[renv](https://rstudio.github.io/renv/) to ensure the package versions
remain consistent across builds. You will need to run `renv::snapshot()`
locally and commit the `renv.lock` file before using this workflow, and
after every time you add a new package to `DESCRIPTION`. See [Using renv
with Continous
Integration](https://rstudio.github.io/renv/articles/ci.html) for
additional information.

You’ll need to update your setting on GitHub to deploy the `_book`
folder of the `gh-pages` branch (unless configured otherwise) of your
repository to GitHub Pages.

Similarly, connect your Cloudflare Pages app to the `gh-pages` branch of
your repository on your Cloudflare dashboard. You’ll need to set
`exit 0` as the build command for bookdown sites. See the Cloudflare
Pages documentation for details.

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/v2/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
  workflow_dispatch:

name: bookdown.yaml

permissions: read-all

jobs:
  bookdown:
    runs-on: ubuntu-latest
    # Only restrict concurrency for non-PR jobs
    concurrency:
      group: pkgdown-${{ github.event_name != 'pull_request' || github.run_id }}
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v4

      - uses: r-lib/actions/setup-pandoc@v2

      - uses: r-lib/actions/setup-r@v2
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-renv@v2

      - name: Cache bookdown results
        uses: actions/cache@v4
        with:
          path: _bookdown_files
          key: bookdown-${{ hashFiles('**/*Rmd') }}
          restore-keys: bookdown-

      - name: Build site
        run: bookdown::render_book("index.Rmd", quiet = TRUE)
        shell: Rscript {0}

      - name: Deploy to GitHub pages 🚀
        if: github.event_name != 'pull_request'
        uses: JamesIves/github-pages-deploy-action@v4.5.0
        with:
          branch: gh-pages
          folder: _book
```

## Build bookdown site, alternative workflow

`usethis::use_github_action("bookdown-gh-pages")`

This is an alternative workflow that builds and publishes a bookdown
book, without creating a separate branch in the repository for the built
book.

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/v2/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
  workflow_dispatch:

name: bookdown-gh-pages.yaml

permissions: read-all

jobs:
  build:
    runs-on: ubuntu-latest
    # Only restrict concurrency for non-PR jobs
    concurrency:
      group: pkgdown-${{ github.event_name != 'pull_request' || github.run_id }}
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v4

      - uses: r-lib/actions/setup-pandoc@v2

      - uses: r-lib/actions/setup-r@v2
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-renv@v2

      - name: Cache bookdown results
        uses: actions/cache@v4
        with:
          path: _bookdown_files
          key: bookdown-${{ hashFiles('**/*Rmd') }}
          restore-keys: bookdown-

      - name: Build site
        run: bookdown::render_book("index.Rmd", quiet = TRUE)
        shell: Rscript {0}

      - name: Upload website artifact
        if: ${{ github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master' }}
        uses: actions/upload-pages-artifact@v3
        with:
          path: "_book"

  deploy:
    needs: build

    permissions:
      pages: write      # to deploy to Pages
      id-token: write   # to verify the deployment originates from an appropriate source

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Build blogdown site

`usethis::use_github_action("blogdown")`

This example builds a [blogdown](https://bookdown.org/yihui/blogdown/)
site for a repository and then deploys the book via [GitHub
Pages](https://pages.github.com/) or Cloudflare Pages. It uses
[renv](https://rstudio.github.io/renv/) to ensure the package versions
remain consistent across builds. You will need to run `renv::snapshot()`
locally and commit the `renv.lock` file before using this workflow, see
[Using renv with Continous
Integration](https://rstudio.github.io/renv/articles/ci.html) for
additional information.

You’ll need to update your setting on GitHub to deploy the `public`
folder of the `gh-pages` branch (unless configured otherwise) of your
repository to GitHub Pages.

Similarly, connect your Cloudflare Pages app to the `gh-pages` branch of
your repository on your Cloudflare dashboard. You’ll need to set
`exit 0` as the build command for blogdown sites. See the Cloudflare
Pages documentation for details.

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/v2/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
  workflow_dispatch:

name: blogdown.yaml

permissions: read-all

jobs:
  blogdown:
    runs-on: ubuntu-latest
    # Only restrict concurrency for non-PR jobs
    concurrency:
      group: pkgdown-${{ github.event_name != 'pull_request' || github.run_id }}
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v4

      - uses: r-lib/actions/setup-pandoc@v2

      - uses: r-lib/actions/setup-r@v2
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-renv@v2

      - name: Install hugo
        run: blogdown::install_hugo()
        shell: Rscript {0}

      - name: Build site
        run: blogdown::build_site(TRUE)
        shell: Rscript {0}

      - name: Deploy to GitHub pages 🚀
        if: github.event_name != 'pull_request'
        uses: JamesIves/github-pages-deploy-action@v4.5.0
        with:
          branch: gh-pages
          folder: public
```

## Build blogdown site, alternative workflow

`usethis::use_github_action("blogdown-gh-pages")`

This is an alternative workflow that builds and publishes a blogdown
site, without creating a separate branch in the repository for the built
site.

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/v2/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
  workflow_dispatch:

name: blogdown-gh-pages.yaml

permissions: read-all

jobs:
  build:
    runs-on: ubuntu-latest
    # Only restrict concurrency for non-PR jobs
    concurrency:
      group: pkgdown-${{ github.event_name != 'pull_request' || github.run_id }}
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v4

      - uses: r-lib/actions/setup-pandoc@v2

      - uses: r-lib/actions/setup-r@v2
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-renv@v2

      - name: Install hugo
        run: blogdown::install_hugo()
        shell: Rscript {0}

      - name: Build site
        run: blogdown::build_site(TRUE)
        shell: Rscript {0}

      - name: Upload website artifact
        if: ${{ github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master' }}
        uses: actions/upload-pages-artifact@v3
        with:
          path: "public"

  deploy:
    needs: build

    permissions:
      pages: write      # to deploy to Pages
      id-token: write   # to verify the deployment originates from an appropriate source

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Shiny App Deployment

`usethis::use_github_action("shiny-deploy")`

This example will deploy your Shiny application to either
[shinyapps.io](https://www.shinyapps.io/) or [RStudio
Connect](https://www.rstudio.com/products/connect/) using the
`rsconnect` package. The `rsconnect` package requires authorization to
deploy an app using your account. This action does this by using your
user name (`RSCONNECT_USER`), token (`RSCONNECT_TOKEN`), and secret
(`RSCONNECT_SECRET`), which are securely accessed as GitHub Secrets.
**Your token and secret are private and should be kept confidential**.

This action assumes you have an `renv` lockfile in your repository that
describes the `R` packages and versions required for your Shiny
application.

- See here for information on how to obtain the token and secret for
  configuring `rsconnect`:
  <https://shiny.rstudio.com/articles/shinyapps.html>

- See here for information on how to store private tokens in a
  repository as GitHub Secrets:
  <https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository>

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/v2/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]

name: shiny-deploy.yaml

permissions: read-all

jobs:
  shiny-deploy:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v4

      - uses: r-lib/actions/setup-pandoc@v2

      - uses: r-lib/actions/setup-r@v2
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-renv@v2

      - name: Install rsconnect
        run: install.packages("rsconnect")
        shell: Rscript {0}

      - name: Authorize and deploy app
        env:
          # Provide your app name, account name, and server to be deployed below
          APPNAME: your-app-name
          ACCOUNT: your-account-name
          SERVER: shinyapps.io # server to deploy
        run: |
          rsconnect::setAccountInfo("${{ secrets.RSCONNECT_USER }}", "${{ secrets.RSCONNECT_TOKEN }}", "${{ secrets.RSCONNECT_SECRET }}")
          rsconnect::deployApp(appName = "${{ env.APPNAME }}", account = "${{ env.ACCOUNT }}", server = "${{ env.SERVER }}")
        shell: Rscript {0}
```

## Bioconductor-friendly workflow

[Bioconductor](http://bioconductor.org/) is a repository for tools for
the analysis and comprehension of high-throughput genomic data that
hosts close to 2,000 R packages. It follows a six month release cycle
while R has a yearly release cycle. `biocthis` contains a
user-contributed workflow that is Bioconductor-friendly described in
detail at[the `biocthis` introductory
vignette](https://lcolladotor.github.io/biocthis/articles/biocthis.html#use-bioc-github-action-).
You can add this workflow using the following R code:

``` r
## If needed
remotes::install_github("lcolladotor/biocthis")

## Create a GitHub Actions (GHA) workflow that is Bioconductor-friendly
biocthis::use_bioc_github_action()

## You can also use this GHA workflow without installing biocthis
usethis::use_github_action(
    "check-bioc",
    "https://bit.ly/biocthis_gha",
    "check-bioc.yml"
)
```

## Lint project workflow

`usethis::use_github_action("lint-project")`

This example uses the [lintr](https://github.com/r-lib/lintr) package to
lint your project and return the results as annotations.

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/v2/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

name: lint-project.yaml

permissions: read-all

jobs:
  lint-project:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v4

      - uses: r-lib/actions/setup-r@v2
        with:
          use-public-rspm: true

      - name: Install lintr
        run: install.packages("lintr")
        shell: Rscript {0}

      - name: Lint root directory
        run: lintr::lint_dir()
        shell: Rscript {0}
        env:
          LINTR_ERROR_ON_LINT: true
```

## Forcing binaries

Code repositories such as [CRAN](http://cran.r-project.org) or
[RStudio](http://rstudio.com)’s RSPM provide R packages in binary (=
pre-compiled) form for some platforms, but these binaries can sometimes
be missing or lag behind the package sources published on the
repository. The
[setup-r](https://github.com/r-lib/actions/tree/v2/setup-r) action, and
all example workflows utilizing it follow the
`install.packages.compile.from.source` `options()` default and will
install from source when a binary is out of date. Installing from source
can be slow and require additional system dependencies, but ensures that
your workflow runs against the current versions of dependencies.

To always use binaries, even if they are out of date, set the
environment variable `R_COMPILE_AND_INSTALL_PACKAGES=never`. You can set
an environment variable by passing it as a name-value pair to the
`jobs.<job_id>.env` keyword, as in this partial example:

``` yaml
jobs:
  R-CMD-check:
   # missing yaml here
    env:
      R_COMPILE_AND_INSTALL_PACKAGES: never
   # missing yaml here
```

`R_COMPILE_AND_INSTALL_PACKAGES: never` does what it says on the tin: it
will never install from source. If there is *no* binary for the package,
or none meeting the minimum version required in your `DESCRIPTION`, the
installation of R package dependencies will be incomplete. This can lead
to confusing errors, because while dependency installation will *not*
fail in this situation, later steps in your workflow may fail because of
the missing package(s).

You can learn more about packages in source and binary form
[here](https://r-pkgs.org/package-structure-state.html#binary-package)
and
[here](https://www.jumpingrivers.com/blog/faster-r-package-installation-rstudio/).
