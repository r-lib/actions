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

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!  See [Contributor's Guide](docs/contributors.md)
