# setup-renv

[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This action installs dependencies for the current R environment based on the renv lockfile in the repository by:

- Installing [renv](https://rstudio.github.io/renv/articles/renv.html)
- Setting up a dependency cache using [actions/cache](https://github.com/actions/cache).

# Usage

Inputs available

- `cache-version` - default `1`. If you need to invalidate the existing cache pass any other number and a new cache will be used.

Basic:
```yaml
steps:
- uses: actions/checkout@v2
- uses: r-lib/actions/setup-r@v2
- uses: r-lib/actions/setup-renv@v2
  with:
    cache-version: 2
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!
