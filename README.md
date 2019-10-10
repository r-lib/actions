# GitHub Actions for the R language

![CC0 licensed](https://img.shields.io/github/license/r-lib/actions)
[![RStudio community](https://img.shields.io/badge/community-github--actions-blue?style=social&logo=rstudio&logoColor=75AADB)](https://community.rstudio.com/new-topic?category=Package%20development&tags=github-actions)

This repository stores [GitHub Actions](https://github.com/features/actions), which can be used to do a variety of CI and CD tasks for R projects.

## Examples

See the [@r-lib/actions/examples](https://github.com/r-lib/actions/tree/master/examples) directory
for a variety of example workflows.

### [Quickstart](https://github.com/r-lib/actions/blob/master/examples/quickstart.md)

A minimal CI suite for an R project.

### [tidyverse](https://github.com/r-lib/actions/blob/master/examples/tidyverse.md)

A complex CI suite testing on macOS, linux and Windows across 5 minor R
versions, used by the tidyverse team to ensure their packages work on most
users' systems.

### [commands](https://github.com/r-lib/actions/blob/master/examples/tidyverse.md)

A workflow which sets up a `/document` and `/style` commands for Pull Request
comments, to automatically document and style the code and commit the changes.

## License

All examples in this repository are published with the [CC0](./LICENSE) license.
