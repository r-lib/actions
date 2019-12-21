# setup-pandoc

[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This action sets up pandoc by:

- downloading and caching a version of pandoc by version and adding to PATH

# Usage

See [action.yml](action.yml)

Basic:
```yaml
steps:
- uses: actions/checkout@master
- uses: r-lib/actions/setup-pandoc@v1
  with:
    pandoc-version: '2.7.3' # The pandoc version to download (if necessary) and use.
- run: echo "# Test" | pandoc -t html
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!  See [Contributor's Guide](docs/contributors.md)
