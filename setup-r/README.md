
<!-- README.md is generated from README.Rmd. Please edit that file -->

# setup-r

[![RStudio
community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This action sets up an R environment for use in actions by:

- Downloading and caching a version of R by version and adding to PATH
- Registering [problem
  matchers](https://github.com/r-lib/actions/tree/v2/setup-r/.github)
  for error output
- Setting the following environment variables
  - `NOT_CRAN=true`
  - `TZ=UTC`
  - `R_LIBS_USER=tempdir/Library`
  - `_R_CHECK_SYSTEM_CLOCK_=FALSE`
- Removing the `-fopenmp` flags from Makeconf on macOS, which are not
  supported with Apple’s default Command Line Tools compilers.
- Appending ‘on GitHub Actions’ to the default HTTP user agent. This is
  useful to distinguish GitHub Actions package requests from other
  sources.
- Supplying the installed R version as a `installed-r-version` output.

## Inputs

- **r-version** (`'release'`) - Version range or exact version of an R
  version to use. “devel” is the current development version, and “next”
  is the next version of R, either R-patched, or R-alpha, R-beta, R-rc
  or R-prerelease. Use “renv” to retrieve R version recorded in
  renv.lock file.
- **rtools-version** (`''`) - Exact version of Rtools to use. Default
  uses latest suitable rtools for the given version of R. Set it to “42”
  for Rtools42.
- **Ncpus** (`'1'`) - Value to set the R option `Ncpus` to.
- **remove-openmp-macos** (`true`) - If true, remove `-fopenmp` from the
  default compilation flags, e.g. `SHLIB_OPENMP_CFLAGS`, as the macOS
  Command Line Tools do not support OpenMP.
- **http-user-agent** (`'default'`) - If `"default"` or `""`, sets the
  HTTPUserAgent option to e.g. for R 3.6.3 running on macOS Catalina,
  `"R/3.6.3 R (3.6.3 x86_64-apple-darwin17.0 x86_64 darwin17.0) on GitHub Actions"`.
  If `"release"` sets the user agent to the default user agent for the
  current R release. Otherwise uses whatever value is passed to
  `http-user-agent`.
- **install-r** (`true`) - If “true” download and install R during the
  setup. If “false” use the existing installation in the GitHub Action
  image. Note that if it is “false”, you probably need to run
  `sudo apt-get update` yourself.
- **windows-path-include-rtools** (`true`) - Whether to add Rtools to
  the PATH.
- **windows-path-include-mingw** (`true`) - If “true” put the 64 bit
  mingw directory from Rtools on the PATH for Windows builds. This
  argument is now defunct on Rtools40 and later, which never add the
  mingw directory to the path.
- **update-rtools** (`false`) - Update rtools40 compilers and libraries
  to the latest builds.
- **use-public-rspm** (`false`) - Use the public version of Posit
  package manager available at <https://packagemanager.posit.co/> to
  serve binaries for Linux and Windows.
- **extra-repositories** (`''`) - One or more extra CRAN-like
  repositories to include in the `repos` global option

## Outputs

- **installed-r-version** - The full R version installed by the action

## Usage

Basic:

``` yaml
steps:
- uses: actions/checkout@v4
- uses: r-lib/actions/setup-r@v2
  with:
    r-version: '3.5.3' # The R version to download (if necessary) and use. 
    # Use "renv" to retrieve R version recorded in renv.lock file.
- run: Rscript -e 'print("hello")'
```

Matrix Testing:

``` yaml
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        R: [ '3.5.3', '3.6.1' ]
    name: R ${{ matrix.R }} sample
    steps:
      - uses: actions/checkout@v4
      - name: Setup R
        uses: r-lib/actions/setup-r@v2
        with:
          r-version: ${{ matrix.R }}
      - run: Rscript -e 'print("hello")'
```

## FAQ

### How do I use a custom R profile that sets an option?

You can add an extra step to your workflow, after R was installed, and
create the R profile. Here is an example:

``` yaml
      - name: Add some R options for later steps
        run: |
          cat("\noptions(tinytex.verbose = TRUE)\n", file = "~/.Rprofile", append = TRUE)
        shell: Rscript {0}
```

## License

The scripts and documentation in this project are released under the
[MIT License](LICENSE)

## Contributions

Contributions are welcome!
