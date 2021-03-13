
<!-- README.md is generated from README.Rmd. Please edit that file -->

# Example workflows

Package workflows:

  - [`check-release`](#quickstart-ci-workflow) - A simple CI workflow to
    check with the release version of R.
  - [`check-standard`](#standard-ci-workflow) - A standard CI workflow
    to check with the release version of R on the three major OSs.
  - [`check-full`](#tidyverse-ci-workflow) - A more complex CI workflow
  - [`test-coverage`](#test-coverage-workflow) - Run `covr::codecov()`
    on an R package.
  - [`lint`](#lint-workflow) - Run `lintr::lint_package()` on an R
    package.
  - [`pr-commands`](#commands-workflow) - Adds `/document` and `/style`
    commands for pull requests.

RMarkdown workflows:

  - [`render-rmarkdown`](#render-rmarkdown) - Render one or more
    Rmarkdown files when they change and commit the result.
  - [`pkgdown`](#build-pkgdown-site) - Build a
    [pkgdown](https://pkgdown.r-lib.org/) site for an R package and
    deploy it to [GitHub Pages](https://pages.github.com/).
  - [`bookdown`](#build-bookdown-site) - Build a
    [bookdown](https://bookdown.org) site and deploy it to
    [netlify](https://www.netlify.com/).
  - [`blogdown`](#build-blogdown-site) - Build a
    [blogdown](https://bookdown.org/yihui/blogdown/) site and deploy it
    to [netlify](https://www.netlify.com/).

Other workflows:

  - [`docker`](#docker-based-workflow) - For custom workflows based on
    docker containers.
  - [Bioconductor](#bioconductor-friendly-workflow) - A CI workflow for
    packages to be released on Bioconductor.

Options and advice:

  - [Forcing binaries](#forcing-binaries) - An environment variable to
    always use binary packages.
  - [Managing secrets](#managing-secrets) - How to generate auth tokens
    and make them available to actions.

## Quickstart CI workflow

`usethis::use_github_action("check-release")`

This workflow installs latest release R version on macOS and runs R CMD
check via the [rcmdcheck](https://github.com/r-lib/rcmdcheck) package.
If this is the first time you have used CI for a project this is
probably what you want to use.

### When should you use it?

1.  You have a simple R package
2.  There is no OS-specific code
3.  You want a quick start with R CI

<!-- end list -->

``` yaml
# For help debugging build failures open an issue on the RStudio community with the 'github-actions' tag.
# https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions
on:
  push:
    branches:
      - main
      - master
  pull_request:
    branches:
      - main
      - master

name: R-CMD-check

jobs:
  R-CMD-check:
    runs-on: macOS-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v2
      - uses: r-lib/actions/setup-r@v1
      - name: Install dependencies
        run: |
          install.packages(c("remotes", "rcmdcheck"))
          remotes::install_deps(dependencies = TRUE)
        shell: Rscript {0}
      - name: Check
        run: |
          options(crayon.enabled = TRUE)
          rcmdcheck::rcmdcheck(args = "--no-manual", error_on = "error")
        shell: Rscript {0}
```

## Standard CI workflow

`usethis::use_github_action("check-standard")`

This workflow runs R CMD check via the
[rcmdcheck](https://github.com/r-lib/rcmdcheck) package on the three
major OSs (linux, macOS and Windows) with the current release version of
R, and R-devel. If you plan to someday submit your package to CRAN or
Bioconductor this is likely the workflow you want to use.

### When should you use it?

1.  You plan to submit your package to CRAN or Bioconductor
2.  Your package has OS-specific code

<!-- end list -->

``` yaml
# For help debugging build failures open an issue on the RStudio community with the 'github-actions' tag.
# https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions
on:
  push:
    branches:
      - main
      - master
  pull_request:
    branches:
      - main
      - master

name: R-CMD-check

jobs:
  R-CMD-check:
    runs-on: ${{ matrix.config.os }}

    name: ${{ matrix.config.os }} (${{ matrix.config.r }})

    strategy:
      fail-fast: false
      matrix:
        config:
          - {os: windows-latest, r: 'release'}
          - {os: macOS-latest, r: 'release'}
          - {os: ubuntu-20.04, r: 'release', rspm: "https://packagemanager.rstudio.com/cran/__linux__/focal/latest"}
          - {os: ubuntu-20.04, r: 'devel', rspm: "https://packagemanager.rstudio.com/cran/__linux__/focal/latest"}

    env:
      R_REMOTES_NO_ERRORS_FROM_WARNINGS: true
      RSPM: ${{ matrix.config.rspm }}
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}

    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-r@v1
        with:
          r-version: ${{ matrix.config.r }}

      - uses: r-lib/actions/setup-pandoc@v1

      - name: Query dependencies
        run: |
          install.packages('remotes')
          saveRDS(remotes::dev_package_deps(dependencies = TRUE), ".github/depends.Rds", version = 2)
          writeLines(sprintf("R-%i.%i", getRversion()$major, getRversion()$minor), ".github/R-version")
        shell: Rscript {0}

      - name: Restore R package cache
        uses: actions/cache@v2
        with:
          path: ${{ env.R_LIBS_USER }}
          key: ${{ runner.os }}-${{ hashFiles('.github/R-version') }}-1-${{ hashFiles('.github/depends.Rds') }}
          restore-keys: ${{ runner.os }}-${{ hashFiles('.github/R-version') }}-1-

      - name: Install system dependencies
        if: runner.os == 'Linux'
        run: |
          while read -r cmd
          do
            eval sudo $cmd
          done < <(Rscript -e 'writeLines(remotes::system_requirements("ubuntu", "20.04"))')

      - name: Install dependencies
        run: |
          remotes::install_deps(dependencies = TRUE)
          remotes::install_cran("rcmdcheck")
        shell: Rscript {0}

      - name: Check
        env:
          _R_CHECK_CRAN_INCOMING_REMOTE_: false
        run: |
          options(crayon.enabled = TRUE)
          rcmdcheck::rcmdcheck(args = c("--no-manual", "--as-cran"), error_on = "warning", check_dir = "check")
        shell: Rscript {0}

      - name: Upload check results
        if: failure()
        uses: actions/upload-artifact@main
        with:
          name: ${{ runner.os }}-r${{ matrix.config.r }}-results
          path: check
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

<!-- end list -->

``` yaml
# NOTE: This workflow is overkill for most R packages
# check-standard.yaml is likely a better choice
# usethis::use_github_action("check-standard") will install it.
#
# For help debugging build failures open an issue on the RStudio community with the 'github-actions' tag.
# https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions
on:
  push:
    branches:
      - main
      - master
  pull_request:
    branches:
      - main
      - master

name: R-CMD-check

jobs:
  R-CMD-check:
    runs-on: ${{ matrix.config.os }}

    name: ${{ matrix.config.os }} (${{ matrix.config.r }})

    strategy:
      fail-fast: false
      matrix:
        config:
          - {os: macOS-latest,   r: 'release'}
          - {os: windows-latest, r: 'release'}
          - {os: windows-latest, r: '3.6'}
            # We explicitly set the user agent for R devel to the current release version of R so RSPM serves the release binaries.
          - {os: ubuntu-16.04,   r: 'devel', rspm: "https://packagemanager.rstudio.com/cran/__linux__/xenial/latest", http-user-agent: "R/4.0.0 (ubuntu-16.04) R (4.0.0 x86_64-pc-linux-gnu x86_64 linux-gnu) on GitHub Actions" }
          - {os: ubuntu-16.04,   r: 'release', rspm: "https://packagemanager.rstudio.com/cran/__linux__/xenial/latest"}
          - {os: ubuntu-16.04,   r: 'oldrel',  rspm: "https://packagemanager.rstudio.com/cran/__linux__/xenial/latest"}
          - {os: ubuntu-16.04,   r: '3.5',     rspm: "https://packagemanager.rstudio.com/cran/__linux__/xenial/latest"}
          - {os: ubuntu-16.04,   r: '3.4',     rspm: "https://packagemanager.rstudio.com/cran/__linux__/xenial/latest"}
          - {os: ubuntu-16.04,   r: '3.3',     rspm: "https://packagemanager.rstudio.com/cran/__linux__/xenial/latest"}

    env:
      R_REMOTES_NO_ERRORS_FROM_WARNINGS: true
      RSPM: ${{ matrix.config.rspm }}
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}

    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-r@v1
        with:
          r-version: ${{ matrix.config.r }}
          http-user-agent: ${{ matrix.config.http-user-agent }}

      - uses: r-lib/actions/setup-pandoc@v1

      - name: Query dependencies
        run: |
          install.packages('remotes')
          saveRDS(remotes::dev_package_deps(dependencies = TRUE), ".github/depends.Rds", version = 2)
          writeLines(sprintf("R-%i.%i", getRversion()$major, getRversion()$minor), ".github/R-version")
        shell: Rscript {0}

      - name: Restore R package cache
        # Cache doesn't work on Windows before R 4.0
        if: ! (runner.os == 'Windows' && startsWith(matrix.config.r, '3'))
        uses: actions/cache@v2
        with:
          path: ${{ env.R_LIBS_USER }}
          key: ${{ runner.os }}-${{ hashFiles('.github/R-version') }}-1-${{ hashFiles('.github/depends.Rds') }}
          restore-keys: ${{ runner.os }}-${{ hashFiles('.github/R-version') }}-1-

      - name: Install system dependencies
        if: runner.os == 'Linux'
        run: |
          while read -r cmd
          do
            eval sudo $cmd
          done < <(Rscript -e 'writeLines(remotes::system_requirements("ubuntu", "16.04"))')

      - name: Install dependencies
        run: |
          remotes::install_deps(dependencies = TRUE)
          remotes::install_cran("rcmdcheck")
        shell: Rscript {0}

      - name: Session info
        run: |
          options(width = 100)
          pkgs <- installed.packages()[, "Package"]
          sessioninfo::session_info(pkgs, include_base = TRUE)
        shell: Rscript {0}

      - name: Check
        env:
          _R_CHECK_CRAN_INCOMING_: false
        run: |
          options(crayon.enabled = TRUE)
          rcmdcheck::rcmdcheck(args = c("--no-manual", "--as-cran"), error_on = "warning", check_dir = "check")
        shell: Rscript {0}

      - name: Show testthat output
        if: always()
        run: find check -name 'testthat.Rout*' -exec cat '{}' \; || true
        shell: bash

      - name: Upload check results
        if: failure()
        uses: actions/upload-artifact@main
        with:
          name: ${{ runner.os }}-r${{ matrix.config.r }}-results
          path: check
```

## Test coverage workflow

`usethis::use_github_action("test-coverage")`

This example uses the [covr](https://covr.r-lib.org) package to query
the test coverage of your package and upload the result to
[codecov.io](https://codecov.io)

``` yaml
on:
  push:
    branches:
      - main
      - master
  pull_request:
    branches:
      - main
      - master

name: test-coverage

jobs:
  test-coverage:
    runs-on: macOS-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-r@v1

      - uses: r-lib/actions/setup-pandoc@v1

      - name: Query dependencies
        run: |
          install.packages('remotes')
          saveRDS(remotes::dev_package_deps(dependencies = TRUE), ".github/depends.Rds", version = 2)
          writeLines(sprintf("R-%i.%i", getRversion()$major, getRversion()$minor), ".github/R-version")
        shell: Rscript {0}

      - name: Restore R package cache
        uses: actions/cache@v2
        with:
          path: ${{ env.R_LIBS_USER }}
          key: ${{ runner.os }}-${{ hashFiles('.github/R-version') }}-1-${{ hashFiles('.github/depends.Rds') }}
          restore-keys: ${{ runner.os }}-${{ hashFiles('.github/R-version') }}-1-

      - name: Install dependencies
        run: |
          install.packages(c("remotes"))
          remotes::install_deps(dependencies = TRUE)
          remotes::install_cran("covr")
        shell: Rscript {0}

      - name: Test coverage
        run: covr::codecov()
        shell: Rscript {0}
```

## Lint workflow

`usethis::use_github_action("lint")`

This example uses the [lintr](https://github.com/jimhester/lintr)
package to lint your package and return the results as build
annotations.

``` yaml
on:
  push:
    branches:
      - main
      - master
  pull_request:
    branches:
      - main
      - master

name: lint

jobs:
  lint:
    runs-on: macOS-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-r@v1

      - name: Query dependencies
        run: |
          install.packages('remotes')
          saveRDS(remotes::dev_package_deps(dependencies = TRUE), ".github/depends.Rds", version = 2)
          writeLines(sprintf("R-%i.%i", getRversion()$major, getRversion()$minor), ".github/R-version")
        shell: Rscript {0}

      - name: Restore R package cache
        uses: actions/cache@v2
        with:
          path: ${{ env.R_LIBS_USER }}
          key: ${{ runner.os }}-${{ hashFiles('.github/R-version') }}-1-${{ hashFiles('.github/depends.Rds') }}
          restore-keys: ${{ runner.os }}-${{ hashFiles('.github/R-version') }}-1-

      - name: Install dependencies
        run: |
          install.packages(c("remotes"))
          remotes::install_deps(dependencies = TRUE)
          remotes::install_cran("lintr")
        shell: Rscript {0}

      - name: Install package
        run: R CMD INSTALL .

      - name: Lint
        run: lintr::lint_package()
        shell: Rscript {0}
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

<!-- end list -->

``` yaml
on:
  issue_comment:
    types: [created]
name: Commands
jobs:
  document:
    if: startsWith(github.event.comment.body, '/document')
    name: document
    runs-on: macOS-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v2
      - uses: r-lib/actions/pr-fetch@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
      - uses: r-lib/actions/setup-r@v1
      - name: Install dependencies
        run: Rscript -e 'install.packages(c("remotes", "roxygen2"))' -e 'remotes::install_deps(dependencies = TRUE)'
      - name: Document
        run: Rscript -e 'roxygen2::roxygenise()'
      - name: commit
        run: |
          git config --local user.email "actions@github.com"
          git config --local user.name "GitHub Actions"
          git add man/\* NAMESPACE
          git commit -m 'Document'
      - uses: r-lib/actions/pr-push@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
  style:
    if: startsWith(github.event.comment.body, '/style')
    name: style
    runs-on: macOS-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v2
      - uses: r-lib/actions/pr-fetch@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
      - uses: r-lib/actions/setup-r@v1
      - name: Install dependencies
        run: Rscript -e 'install.packages("styler")'
      - name: Style
        run: Rscript -e 'styler::style_pkg()'
      - name: commit
        run: |
          git config --local user.email "actions@github.com"
          git config --local user.name "GitHub Actions"
          git add \*.R
          git commit -m 'Style'
      - uses: r-lib/actions/pr-push@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```

## Render Rmarkdown

`usethis::use_github_action("render-rmarkdown")`

This example automatically re-builds any Rmarkdown file in the
repository whenever it changes and commits the results to the master
branch.

``` yaml
on:
  push:
    paths:
      - '**.Rmd'

name: Render Rmarkdown files

jobs:
  render:
    name: Render Rmarkdown files
    runs-on: macOS-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0
      - uses: r-lib/actions/setup-r@v1
      - uses: r-lib/actions/setup-pandoc@v1
      - name: Install rmarkdown, remotes, and the local package
        run: |
          install.packages("remotes")
          remotes::install_local(".")
          remotes::install_cran("rmarkdown")
        shell: Rscript {0}
      - name: Render Rmarkdown files
        run: |
          RMD_PATH=($(git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep '[.]Rmd$'))
          Rscript -e 'for (f in commandArgs(TRUE)) if (file.exists(f)) rmarkdown::render(f)' ${RMD_PATH[*]} 
      - name: Commit results
        run: |
          git config --local user.email "actions@github.com"
          git config --local user.name "GitHub Actions"
          git commit ${RMD_PATH[*]/.Rmd/.md} -m 'Re-build Rmarkdown files' || echo "No changes to commit"
          git push origin || echo "No changes to commit"
```

## Build pkgdown site

`usethis::use_github_action("pkgdown")`

This example builds a [pkgdown](https://pkgdown.r-lib.org/) site for a
repository and pushes the built package to [GitHub
Pages](https://pages.github.com/).

``` yaml
on:
  push:
    branches:
      - main
      - master

name: pkgdown

jobs:
  pkgdown:
    runs-on: macOS-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-r@v1

      - uses: r-lib/actions/setup-pandoc@v1

      - name: Query dependencies
        run: |
          install.packages('remotes')
          saveRDS(remotes::dev_package_deps(dependencies = TRUE), ".github/depends.Rds", version = 2)
          writeLines(sprintf("R-%i.%i", getRversion()$major, getRversion()$minor), ".github/R-version")
        shell: Rscript {0}

      - name: Restore R package cache
        uses: actions/cache@v2
        with:
          path: ${{ env.R_LIBS_USER }}
          key: ${{ runner.os }}-${{ hashFiles('.github/R-version') }}-1-${{ hashFiles('.github/depends.Rds') }}
          restore-keys: ${{ runner.os }}-${{ hashFiles('.github/R-version') }}-1-

      - name: Install dependencies
        run: |
          remotes::install_deps(dependencies = TRUE)
          install.packages("pkgdown", type = "binary")
        shell: Rscript {0}

      - name: Install package
        run: R CMD INSTALL .

      - name: Deploy package
        run: |
          git config --local user.email "actions@github.com"
          git config --local user.name "GitHub Actions"
          Rscript -e 'pkgdown::deploy_to_branch(new_process = FALSE)'
```

## Build bookdown site

`usethis::use_github_action("bookdown")`

This example builds a [bookdown](https://bookdown.org) site for a
repository and then deploys the site via
[netlify](https://www.netlify.com/). It uses
[renv](https://rstudio.github.io/renv/) to ensure the package versions
remain consistent across builds. You will need to run `renv::snapshot()`
locally and commit the `renv.lock` file before using this workflow, and
after every time you add a new package to `DESCRIPTION`. See [Using renv
with Continous
Integration](https://rstudio.github.io/renv/articles/ci.html) for
additional information. **Note** you need to add a `NETLIFY_AUTH_TOKEN`
and a `NETLIFY_SITE_ID` secret to your repository for the netlify deploy
(see [Managing secrets](#managing-secrets) section for details).

``` yaml
on:
  push:
    branches:
      - main
      - master

name: bookdown

jobs:
  build:
    runs-on: macOS-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - name: Checkout repo
        uses: actions/checkout@v2

      - name: Setup R
        uses: r-lib/actions/setup-r@v1

      - name: Install pandoc
        run: |
          brew install pandoc

      - name: Cache Renv packages
        uses: actions/cache@v2
        with:
          path: $HOME/.local/share/renv
          key: r-${{ hashFiles('renv.lock') }}
          restore-keys: r-

      - name: Cache bookdown results
        uses: actions/cache@v2
        with:
          path: _bookdown_files
          key: bookdown-${{ hashFiles('**/*Rmd') }}
          restore-keys: bookdown-

      - name: Install packages
        run: |
          R -e 'install.packages("renv")'
          R -e 'renv::restore()'

      - name: Build site
        run: Rscript -e 'bookdown::render_book("index.Rmd", quiet = TRUE)'

      - name: Install npm
        uses: actions/setup-node@v1

      - name: Deploy to Netlify
        # NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID added in the repo's secrets
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        run: |
          npm install netlify-cli -g
          netlify deploy --prod --dir _book
```

## Build blogdown site

`usethis::use_github_action("blogdown")`

This example builds a [blogdown](https://bookdown.org/yihui/blogdown/)
site for a repository and then deploys the book via
[netlify](https://www.netlify.com/). It uses
[renv](https://rstudio.github.io/renv/) to ensure the package versions
remain consistent across builds. You will need to run `renv::snapshot()`
locally and commit the `renv.lock` file before using this workflow, see
[Using renv with Continous
Integeration](https://rstudio.github.io/renv/articles/ci.html) for
additional information. **Note** you need to add a `NETLIFY_AUTH_TOKEN`
a `NETLIFY_SITE_ID` secret to your repository for the netlify deploy
(see [Managing secrets](#managing-secrets) section for details).

``` yaml
on:
  push:
    branches:
      - main
      - master

name: blogdown

jobs:
  build:
    runs-on: macOS-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - name: Checkout repo
        uses: actions/checkout@v2

      - name: Setup R
        uses: r-lib/actions/setup-r@v1

      - name: Install pandoc
        run: |
          brew install pandoc

      - name: Cache Renv packages
        uses: actions/cache@v2
        with:
          path: $HOME/.local/share/renv
          key: r-${{ hashFiles('renv.lock') }}
          restore-keys: r-

      - name: Install packages
        run: |
          R -e 'install.packages("renv")'
          R -e 'renv::restore()'

      - name: Install hugo
        run: |
          R -e 'blogdown::install_hugo()'

      - name: Build site
        run: |
          R -e 'blogdown::build_site(TRUE)'

      - name: Install npm
        uses: actions/setup-node@v1

      - name: Deploy to Netlify
        # NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID added in the repo's secrets
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        run: |
          npm install netlify-cli -g
          netlify deploy --prod
```

## Docker based workflow

`usethis::use_github_action("docker")`

If you develop locally with docker or are used to using other docker
based CI services and already have a docker container with all of your R
and system dependencies you can use that in GitHub Actions by adapting
the following workflow. This example workflow assumes you build some
model in `fit_model.R` and then have a report in `report.Rmd`. It then
uploads the rendered html from the report as a build artifact.

``` yaml
on: [push]
jobs:
  job1:
    runs-on: ubuntu-latest
    container: rocker/verse
    steps:
      - uses: actions/checkout@v1
      - run: Rscript fit_model.R
      - run: Rscript -e 'rmarkdown::render("report.Rmd")'
      - name: Upload results
        uses: actions/upload-artifact@main
        with:
          name: results
          path: report.html
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

## Forcing binaries

Code repositories such as [CRAN](http://cran.r-project.org) or
[RStudio](http://rstudio.com)’s RSPM provide R packages in binary (=
pre-compiled) form for some platforms, but these binaries can sometimes
be missing our lag behind the package sources published on the
repository. The
[setup-r](https://github.com/r-lib/actions/tree/master/setup-r) action,
and all example workflows utilizing it follow the
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

## Managing secrets

In some cases, your action may need to access an external resource to
deploy a result of your action. For example, the [bookdown]() and
[blogdown]() actions require access to your Netlify account. This access
is managed using a Personal Access Token, commonly called a PAT.

Netlify has a [process for creating a PAT using their
UI](https://docs.netlify.com/cli/get-started/#obtain-a-token-in-the-netlify-ui),
which we follow here.

1.  In a web browser, open [your Netlify **tokens**
    page](https://app.netlify.com/user/applications#personal-access-tokens).

2.  In another tab in your web browser, open your GitHub repository’s
    **secrets** page. The URL depends on your repository; it will look
    something like this:
    `https://github.com/{user}/{repo}/settings/secrets`.

3.  At the **tokens** page:
    
      - Click “New access token”.
      - Provide a description for your benefit, so you will know which
        token this is, perhaps something like `actions-{repo}`.
      - Click “Generate token”.
      - Copy the token to your clipboard.

4.  On your repository’s **secrets** page:
    
      - Click “Add a new secret”.
      - In the “Name” field, type `NETLIFY_AUTH_TOKEN` (or the name of
        the secret that the action expects).
      - In the “Value” field, paste the token from your clipboard.
      - Click “Add Secret”.

5.  At this point (certainly at some point), you may wish to close your
    **tokens** page to remove the visibility of your token.

The `NETLIFY_SITE_ID` is not quite as personal as the PAT and is visible
from your Netlify profile. This is the value of the **API ID** variable
that is listed on your site dashboard under Settings \> General \> Site
details \> Site information.
