# check-r-package

[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This action checks an R package using rcmdcheck. It is assumed that you have used the `setup-r-dependencies` action previously to install pak and setup the dependencies for your package being checked.

- Installing [rcmdcheck](https://cran.r-project.org/package=rcmdcheck).
- Checking the package using `rcmdcheck::rcmdcheck()`.
- Printing any testthat output on success or failure.
- Uploading an artifact of the full check files on failure.

# Usage

Inputs available

- `artifact-name` - default `check-results`. The name to use for the check artifact.

Basic:
```yaml
steps:
- uses: actions/checkout@master
- uses: r-lib/actions/setup-r@v1
- uses: r-lib/actions/setup-r-dependencies@v1
- uses: r-lib/actions/check-r-package@v1
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!
