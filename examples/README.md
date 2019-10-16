
## Quickstart CI workflow

This workflow installs latest stable R version and runs R CMD check via
the [rcmdcheck](https://github.com/r-lib/rcmdcheck) package.

### When can it be used?

1.  You have a simple R package
2.  There is no OS-specific code
3.  You want a quick start with R CI

<!-- end list -->

``` yaml
on: [push, pull_request]

name: Continuous integration

jobs:
  check:
    name: Check
    runs-on: macOS-latest
    steps:
      - uses: actions/checkout@v1
      - uses: r-lib/actions/setup-r@master
      - name: Install dependencies
      - run: Rscript -e 'install.packges("remotes")' -e 'remotes::install_deps(dependencies = TRUE)'
      - name: Check
      - run: Rscript -e "rcmdcheck::rcmdcheck(manual = FALSE, error_on='error')"
```

## Tidyverse CI workflow

This workflow installs the last 5 minor R versions and runs R CMD check
via the [rcmdcheck](https://github.com/r-lib/rcmdcheck) package on the
three major OSs. This workflow is what the tidyverse teams uses on their
repositories, but is probably overkill for less widely used packages.

## When it can be used?

1.  You have a complex R package
2.  With OS-specific code
3.  And you want to ensure compatibility with older R versions

<!-- end list -->

``` yaml
on: [push, pull_request]

name: Continuous integration

jobs:
  macOS:
    runs-on: macOS-latest
    strategy:
      matrix:
        r: ['3.2', '3.3', '3.4', '3.5', '3.6', 'devel']
    steps:
      - uses: actions/checkout@v1
      - uses: r-lib/actions/setup-r@master
        with:
          r-version: ${{ matrix.r }}
      - uses: r-lib/actions/setup-pandoc@master
      - name: Install dependencies
        run: Rscript -e 'install.packages(c("remotes", "rcmdcheck"))' -e 'remotes::install_deps(dependencies = TRUE)'
      - name: Check
        run: Rscript -e "rcmdcheck::rcmdcheck(manual = FALSE, error_on='error')"

  linux:
    runs-on: ubuntu-latest
    container: rstudio/r-base:3.6-xenial
    env:
      CRAN: 'https://demo.rstudiopm.com/all/__linux__/xenial/latest'
    steps:
      - uses: actions/checkout@v1
      - uses: r-lib/actions/setup-r@master
      - uses: r-lib/actions/setup-pandoc@master
      - name: Install dependencies
        run: Rscript -e 'install.packages(c("remotes", "rcmdcheck"))' -e 'remotes::install_deps(dependencies = TRUE)'
      - name: Check
        run: Rscript -e "rcmdcheck::rcmdcheck(manual = FALSE, error_on='error')"

  windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v1
      - uses: r-lib/actions/setup-r@master
      - uses: r-lib/actions/setup-pandoc@master
      - name: Install dependencies
        run: Rscript -e 'install.packages(c("remotes", "rcmdcheck"))' -e 'remotes::install_deps(dependencies = TRUE)'
      - name: Check
        run: Rscript -e "rcmdcheck::rcmdcheck(manual = FALSE, error_on='error')"
```

## Commands workflow

This workflow enables the use of 2 R specific commands in pull request
issue comments. `\document` will use
[roxygen2](https://roxygen2.r-lib.org/) to rebuild the documentation for
the package and commit the result to the pull request. `\style` will use
[styler](https://styler.r-lib.org/) to restyle your package.

## When it can they be used?

1.  You get frequent Pull Requests, often with documentation only fixes.
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
      - uses: actions/checkout@v1
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
          git commit -m 'Document' --author 'GitHub Actions <actions@github.com>'
      - uses: r-lib/actions/pr-push@master
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
  style:
    if: startsWith(github.event.comment.body, '/style')
    name: document
    runs-on: macOS-latest
    steps:
      - uses: actions/checkout@master
      - uses: r-lib/actions/pr-fetch@master
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
      - uses: r-lib/actions/setup-r@master
      - name: Install dependencies
        run: Rscript -e 'install.packages("styler")'
      - name: style
        run: Rscript -e 'styler::style_pkg()'
      - name: commit
        run: |
          git add \*.R
          git commit -m 'style' --author 'GitHub Actions <actions@github.com>'
      - uses: r-lib/actions/pr-push@master
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```

## Re-build README.md every day

This example automatically re-builds the README.md from README.Rmd every
day and opens a PR with the changes (if any).

``` yaml
on:
  schedule:
    # run on Monday day at 11 PM
    - cron: '0 23 * * 1'

jobs:
  name: Render readme
  runs-on: macOS-latest
  steps:
    - uses: actions/checkout@v1
    - uses: r-lib/actions/setup-r@master
    - name: Install dependencies
      run: Rscript -e 'install.packges(c("remotes"))' -e 'remotes::install_deps(dependencies = TRUE)'
    - name: Render README
      run: Rscript -e 'rmarkdown::render("README.Rmd")'
    - name: Commit results
      run: |
        git checkout -b build-readme
        git commit README.md -m 'Re-build readme' --author 'GitHub Actions <actions@github.com>'
    - name: Create Pull Request
      uses: peter-evans/create-pull-request@v1.5.1-multi
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
