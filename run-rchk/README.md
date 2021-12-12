# GitHub Action running rchk tests


[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This action runs [rchk](https://github.com/kalibera/rchk) tests to detect memory protection errors in C source code.

# Usage

See [action.yml](action.yml)

Basic:
```yml
  rchk:
    runs-on: ubuntu-latest
    container:
      image: rhub/ubuntu-rchk
      options: --user=root
    steps:
    - uses: actions/checkout@v1
    - uses: r-lib/actions/run-rchk@master
```

If you want to have more control
```yml
  rchk:
    runs-on: ubuntu-latest
    container:
      image: rhub/ubuntu-rchk
      options: --user=root
    steps:
    - uses: actions/checkout@v1
    - uses: r-lib/actions/run-rchk@master
      with:
        setup-only: true
    - uses: r-lib/actions/setup-r-dependencies@v2
      with:
        cache-version: rchk-1
    - uses: r-lib/actions/run-rchk@master
      with:
        run-only: true
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!  See [Contributor's Guide](docs/contributors.md)
