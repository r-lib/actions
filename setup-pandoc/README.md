# setup-pandoc

[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This action sets up pandoc and pandoc-citeproc by:

- downloading and caching a released version of pandoc by version and adding it to the PATH

# Usage

See [action.yml](action.yml)

Basic:

```yaml
steps:
- uses: actions/checkout@v2
- uses: r-lib/actions/setup-pandoc@v2
  with:
    pandoc-version: '2.17.1' # The pandoc version to download (if necessary) and use.
- run: echo "# Test" | pandoc -t html
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE).

# Contributions

Contributions are welcome! See [Contributor's Guide](docs/contributors.md)
