# Tidyverse CI workflow

This workflow installs the last 5 minor R versions
and runs R CMD check via the [rcmdcheck](https://github.com/r-lib/rcmdcheck)
package on the three major OSs. This workflow is what the tidyverse teams uses
on their repositories, but is probably overkill for less widely used packages.

## When it can be used?

1. You have a complex R package
2. With OS-specific code
2. And you want to ensure compatibility with older R versions

```yaml
on: [push, pull_request]

name: Continuous integration

jobs:
  macOS-checks:
    name: macOS Checks
    runs-on: macOS-latest
    strategy:
      matrix:
        r: ['3.2', '3.3', '3.4', '3.5', '3.6', 'devel']
    steps:
      - uses: actions/checkout@v1
      - uses: r-lib/actions/setup-r@master
        with:
          r-version: ${{ matrix.r }}
      - name: Install dependencies
      - run: Rscript -e 'install.packges("remotes")' -e 'remotes::install_deps(dependencies = TRUE)'
      - name: Check
      - run: Rscript -e "rcmdcheck::rcmdcheck(manual = FALSE, error_on='error')"
  linux-checks:
    name: linux Checks
    runs-on: ubuntu-latest
    strategy:
      matrix:
        r: ['3.5', '3.6']
    container: rstudio/r-base:${{ matrix.r }}-xenial
    env:
      CRAN: 'https://demo.rstudiopm.com/all/__linux__/xenial/latest'
    steps:
      - uses: actions/checkout@v1
      - uses: r-lib/actions/setup-r@master
        with:
          r-version: ${{ matrix.r }}
      - name: Install dependencies
      - run: Rscript -e 'install.packges("remotes")' -e 'remotes::install_deps(dependencies = TRUE)'
      - name: Check
      - run: Rscript -e "rcmdcheck::rcmdcheck(manual = FALSE, error_on='error')"
  windows-checks:
    name: Windows Checks
    runs-on: windows-latest
    strategy:
      matrix:
        r: ['3.2', '3.3', '3.4', '3.5', '3.6', 'devel']
    steps:
      - uses: actions/checkout@v1
      - uses: r-lib/actions/setup-r@master
        with:
          r-version: ${{ matrix.r }}
      - name: Install dependencies
      - run: Rscript -e 'install.packges("remotes")' -e 'remotes::install_deps(dependencies = TRUE)'
      - name: Check
      - run: Rscript -e "rcmdcheck::rcmdcheck(manual = FALSE, error_on='error')"
```

## Can I tune it?

Sure!

This workflow is using following Actions to execute the pipeline,
see their pages for the available options:

1. [`r-lib/actions/setup-r`](https://github.com/r-lib/actions/setup-r)
