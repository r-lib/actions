
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
  - [`pkgdown`](#build-pkgdown-site) - Build a
    [pkgdown](https://pkgdown.r-lib.org/) site for an R package and
    deploy it to [GitHub Pages](https://pages.github.com/).

RMarkdown workflows:

  - [`render-rmarkdown`](#render-rmarkdown) - Render one or more
    Rmarkdown files when they change and commit the result.
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
  - [`lint-project`](#lint-project-workflow) - Run `lintr::lint_dir()`
    on an R project.
  - [`shiny-deploy`](#shiny-app-deployment) - Deploy a Shiny app to
    shinyapps.io or RStudio Connect.

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
# Workflow derived from https://github.com/r-lib/actions/tree/master/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

name: R-CMD-check

jobs:
  R-CMD-check:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
      R_KEEP_PKG_SOURCE: yes
    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-r@v1
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-r-dependencies@v1
        with:
          extra-packages: rcmdcheck

      - uses: r-lib/actions/check-r-package@v1
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

<!-- end list -->

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/master/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

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
          - {os: ubuntu-latest,   r: 'devel', http-user-agent: 'release'}
          - {os: ubuntu-latest,   r: 'release'}
          - {os: ubuntu-latest,   r: 'oldrel-1'}

    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
      R_KEEP_PKG_SOURCE: yes

    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-pandoc@v1

      - uses: r-lib/actions/setup-r@v1
        with:
          r-version: ${{ matrix.config.r }}
          http-user-agent: ${{ matrix.config.http-user-agent }}
          use-public-rspm: true

      - uses: r-lib/actions/setup-r-dependencies@v1
        with:
          extra-packages: rcmdcheck

      - uses: r-lib/actions/check-r-package@v1
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
# Workflow derived from https://github.com/r-lib/actions/tree/master/examples
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
          # Use 3.6 to trigger usage of RTools35
          - {os: windows-latest, r: '3.6'}

          # Use older ubuntu to maximise backward compatibility
          - {os: ubuntu-18.04,   r: 'devel', http-user-agent: 'release'}
          - {os: ubuntu-18.04,   r: 'release'}
          - {os: ubuntu-18.04,   r: 'oldrel-1'}
          - {os: ubuntu-18.04,   r: 'oldrel-2'}
          - {os: ubuntu-18.04,   r: 'oldrel-3'}
          - {os: ubuntu-18.04,   r: 'oldrel-4'}

    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
      R_KEEP_PKG_SOURCE: yes

    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-pandoc@v1

      - uses: r-lib/actions/setup-r@v1
        with:
          r-version: ${{ matrix.config.r }}
          http-user-agent: ${{ matrix.config.http-user-agent }}
          use-public-rspm: true

      - uses: r-lib/actions/setup-r-dependencies@v1
        with:
          extra-packages: rcmdcheck

      - uses: r-lib/actions/check-r-package@v1
```

## Test coverage workflow

`usethis::use_github_action("test-coverage")`

This example uses the [covr](https://covr.r-lib.org) package to query
the test coverage of your package and upload the result to
[codecov.io](https://codecov.io)

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/master/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

name: test-coverage

jobs:
  test-coverage:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}

    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-r@v1
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-r-dependencies@v1
        with:
          extra-packages: covr

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
# Workflow derived from https://github.com/r-lib/actions/tree/master/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

name: lint

jobs:
  lint:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-r@v1
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-r-dependencies@v1
        with:
          extra-packages: lintr

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
# Workflow derived from https://github.com/r-lib/actions/tree/master/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  issue_comment:
    types: [created]

name: Commands

jobs:
  document:
    if: ${{ github.event.issue.pull_request && (github.event.comment.author_association == 'MEMBER' || github.event.comment.author_association == 'OWNER') && startsWith(github.event.comment.body, '/document') }}
    name: document
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/pr-fetch@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}

      - uses: r-lib/actions/setup-r@v1
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-r-dependencies@v1
        with:
          extra-packages: roxygen2

      - name: Document
        run: Rscript -e 'roxygen2::roxygenise()'

      - name: commit
        run: |
          git config --local user.name "$GITHUB_ACTOR"
          git config --local user.email "$GITHUB_ACTOR@users.noreply.github.com"
          git add man/\* NAMESPACE
          git commit -m 'Document'

      - uses: r-lib/actions/pr-push@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}

  style:
    if: ${{ github.event.issue.pull_request && (github.event.comment.author_association == 'MEMBER' || github.event.comment.author_association == 'OWNER') && startsWith(github.event.comment.body, '/style') }}
    name: style
    runs-on: ubuntu-latest
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
          git config --local user.name "$GITHUB_ACTOR"
          git config --local user.email "$GITHUB_ACTOR@users.noreply.github.com"
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
# Workflow derived from https://github.com/r-lib/actions/tree/master/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    paths: ['**.Rmd']

name: render-rmarkdown

jobs:
  render-rmarkdown:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - name: Checkout repo
        uses: actions/checkout@v2
        with:
          fetch-depth: 0

      - uses: r-lib/actions/setup-pandoc@v1

      - uses: r-lib/actions/setup-r@v1

      - uses: r-lib/actions/setup-renv@v1
      
      - name: Render Rmarkdown files
        run: |
          RMD_PATH=($(git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep '[.]Rmd$'))
          Rscript -e 'for (f in commandArgs(TRUE)) if (file.exists(f)) rmarkdown::render(f)' ${RMD_PATH[*]}

      - name: Commit results
        run: |
          git config --local user.name "$GITHUB_ACTOR"
          git config --local user.email "$GITHUB_ACTOR@users.noreply.github.com"
          git commit ${RMD_PATH[*]/.Rmd/.md} -m 'Re-build Rmarkdown files' || echo "No changes to commit"
          git push origin || echo "No changes to commit"
```

## Build pkgdown site

`usethis::use_github_action("pkgdown")`

This example builds a [pkgdown](https://pkgdown.r-lib.org/) site for a
repository and pushes the built package to [GitHub
Pages](https://pages.github.com/).

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/master/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]
    tags: ['*']

name: pkgdown

jobs:
  pkgdown:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-pandoc@v1

      - uses: r-lib/actions/setup-r@v1
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-r-dependencies@v1
        with:
          extra-packages: pkgdown
          needs: website

      - name: Deploy package
        run: |
          git config --local user.name "$GITHUB_ACTOR"
          git config --local user.email "$GITHUB_ACTOR@users.noreply.github.com"
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
# Workflow derived from https://github.com/r-lib/actions/tree/master/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]

name: bookdown

jobs:
  bookdown:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-pandoc@v1

      - uses: r-lib/actions/setup-r@v1
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-renv@v1

      - name: Cache bookdown results
        uses: actions/cache@v2
        with:
          path: _bookdown_files
          key: bookdown-${{ hashFiles('**/*Rmd') }}
          restore-keys: bookdown-

      - name: Build site
        run: Rscript -e 'bookdown::render_book("index.Rmd", quiet = TRUE)'

      - name: Deploy to GitHub pages 🚀
        uses: JamesIves/github-pages-deploy-action@4.1.4
        with:
          branch: gh-pages
          folder: _book
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
Integration](https://rstudio.github.io/renv/articles/ci.html) for
additional information. **Note** you need to add a `NETLIFY_AUTH_TOKEN`
a `NETLIFY_SITE_ID` secret to your repository for the netlify deploy
(see [Managing secrets](#managing-secrets) section for details).

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/master/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]

name: blogdown

jobs:
  blogdown:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-pandoc@v1

      - uses: r-lib/actions/setup-r@v1
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-renv@v1

      - name: Install hugo
        run: |
          R -e 'blogdown::install_hugo()'

      - name: Build site
        run: |
          R -e 'blogdown::build_site(TRUE)'

      - name: Deploy to GitHub pages 🚀
        uses: JamesIves/github-pages-deploy-action@4.1.4
        with:
          branch: gh-pages
          folder: public
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

<!-- end list -->

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/master/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]

name: shiny-deploy

jobs:
  shiny-deploy:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-pandoc@v1

      - uses: r-lib/actions/setup-r@v1
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-renv@v1

      - name: Install rsconnect
        run: install.packages("rsconnect")
        shell: Rscript {0}

      - name: Authorize and deploy app
        run: |
          rsconnect::setAccountInfo(${{ secrets.RSCONNECT_USER }}, ${{ secrets.RSCONNECT_TOKEN }}, ${{ secrets.RSCONNECT_SECRET }})
          rsconnect::deployApp()
        shell: Rscript {0}
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
# Workflow derived from https://github.com/r-lib/actions/tree/master/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on: [push]

name: docker

jobs:
  docker:
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

## Lint project workflow

`usethis::use_github_action("lint-project")`

This example uses the [lintr](https://github.com/jimhester/lintr)
package to lint your project and return the results as annotations.

``` yaml
# Workflow derived from https://github.com/r-lib/actions/tree/master/examples
# Need help debugging build failures? Start at https://github.com/r-lib/actions#where-to-find-help
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

name: lint-project

jobs:
  lint-project:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v2

      - uses: r-lib/actions/setup-r@v1
        with:
          use-public-rspm: true

      - name: Install lintr
        run: install.packages("lintr")
        shell: Rscript {0}

      - name: Lint root directory
        run: lintr::lint_dir()
        shell: Rscript {0}
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
