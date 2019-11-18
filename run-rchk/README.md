# GitHub Action running rchk tests


[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This action runs [rchk](https://github.com/kalibera/rchk) tests to detect memory protection errors in C source code.

# Usage

See [action.yml](action.yml)

Basic:
```yml
  rchk:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v1
    - uses r-lib/actions/run-rchk@master
      with:
        apt: <any apt dependencies, optional>
        package: <R package name, optional>
```

Any `apt` dependencies could be installed by providing the `apt` argument. For example, `apt: libxml2-dev libssl-dev` etc.

The `package` is the optional package name. If left empty, it will be determined from the repo name.


# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!  See [Contributor's Guide](docs/contributors.md)
