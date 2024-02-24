# setup-pandoc

[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This action sets up pandoc: it downloads the specified version and adds it
to the PATH.

Supported platforms:

- Windows x86_64,
- macOS x86_64 and arm64,
- Linux x86_53 and aarch64.

Inputs:

| Name              | Type     | Default            | Description
|-------------------|----------|--------------------|-------------------------------------------------------------------------------------------------
| `pandoc-version`  | String   | `3.1.11`           | pandoc version to install. Can be `latest` or `nightly`. See notes about nigthly versions below.
| `token`           | String   |                    | GitHub token. Needed when `pandoc-version` is `nigthly`.

Nightly builds are installed from
https://github.com/jgm/pandoc/actions/workflows/nightly.yml.

For nightly builds you also need to specify `token`. pandoc does
not currently have nightly builds for arm64 machines, so using
`nigthly` will error on these.

# Usage

```yaml
steps:
- uses: actions/checkout@v4
- uses: r-lib/actions/setup-pandoc@v2
  with:
    pandoc-version: '3.1.11' # The pandoc version to download (if necessary) and use.
- run: echo "# Test" | pandoc -t html
```

# License

The scripts and documentation in this project are released under the
[MIT License](LICENSE).

# Contributions

Contributions are welcome! See [Contributor's Guide](docs/contributors.md)
