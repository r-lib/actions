# R `goodpractice` Action

[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

> Run goodpractice

This GitHub Action runs the
[goodpractice](https://github.com/MangoTheCat/goodpractice) package on a
repository and creates a new check result based on the output.

## Usage

You need to include your token to the action in order for it to work, as it
needs to query the GitHub API for the pull request information.

```yaml
on: pull_request

jobs:
  goodpractice:
    name: goodpractice
    runs-on: macOS-latest
    steps:
      - uses: actions/checkout@v1
      - uses: r-lib/actions/setup-r@master
      - name: Install dependencies
        run: Rscript -e "install.packages(c('remotes'))" -e "remotes::install_deps(dependencies = TRUE)"
      - uses: r-lib/actions/goodpractice@master
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```
