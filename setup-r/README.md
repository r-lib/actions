# setup-r

[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This action sets up an R environment for use in actions by:

- Downloading and caching a version of R by version and adding to PATH
- Registering [problem matchers](https://github.com/r-lib/actions/tree/master/setup-r/.github) for error output
- Setting the following environment variables
  - `NOT_CRAN=true`
  - `TZ=UTC`
  - `R_LIBS_USER=tempdir/Library`
  - `_R_CHECK_SYSTEM_CLOCK_=FALSE`
- Removing the `-fopenmp` flags from Makeconf on macOS, which are not supported
  with Apple's default Command Line Tools compilers.
- Appending 'on GitHub Actions' to the default HTTP user agent. This is useful to
  distinguish GitHub Actions package requests from other sources.
- Supplying the installed R version as a `installed-r-version` output.

# Usage

See [action.yml](action.yml)

Basic:
```yaml
steps:
- uses: actions/checkout@master
- uses: r-lib/actions/setup-r@v1
  with:
    r-version: '3.5.3' # The R version to download (if necessary) and use.
- run: Rscript -e 'print("hello")'
```

Matrix Testing:
```yaml
jobs:
  build:
    runs-on: ubuntu-18.04
    strategy:
      matrix:
        R: [ '3.5.3', '3.6.1' ]
    name: R ${{ matrix.R }} sample
    steps:
      - uses: actions/checkout@master
      - name: Setup R
        uses: r-lib/actions/setup-r@v1
        with:
          r-version: ${{ matrix.R }}
      - run: Rscript -e 'print("hello")'
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome! See [Contributor's Guide](docs/contributors.md)
