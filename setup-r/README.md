
<!-- README.md is generated from README.Rmd. Please edit that file -->

# setup-r

[![RStudio
community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This action sets up an R environment for use in actions by:

-   Downloading and caching a version of R by version and adding to PATH
-   Registering [problem
    matchers](https://github.com/r-lib/actions/tree/master/setup-r/.github)
    for error output
-   Setting the following environment variables
    -   `NOT_CRAN=true`
    -   `TZ=UTC`
    -   `R_LIBS_USER=tempdir/Library`
    -   `_R_CHECK_SYSTEM_CLOCK_=FALSE`
-   Removing the `-fopenmp` flags from Makeconf on macOS, which are not
    supported with Apple’s default Command Line Tools compilers.
-   Appending ‘on GitHub Actions’ to the default HTTP user agent. This
    is useful to distinguish GitHub Actions package requests from other
    sources.
-   Supplying the installed R version as a `installed-r-version` output.

## Inputs

-   **r-version** (`'release'`) - Version range or exact version of an R
    version to use.
-   **rtools-version** (`''`) - Exact version of Rtools to use. Default
    uses latest suitable rtools for the given version of R.
-   **Ncpus** (`'1'`) - Value to set the R option `Ncpus` to.
-   **crayon.enabled** (`'NULL'`) - Value to set the R option
    `crayon.enabled` to.
-   **remove-openmp-macos** (`true`) - If true, remove `-fopenmp` from
    the default compilation flags, e.g. `SHLIB_OPENMP_CFLAGS`, as the
    macOS Command Line Tools do not support OpenMP.
-   **http-user-agent** (`'default'`) - If `"default"` or `""`, sets the
    HTTPUserAgent option to e.g. for R 3.6.3 running on macOS Catalina,
    `"R/3.6.3 R (3.6.3 x86_64-apple-darwin17.0 x86_64 darwin17.0) on GitHub Actions"`.
    If `"release"` sets the user agent to the default user agent for the
    current R release. Otherwise uses whatever value is passed to
    `http-user-agent`.
-   **install-r** (`true`) - If “true”, install R during the setup; if
    “false”, use the existing installation in the GitHub Action image.
-   **windows-path-include-mingw** (`true`) - If “true” put the 64 bit
    mingw directory from Rtools on the PATH for Windows builds.
-   **update-rtools** (`false`) - Update rtools40 compilers and
    libraries to the latest builds.
-   **use-public-rspm** (`false`) - Use the public version of RStudio
    package manager available at <https://packagemanager.rstudio.com/>
    to serve binaries for Linux and Windows.
-   **extra-repositories** (`''`) - One or more extra CRAN-like
    repositories to include in the `repos` global option

## Outputs

-   **installed-r-version** - The full R version installed by the action

## Usage

Basic:

``` yaml
steps:
- uses: actions/checkout@master
- uses: r-lib/actions/setup-r@v1
  with:
    r-version: '3.5.3' # The R version to download (if necessary) and use.
- run: Rscript -e 'print("hello")'
```

Matrix Testing:

``` yaml
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

## License

The scripts and documentation in this project are released under the
[MIT License](LICENSE)

## Contributions

Contributions are welcome!
