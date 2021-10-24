# check-r-package

[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This action checks an R package using the [rcmdcheck](https://r-lib.github.io/rcmdcheck/) package.

# Usage

```yaml
steps:
- uses: actions/checkout@master
- uses: r-lib/actions/setup-r@v1
- uses: r-lib/actions/setup-r-dependencies@v1
  with:
    extra-packages: rcmdcheck
- uses: r-lib/actions/check-r-package@v1
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!
