# setup-r-dependencies

[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This action install dependencies for the current R environment based on the DESCRIPTION file in the repository by:

- Installing [pak](https://pak.r-lib.org/)
- Setting up a dependency cache using [actions/cache](https://github.com/actions/cache).
- Installing system dependencies if needed using [rstudio/r-system-requirements](https://github.com/rstudio/r-system-requirements).
- Printing the installed session info using [sessioninfo](https://github.com/r-lib/sessioninfo).

# Usage

Inputs available

- `cache` - default `true`. Whether packages should be cached across runs or
  not. If `"always"` is provided, the package cache will be saved even if the
  workflow fails.
- `cache-version` - default `1`. If you need to invalidate the existing
  cache pass any other number and a new cache will be used. Ignored if
  `cache: false`. Note that you can also [delete caches
  manually](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows#deleting-cache-entries).
- `dependencies` - default `'"all"'`. Types of dependencies to install. By
  default all direct dependencies of the current package are installed, and
  hard dependencies of these direct dependencies.
  If you only want to install hard (required) dependecies, use
  `dependencies: '"hard"'`.
  See also the `needs` and `extra-packages` parameters. This parameter must
  be a valid R expression, and it is passed to the `dependencies` argument
  of `pak::lockfile_create().` Note that you often need to quote it, see
  details below.
- `extra-packages` - One or more extra package references to install.
  Separate each reference by newlines or commas for more than one package.
- `install-pandoc` - Whether to install pandoc. By default it is installed
  if it is not already on the PATH and the R package depends on rmarkdown.
- `install-quarto` - Whether to install quarto. If it is 'auto' (the
  default), it is installed if there is at least one `.qmd` file in the
  repository, inside `working-directory`. Set to 'true' to always install
  it. Set to 'false' to never install it.
- `needs` - `Config/Needs` fields to install from the DESCRIPTION, the
  `Config/Needs/` prefix will be automatically included.
- `lockfile-create-lib` - The package library to consider when creating
  the pak lockfile. This is passed to the `lib` argument of
  `pak::lockfile_create()`. Defaults to an empty library, for
  reproducibility. Must be an R expression. Note that it often needs
  to be quoted in YAML, see the README for details.
- `packages`: - default `deps::., any::sessioninfo`. Which package(s) to
  install. The default installs the dependencies of the package in the
  working directory and the sessioninfo package. Separate multiple packages
  by newlines or commas.
- `pak-version` - Which pak version to use. Possible values are
  `stable`, `rc` and `devel`. Defaults to `stable`.
- `pandoc-version` - Which pandoc version to install (see the
  `r-lib/actions/setup-pandoc` action), if pandoc is installed.
- `quarto-version` - Version of quarto to install, if quarto is installed.
  It is passed to the `quarto-dev/quarto-actions/setup@v2` action. The
  default is 'release' to install the latest release. Other possible values
  are a version number number (without the `v` prefix), and 'pre-release'.
- `upgrade` - Whether to install the latest available versions of the
  dependencies. Must be an R expression. See the README for details if
  you need quoting. Defaults to `FALSE`.
- `working-directory` - default `'.'`. If the DESCRIPTION file is not in the
  root directory of your repository.

Basic:
```yaml
steps:
- uses: actions/checkout@v4
- uses: r-lib/actions/setup-r@v2
- uses: r-lib/actions/setup-r-dependencies@v2
  with:
    cache-version: 2
    extra-packages: |
      any::ggplot2
      any::rcmdcheck
    needs: |
      website
      coverage
```

## Quoting R expressions

The `dependencies` parameter must be specified as an R expression.
This increases flexibility, but it also causes some inconvenience, since
these expressions often need to be quoted in the YAML file.
A handy tip is that if your R expression does not contain a single quote,
and you specify it in the YAML in a single line, surrounded by single
quotes, that will work.

## Supported R versions and operating systems

`setup-r-dependencies` uses static builds of [pak](https://pak.r-lib.org/)
to resolve, download and install the dependencies. There are typically
recent static pak builds available for:

- x86_64 Linux, for the last 5 R releases and R-devel (currently this is
  R 3.5.x through R 4.2.x and R-devel).
- x86_64 macOS, for the last 5 R releases and R-devel.
- Windows (x86_64 and i386), for the last 5 R releases and R-devel.

There are typically less recent builds for

- arm64 macOS, from R 4.2.x, but at most the last 5 R releases, and R devel.

See https://github.com/r-lib/pak#installation for the most accurate
information.

If your platform does not have a static pak build, e.g. you are on
s390x Linux, then you cannot use the `setup-r-dependencies` action currently.

## Dependencies on GitHub

If your package has a dependency that is not a CRAN or Bioconductor package,
but it lives on GitHub, or it can be downloaded from a URL, then you can
use the pak/pkgdepends syntax to specify it in the `Remotes` field of the
`DESCRIPTION` file. See the [documentation in the pkgdepends package](https://r-lib.github.io/pkgdepends/reference/pkg_refs.html#github-packages-).

## Dependencies in other CRAN-like repositories

If your dependency is available in a CRAN-like repository
(e.g. [R-universe](https://r-universe.dev/search/)), then you can use the
`extra-repositories` parameter of the `setup-r` action. See more at
the [`setup-r` documentation](https://github.com/r-lib/actions/tree/v2/setup-r#inputs).

## Extra packages and the `any::` prefix

In the example above the `any::` prefix for ggplot2 and rcmdcheck tells pak
to install these packages from CRAN, unless the local package or one of
its dependencies request it from somewhere else. E.g. if the checked package
required the development version of ggplot2 from
https://github.com/tidyverse/ggplot2 then pak will install it from there.

## Ignoring optional dependencies that need a newer R version

When you check a package on an earlier R version, it is not uncommon that
some optional (soft) dependencies of your package are not available on that
R version because they need a newer one.

You can use the `extra-packages` parameter and pak's `package=?ignore-before-r`
syntax to express this.

Here is an example. The butcher package depends on survival, which needs
R 3.5.0 now, and pak's dependency resolution fails on R 3.4.x:

```
Error: Cannot install packages:
* local::.: Can't install dependency survival
* survival: Needs R 3.5.0
```

To tell pak to ignore survival on R versions older than R 3.5.0, you can
write this in the butcher workflow file:

```yaml
steps:
- uses: actions/checkout@v4
- uses: r-lib/actions/setup-r@v2
- uses: r-lib/actions/setup-r-dependencies@v2
  with:
    extra-packages: any::rcmdcheck, survival=?ignore-before-r=3.5.0
    needs: check
```

Of course you'll also have to make sure that the test cases and examples
in butcher are prepared for survival not being available. For running
`R CMD check` you'll probably also need to set the `_R_CHECK_FORCE_SUGGESTS_`
environment variable to `false`, otherwise the check fails if suggested
packages are not available:

```yaml
- uses: r-lib/actions/check-r-package@v2
  env:
    _R_CHECK_FORCE_SUGGESTS_: false
```

## Ignoring optional dependencies

In special cases you may want to completely ignore an optional dependency.

For this, you can use the extra-packages parameter and pak's
`<packagename>=?ignore` syntax. (Replace `<packagename>` with the name of
the package you want to ignore.)

Example:

```yaml
- uses: r-lib/actions/setup-r-dependencies@v2
  with:
    extra-packages: any::rcmdcheck, survival=?ignore
    needs: check
```

## Installing the local package

Sometimes you need to install the R package in the repository, e.g.
the `pkgdown.yaml` example workflow does this. You can specify the local
package as `local::.` to pak:

```yaml
steps:
- uses: actions/checkout@v4
- uses: r-lib/actions/setup-r@v2
- uses: r-lib/actions/setup-r-dependencies@v2
  with:
    extra-packages: any::pkgdown, local::.
    needs: website
```

Other packages from the repository can be installed similarly, e.g.
to install an embedded test package you can write:

```yaml
...
- uses: r-lib/actions/setup-r-dependencies@v2
  with:
    extra-packages: any::pkgdown, local::., local::./tests/testthat/testpkg
...
```

## Installing specific versions of dependencies

If you want to run a workflow with specific versions of R package
dependencies, one good way to do that is adding these package versions
to `extra-packages`. If you regularly do this, you could modify your
workflow file to add an `extra-packages` input to `workflow_dispatch`:

```yaml
  workflow_dispatch:
    inputs:
      extra-packages:
        description: 'extra package to install for the runs (like a dev version of one of the deps) - comma separated'
        required: false
        type: string
```

```yaml
      - uses: r-lib/actions/setup-r-dependencies@v2
        with:
          extra-packages: >
            any::rcmdcheck,
            ${{ github.event.inputs.extra-packages }}
          needs: check
```

(Cf. https://github.com/r-lib/actions/issues/958#issue-2775898508.)

## System dependencies

pak automatically install the system dependencies of all installed R
packages on the following Linux Distributions:

* CentOS,
* OpenSUSE,
* RedHat,
* SLE and
* Ubuntu.

System dependencies are **not** installed on other operating systems and
other Linux distributions currently, and you need to install them manually,
_before_ using the `r-lib/setup-r-dependencies` action.

Also note that the system depedencies of Bioconductor packages are typically
not installed automatically, so you might need to do this, even on the
supported Linux distributions.

On Ubuntu Linux you can use `apt-get` to install system depedencies:

```yaml
      - name: Install libcurl on Linux
        if: runner.os == 'Linux'
        run: sudo apt-get update -y && sudo apt-get install -y libcurl4-openssl-dev
```

On macOS you can usually use `brew`, here is an example step in a workflow:

```yaml
      - name: Install macOS system dependencies
        if: runner.os == 'macOS'
        run: |
          brew install imagemagick@6
          brew install libgit2
```

On Windows you can usually use `pacman` that is included in Rtools4, or
`choco` to install external software:

```yaml
      - name: Install most Windows system dependencies
        if: runner.os == 'Windows'
        run: |
          pacman -Syu mingw-w64-x86_64-make --noconfirm
```

```yaml
      - name: Install databases (windows)
        if: runner.os == 'Windows'
        shell: bash
        run: |
          choco install mariadb
```

# Installing the latest dependencies

Note that `setup-r-dependencies` does _not_ necessarily install the latest
versions of the dependent R packages. Typically, if there is a binary build
of an older package version available, and that satisfies all version
requirements, then it will be preferred over a later source R package.

This makes the jobs more robust, because installing source packages fails
more often, especially on platforms without automatic system dependency
installation (e.g. Windows and macOS).

If your package does need a later version of a dependency, then you need
to explicitly require a newer version in the `DESCRIPTION` file.
Alternatively, if you only want to run the CI jobs with a later version,
without a formal version requirement, then add the package to the
`extra-packages` parameter. `setup-r-dependencies` installs the latest versions
of these packages.

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!
