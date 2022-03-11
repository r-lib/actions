# check-r-package

[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This action checks an R package using the [rcmdcheck](https://r-lib.github.io/rcmdcheck/) package.

# Usage

Inputs available:
- args - default `c("--no-manual", "--as-cran")`. Arguments to pass to the
  `args` parameter of `rcmdcheck`. It must be an R expression in single
  quotes.
- build_args - default `"--no-manual"`. Arguments to pass to the `build_args`
  parameter of `rcmdcheck`. it must be an R expression in single quotes.
- check-dir - default `"check"`. Arguments to pass to the `check-dir` 
  parameter of `rcmdcheck`. It must be an R expression in single quotes.
- error-on - default `"warning"`. Arguments to pass to the `error-on`
  parameter of `rcmdcheck`. It must be an R expression in single quotes.
- upload-snapshots - default `false`. Whether to upload all testthat
  snapshots as an artifact.
- upload-results - default `false`. Whether to upload check results for
  successful runs too.
- working-directory - default `"."`. If the R package to check is not in
  the root directory of your repository.

Basic: 
```yaml
steps:
- uses: actions/checkout@v2
- uses: r-lib/actions/setup-r@v2
- uses: r-lib/actions/setup-r-dependencies@v2
  with:
    extra-packages: rcmdcheck
- uses: r-lib/actions/check-r-package@v2
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!
