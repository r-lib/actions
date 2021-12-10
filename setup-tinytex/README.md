# setup-tinytex

[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This action sets up [TinyTeX](https://yihui.name/tinytex/) by:

- downloading TinyTeX and adding it to the PATH

# Usage

See [action.yml](action.yml)

Basic:
```yaml
steps:
- uses: actions/checkout@master
- uses: r-lib/actions/setup-tinytex@v1
- run: tlmgr --version
```

If you want to select the CTAN mirror you can set the `CTAN_REPO` tinytex environment variable.

## CTAN packages

For your workflow you might need to install CTAN packages manually.
The tinytex R package (which is not the same as the TinyTeX TeX distribution) supports automatic CTAN package installation when using the rmarkdown package.
In other words for automatic CTAN package installation you need:
* The tinytex R package.
* PDF building via the rmarkdown R package.

In particular, for building the PDF manual of R packages, R does not use rmarkdown, and there is no automatic CRAN package installation.

To install CRAN packages manually, you can call `tlmgr` from your workflow, here is an example:
```yaml
steps:
  - uses: actions/checkout@v2
  - uses: r-lib/actions/setup-tinytex@v1
  - run: tlmgr --version

  - name: Install additional LaTeX packages
    run: |
      tlmgr install titlesec
      tlmgr list --only-installed
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!  See [Contributor's Guide](docs/contributors.md)
