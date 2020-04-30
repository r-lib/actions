
  - [Quickstart CI](#quickstart-ci-workflow) - A simple CI workflow to
    check with the release version of R.
  - [Tidyverse CI](#tidyverse-ci-workflow) - A more complex CI workflow
  - [Pull Request Commands](#commands-workflow) - Adds `/document` and
    `/style` commands for pull requests.
  - [Render README](#render-readme) - Render README.Rmd when it changes
    and commit the result
  - [Test coverage](#test-coverage-workflow) - Run `covr::codecov()` on
    an R package.
  - [lint](#lint-workflow) - Run `lintr::lint_package()` on an R
    package.
  - [Build pkgdown site](#build-pkgdown-site) - Build a
    [pkgdown](https://pkgdown.r-lib.org/) site for an R package and
    deploy it to [GitHub Pages](https://pages.github.com/).
  - [Build bookdown site](#build-bookdown-site) - Build a
    [bookdown](https://bookdown.org) site and deploy it to
    [netlify](https://www.netlify.com/).
  - [Build blogdown site](#build-blogdown-site) - Build a
    [blogdown](https://bookdown.org/yihui/blogdown/) site and deploy it
    to [netlify](https://www.netlify.com/).
  - [Managing secrets](#managing-secrets) - How to generate auth tokens
    and make them available to actions.

## Quickstart CI workflow

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
on: [push, pull_request]

name: R-CMD-check

jobs:
  R-CMD-check:
    runs-on: macOS-latest
    steps:
      - uses: actions/checkout@v2
      - uses: r-lib/actions/setup-r@master
      - name: Install dependencies
        run: |
          install.packages(c("remotes", "rcmdcheck"))
          remotes::install_deps(dependencies = TRUE)
        shell: Rscript {0}
      - name: Check
        run: rcmdcheck::rcmdcheck(args = "--no-manual", error_on = "error")
        shell: Rscript {0}
```

## Standard CI workflow

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
on:
  push:
    branches:
      - master
  pull_request:
    branches:
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
          - {os: macOS-latest, r: 'devel'}
          - {os: ubuntu-16.04, r: 'release', rspm: "https://demo.rstudiopm.com/all/__linux__/xenial/latest"}

    env:
      R_REMOTES_NO_ERRORS_FROM_WARNINGS: true
      RSPM: ${{ matrix.config.rspm }}

    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-r@master
        with:
          r-version: ${{ matrix.config.r }}

      - uses: r-lib/actions/setup-pandoc@master

      - name: Query dependencies
        run: |
          install.packages('remotes')
          saveRDS(remotes::dev_package_deps(dependencies = TRUE), ".github/depends.Rds", version = 2)
        shell: Rscript {0}

      - name: Cache R packages
        if: runner.os != 'Windows'
        uses: actions/cache@v1
        with:
          path: ${{ env.R_LIBS_USER }}
          key: ${{ runner.os }}-r-${{ matrix.config.r }}-1-${{ hashFiles('.github/depends.Rds') }}
          restore-keys: ${{ runner.os }}-r-${{ matrix.config.r }}-1-

      - name: Install system dependencies
        if: runner.os == 'Linux'
        env:
          RHUB_PLATFORM: linux-x86_64-ubuntu-gcc
        run: |
          Rscript -e "remotes::install_github('r-hub/sysreqs')"
          sysreqs=$(Rscript -e "cat(sysreqs::sysreq_commands('DESCRIPTION'))")
          sudo -s eval "$sysreqs"

      - name: Install dependencies
        run: |
          remotes::install_deps(dependencies = TRUE)
          remotes::install_cran("rcmdcheck")
        shell: Rscript {0}

      - name: Check
        env:
          _R_CHECK_CRAN_INCOMING_REMOTE_: false
        run: rcmdcheck::rcmdcheck(args = c("--no-manual", "--as-cran"), error_on = "warning", check_dir = "check")
        shell: Rscript {0}

      - name: Upload check results
        if: failure()
        uses: actions/upload-artifact@master
        with:
          name: ${{ runner.os }}-r${{ matrix.config.r }}-results
          path: check
```

## Tidyverse CI workflow

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
on:
  push:
    branches:
      - master
  pull_request:
    branches:
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
          - {os: macOS-latest,   r: 'devel'}
          - {os: macOS-latest,   r: '4.0'}
          - {os: windows-latest, r: '4.0'}
          - {os: ubuntu-16.04,   r: '4.0', rspm: "https://demo.rstudiopm.com/all/__linux__/xenial/latest"}
          - {os: ubuntu-16.04,   r: '3.6', rspm: "https://demo.rstudiopm.com/all/__linux__/xenial/latest"}
          - {os: ubuntu-16.04,   r: '3.5', rspm: "https://demo.rstudiopm.com/all/__linux__/xenial/latest"}
          - {os: ubuntu-16.04,   r: '3.4', rspm: "https://demo.rstudiopm.com/all/__linux__/xenial/latest"}
          - {os: ubuntu-16.04,   r: '3.3', rspm: "https://demo.rstudiopm.com/all/__linux__/xenial/latest"}

    env:
      R_REMOTES_NO_ERRORS_FROM_WARNINGS: true
      RSPM: ${{ matrix.config.rspm }}

    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-r@master
        with:
          r-version: ${{ matrix.config.r }}

      - uses: r-lib/actions/setup-pandoc@master

      - name: Query dependencies
        run: |
          install.packages('remotes')
          saveRDS(remotes::dev_package_deps(dependencies = TRUE), ".github/depends.Rds", version = 2)
        shell: Rscript {0}

      - name: Cache R packages
        if: runner.os != 'Windows'
        uses: actions/cache@v1
        with:
          path: ${{ env.R_LIBS_USER }}
          key: ${{ runner.os }}-r-${{ matrix.config.r }}-1-${{ hashFiles('.github/depends.Rds') }}
          restore-keys: ${{ runner.os }}-r-${{ matrix.config.r }}-1-

      - name: Install system dependencies
        if: runner.os == 'Linux'
        env:
          RHUB_PLATFORM: linux-x86_64-ubuntu-gcc
        run: |
          Rscript -e "remotes::install_github('r-hub/sysreqs')"
          sysreqs=$(Rscript -e "cat(sysreqs::sysreq_commands('DESCRIPTION'))")
          sudo -s eval "$sysreqs"

      - name: Install dependencies
        run: |
          remotes::install_deps(dependencies = TRUE)
          remotes::install_cran("rcmdcheck")
        shell: Rscript {0}

      - name: Check
        env:
          _R_CHECK_CRAN_INCOMING_: false
        run: rcmdcheck::rcmdcheck(args = c("--no-manual", "--as-cran"), error_on = "warning", check_dir = "check")
        shell: Rscript {0}

      - name: Upload check results
        if: failure()
        uses: actions/upload-artifact@master
        with:
          name: ${{ runner.os }}-r${{ matrix.config.r }}-results
          path: check
```

## Test coverage workflow

This example uses the [covr](https://covr.r-lib.org) package to query
the test coverage of your package and upload the result to
[codecov.io](https://codecov.io)

``` yaml
on:
  push:
    branches:
      - master
  pull_request:
    branches:
      - master

name: test-coverage

jobs:
  test-coverage:
    runs-on: macOS-latest
    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-r@master

      - uses: r-lib/actions/setup-pandoc@master

      - name: Query dependencies
        run: |
          install.packages('remotes')
          saveRDS(remotes::dev_package_deps(dependencies = TRUE), ".github/depends.Rds", version = 2)
        shell: Rscript {0}

      - name: Cache R packages
        uses: actions/cache@v1
        with:
          path: ${{ env.R_LIBS_USER }}
          key: macOS-r-4.0-1-${{ hashFiles('.github/depends.Rds') }}
          restore-keys: macOS-r-4.0-1-

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

This example uses the [lintr](https://github.com/jimhester/lintr)
package to lint your package and return the results as build
annotations.

``` yaml
on:
  push:
    branches:
      - master
  pull_request:
    branches:
      - master

name: lint

jobs:
  lint:
    runs-on: macOS-latest
    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-r@master

      - name: Query dependencies
        run: |
          install.packages('remotes')
          saveRDS(remotes::dev_package_deps(dependencies = TRUE), ".github/depends.Rds", version = 2)
        shell: Rscript {0}

      - name: Cache R packages
        uses: actions/cache@v1
        with:
          path: ${{ env.R_LIBS_USER }}
          key: macOS-r-4.0-1-${{ hashFiles('.github/depends.Rds') }}
          restore-keys: macOS-r-4.0-1-

      - name: Install dependencies
        run: |
          install.packages(c("remotes"))
          remotes::install_deps(dependencies = TRUE)
          remotes::install_cran("lintr")
        shell: Rscript {0}

      - name: Lint
        run: lintr::lint_package()
        shell: Rscript {0}
```

## Commands workflow

This workflow enables the use of 2 R specific commands in pull request
issue comments. `/document` will use
[roxygen2](https://roxygen2.r-lib.org/) to rebuild the documentation for
the package and commit the result to the pull request. `/style` will use
[styler](https://styler.r-lib.org/) to restyle your package.

## When it can they be used?

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
    steps:
      - uses: actions/checkout@v2
      - uses: r-lib/actions/pr-fetch@master
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
      - uses: r-lib/actions/setup-r@master
      - name: Install dependencies
        run: Rscript -e 'install.packages(c("remotes", "roxygen2"))' -e 'remotes::install_deps(dependencies = TRUE)'
      - name: Document
        run: Rscript -e 'roxygen2::roxygenise()'
      - name: commit
        run: |
          git add man/\* NAMESPACE
          git commit -m 'Document'
      - uses: r-lib/actions/pr-push@master
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
  style:
    if: startsWith(github.event.comment.body, '/style')
    name: style
    runs-on: macOS-latest
    steps:
      - uses: actions/checkout@v2
      - uses: r-lib/actions/pr-fetch@master
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
      - uses: r-lib/actions/setup-r@master
      - name: Install dependencies
        run: Rscript -e 'install.packages("styler")'
      - name: Style
        run: Rscript -e 'styler::style_pkg()'
      - name: commit
        run: |
          git add \*.R
          git commit -m 'Style'
      - uses: r-lib/actions/pr-push@master
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```

## Render README

This example automatically re-builds this README.md from README.Rmd
whenever it or its yaml dependencies change and commits the results to
the master branch.

``` yaml
on:
  push:
    paths:
      - README.Rmd

name: Render README

jobs:
  render:
    name: Render README
    runs-on: macOS-latest
    steps:
      - uses: actions/checkout@v2
      - uses: r-lib/actions/setup-r@v1
      - uses: r-lib/actions/setup-pandoc@v1
      - name: Install rmarkdown
        run: Rscript -e 'install.packages("rmarkdown")'
      - name: Render README
        run: Rscript -e 'rmarkdown::render("README.Rmd")'
      - name: Commit results
        run: |
          git commit examples/README.md -m 'Re-build README.Rmd' || echo "No changes to commit"
          git push origin || echo "No changes to commit"
```

## Build pkgdown site

This example builds a [pkgdown](https://pkgdown.r-lib.org/) site for a
repository and pushes the built package to [GitHub
Pages](https://pages.github.com/).

``` yaml
on:
  push:
    branches: master

name: pkgdown

jobs:
  pkgdown:
    runs-on: macOS-latest
    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-r@master

      - uses: r-lib/actions/setup-pandoc@master

      - name: Query dependencies
        run: |
          install.packages('remotes')
          saveRDS(remotes::dev_package_deps(dependencies = TRUE), ".github/depends.Rds", version = 2)
        shell: Rscript {0}

      - name: Cache R packages
        uses: actions/cache@v1
        with:
          path: ${{ env.R_LIBS_USER }}
          key: macOS-r-4.0-1-${{ hashFiles('.github/depends.Rds') }}
          restore-keys: macOS-r-4.0-1-

      - name: Install dependencies
        run: |
          install.packages("remotes")
          remotes::install_deps(dependencies = TRUE)
          remotes::install_dev("pkgdown")
        shell: Rscript {0}

      - name: Install package
        run: R CMD INSTALL .

      - name: Deploy package
        run: pkgdown::deploy_to_branch(new_process = FALSE)
        shell: Rscript {0}
```

## Build bookdown site

This example builds a [bookdown](https://bookdown.org) site for a
repository and then deploys the site via
[netlify](https://www.netlify.com/). It uses
[renv](https://rstudio.github.io/renv/) to ensure the package versions
remain consistent across builds. You will need to run `renv::snapshot()`
locally and commit the `renv.lock` file before using this workflow, see
[Using renv with Continous
Integeration](https://rstudio.github.io/renv/articles/ci.html) for
additional information. **Note** you need to add a `NETLIFY_AUTH_TOKEN`
secret to your repository for the netlify deploy (see [Managing
secrets](#managing-secrets) section for details).

``` yaml
on:
  push:
    branches: master

name: bookdown

jobs:
  build:
    runs-on: macOS-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v2

      - name: Setup R
        uses: r-lib/actions/setup-r@master

      - name: Install pandoc and pandoc citeproc
        run: |
          brew install pandoc
          brew install pandoc-citeproc

      - name: Cache Renv packages
        uses: actions/cache@v1
        with:
          path: $HOME/.local/share/renv
          key: r-${{ hashFiles('renv.lock') }}
          restore-keys: r-

      - name: Cache bookdown results
        uses: actions/cache@v1
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

This example builds a [blogdown](https://bookdown.org/yihui/blogdown/)
site for a repository and then deploys the book via
[netlify](https://www.netlify.com/). It uses
[renv](https://rstudio.github.io/renv/) to ensure the package versions
remain consistent across builds. You will need to run `renv::snapshot()`
locally and commit the `renv.lock` file before using this workflow, see
[Using renv with Continous
Integeration](https://rstudio.github.io/renv/articles/ci.html) for
additional information. **Note** you need to add a `NETLIFY_AUTH_TOKEN`
secret to your repository for the netlify deploy (see [Managing
secrets](#managing-secrets) section for details).

``` yaml
on:
  push:
    branches: master

name: blogdown

jobs:
  build:
    runs-on: macOS-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v2

      - name: Setup R
        uses: r-lib/actions/setup-r@master

      - name: Install pandoc and pandoc citeproc
        run: |
          brew install pandoc
          brew install pandoc-citeproc

      - name: Cache Renv packages
        uses: actions/cache@v1
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
        uses: actions/upload-artifact@master
        with:
          name: results
          path: report.html
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
is managed using a personal access token, commonly called a PAT.

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
