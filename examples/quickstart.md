# Quickstart CI workflow

This workflow installs latest stable R version
and runs R CMD check via the [rcmdcheck](https://github.com/r-lib/rcmdcheck)
package.

## When it can be used?

1. You have a simple R package
2. There is no OS-specific code
4. You want a quick start with R CI

```yaml
on: [push, pull_request]

name: Continuous integration

jobs:
  check:
    name: Check
    runs-on: macOS-latest
    steps:
      - name: Install dependencies
        run: Rscript -e 'install.packages("remotes")' -e 'remotes::install_deps(dependencies = TRUE)'
      - name: Check
        run: Rscript -e 'install.packages("rcmdcheck")' -e 'rcmdcheck::rcmdcheck(args = c("--no-manual", "--as-cran"))'
```

## Can I tune it?

Sure!

This workflow is using following Actions to execute the pipeline,
see their pages for the available options:

1. [`r-lib/actions/setup-r`](https://github.com/r-lib/actions/setup-r)
