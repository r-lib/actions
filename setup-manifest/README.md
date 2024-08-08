# setup-manifest

[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This action sets up a project based on a
[Posit Connect `manifest.json` file](https://docs.posit.co/connect/user/publishing-cli-manifest/).

# Usage

```
name: setup.yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: r-lib/actions/setup-manifest@feature/setup-manifest
```

# How it works

This action only works on Linux.

It uses a Docker container to install and run renv to convert the
`manifest.json` file to an `renv.lock` file.

Then it uses [`r-lib/actions/setup-r`](https://github.com/r-lib/actions/tree/v2-branch/setup-r)
to install the required version of R.

Finally, it uses [`r-lib/actions/setup-renv`](https://github.com/r-lib/actions/tree/v2-branch/setup-renv)
to install required version of the dependent packages.

# Known issues

This action does not install system dependencies currently. If your
project needs Linux system packages, you'll need to install them before
calling this action.

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!
