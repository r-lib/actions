# Tidyverse CI workflow

This workflow installs the last 5 minor R versions
and runs R CMD check via the [rcmdcheck](https://github.com/r-lib/rcmdcheck)
package on the three major OSs. This workflow is what the tidyverse teams uses
on their repositories, but is probably overkill for less widely used packages.

## When it can be used?

1. You have a complex R package
2. With OS-specific code
3. And you want to ensure compatibility with older R versions

```yaml
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

## Can I tune it?

Sure!

This workflow is using following Actions to execute the pipeline,
see their pages for the available options:

1. [`r-lib/actions/setup-r`](https://github.com/r-lib/actions/setup-r)
