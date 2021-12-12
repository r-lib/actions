# setup-r-dependencies

[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This action install dependencies for the current R environment based on the DESCRIPTION file in the repository by:

- Installing [pak](https://pak.r-lib.org/)
- Setting up a dependency cache using [actions/cache](https://github.com/actions/cache).
- Installing system dependencies if needed using [rstudio/r-system-requirements](https://github.com/rstudio/r-system-requirements).
- Printing the installed session info using [sessioninfo](https://github.com/r-lib/sessioninfo).

# Usage

Inputs available

- `cache-version` - default `1`. If you need to invalidate the existing cache pass any other number and a new cache will be used.
- `extra-packages` - One or more extra package references to install. Separate each reference by newlines or commas for more than one package.
- `needs` - `Config/Needs` fields to install from the DESCRIPTION, the `Config/Needs/` prefix will be automatically included.
- `working-directory` - default `'.'`. If the DESCRIPTION file is not in the root directory of your repository.

Basic:
```yaml
steps:
- uses: actions/checkout@v2
- uses: r-lib/actions/setup-r@v2
- uses: r-lib/actions/setup-r-dependencies@v2
  with:
    cache-version: 2
    extra-packages: |<
      any::ggplot2
      any::rcmdcheck
    needs: |
      website
      coverage
```

## Extra packages and the `any::` prefix

In the example above the `any::` prefix for ggplot2 and rcmdcheck tells pak
to install these packages from CRAN, unless the local package or one of
its dependencies request it from somewhere else. E.g. if the checked package
required the development version of ggplot2 from
https://github.com/tidyverse/ggplot2 then pak will install it from there.

## Installing the local package

Sometimes you need to install the R package in the repository, e.g.
the `pkgdown.yaml` example workflow does this. You can specify the local
package as `local::.` to pak:

```yaml
steps:
- uses: actions/checkout@v2
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

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!
