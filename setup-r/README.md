# setup-r

This action sets up an R environment for use in actions by:

- downloading and caching a version of R by version and adding to PATH
- registering problem matchers for error output

# Usage

See [action.yml](action.yml)

Basic:
```yaml
steps:
- uses: actions/checkout@master
- uses: r-lib/actions/setup-r@v1
  with:
    r-version: '3.5.3' # The R version to download (if necessary) and use.
- run: Rscript -e 'print("hello")'
```

Matrix Testing:
```yaml
jobs:
  build:
    runs-on: ubuntu-18.04
    strategy:
      matrix:
        R: [ '3.5.3', '3.6.1' ]
    name: R ${{ matrix.R }} sample
    steps:
      - uses: actions/checkout@master
      - name: Setup R
        uses: actions/setup-R@v1
        with:
          r-version: ${{ matrix.R }}
      - run: Rscript -e 'print("hello")'
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!  See [Contributor's Guide](docs/contributors.md)
