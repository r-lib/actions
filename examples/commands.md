# Commands workflow

This workflow enables the use of 2 R specific commands in pull request issue
comments. `\document` will use [roxygen2](https://roxygen2.r-lib.org/) to
rebuild the documentation for the package and commit the result to the pull
request. `\style` will use [styler](https://styler.r-lib.org/) to restyle your
package.

## When it can they be used?

1. You get frequent Pull Requests, often with documentation only fixes.
2. You regularly style your code with styler, and require all additions be
   styled as well.

```yaml
on:
  issue_comment:
    types: [created]
name: Commands
jobs:
  document:
    if: startsWith(github.event.comment.body, '/document')
    name: document
    runs-on: macOS-latest
    steps:
      - uses: actions/checkout@v1
      - uses: r-lib/actions/pr-fetch@master
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
      - uses: r-lib/actions/setup-r@master
      - name: Install dependencies
        run: Rscript -e 'install.packages(c("remotes", "roxygen2"))' -e 'remotes::install_deps(dependencies = TRUE)'
      - name: Document
        run: Rscript -e 'roxygen2::roxygenise()'
      - name: commit
        run: |
          git add man/\* NAMESPACE
          git commit -m 'Document' --author 'GitHub Actions <actions@github.com>'
      - uses: r-lib/actions/pr-push@master
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
  style:
    if: startsWith(github.event.comment.body, '/style')
    name: document
    runs-on: macOS-latest
    steps:
      - uses: actions/checkout@master
      - uses: r-lib/actions/pr-fetch@master
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
      - uses: r-lib/actions/setup-r@master
      - name: Install dependencies
        run: Rscript -e 'install.packages("styler")'
      - name: style
        run: Rscript -e 'styler::style_pkg()'
      - name: commit
        run: |
          git add \*.R
          git commit -m 'style' --author 'GitHub Actions <actions@github.com>'
      - uses: r-lib/actions/pr-push@master
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```

## Can I tune it?

Sure!

This workflow is using following Actions to execute the pipeline,
see their pages for the available options:

1. [`r-lib/actions/setup-r`](https://github.com/r-lib/actions/setup-r)
2. [`r-lib/actions/pr-fetch`](https://github.com/r-lib/actions/pr-fetch)
3. [`r-lib/actions/pr-push`](https://github.com/r-lib/actions/pr-push)

You can also use this same formula to do other things in between fetching and
pushing.
