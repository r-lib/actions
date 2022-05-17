# setup-tinytex

[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This action sets up [TinyTeX](https://yihui.name/tinytex/) by:

- downloading TinyTeX and adding it to the PATH

# Usage

See [action.yml](action.yml)

Basic:
```yaml
steps:
- uses: actions/checkout@v2
- uses: r-lib/actions/setup-tinytex@v2
- run: tlmgr --version
```

If you want to select the CTAN mirror you can set the `CTAN_REPO` tinytex environment variable.

## CTAN packages

The tinytex R package (which is not the same as the TinyTeX TeX distribution) supports automatic CTAN package installation when using the rmarkdown package.
If you are using TinyTeX without rmarkdown (including using it without R!), then you will need to install CTAN packages manually.
For example this is the case if your R package builds its PDF reference manual at `R CMD build` or while being checked.

To install CTAN packages manually, you can call `tlmgr` from your workflow, here is a complete example:
```yaml
steps:
  - uses: actions/checkout@v2
  - uses: r-lib/actions/setup-tinytex@v2
  - run: tlmgr --version

  - name: Install additional LaTeX packages
    run: |
      tlmgr install titlesec
      tlmgr list --only-installed
```

## TinyTeX bundled release

TinyTeX is available as several bundles from https://github.com/rstudio/tinytex-releases/. 

By default, the action will install the same bundle as
`tinytex::install_tinytex()` which is the daily build of _TinyTeX-1_ bundle.
This bundles contains the TinyTeX distribution and a set of CTAN packages. The
_TinyTeX_ bundles comes with more CTAN packages bundled.

To change the bundle to install you can change the environment variable
`TINYTEX_INSTALLER`

````yaml
      - uses: r-lib/actions/setup-tinytex@v2
        env:
          # install full prebuilt version
          TINYTEX_INSTALLER: TinyTeX
````

In addition to the daily commonly used, TinyTeX is also built in monthly
releases. You can find all the releases in
https://github.com/rstudio/tinytex-releases/releases

To install a specific version, you can set the `TINYTEX_VERSION` environment variable

````yaml
      - uses: r-lib/actions/setup-tinytex@v2
        env:
          # always install the bundled version from Nov. 2021
          TINYTEX_VERSION: 2021.11
````

See more on those bundles in [`rstudio/tinytex-releases`
README](https://github.com/rstudio/tinytex-releases#releases), especially the list
of bundled CTAN packages.

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!  See [Contributor's Guide](docs/contributors.md)
