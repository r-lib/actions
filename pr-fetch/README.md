# R `pr-fetch` Action

> Pull request fetching

This GitHub Action fetches and checks out the current head of a pull request,
it is intended to be used by actions which trigger based on comment creation.
It is often paired with the
[pr-push](https://github.com/r-lib/actions/tree/master/pr-push) action.

## Usage

Generally this is used to fetch the pr associated with a comment, you can
filter the comments using an if clause, so it is only run for specific things.
You need to include your token to the action in order for it to work, as it
needs to query the GitHub API for the pull request information.

```yaml
on:
  issue_comment:
    types: [created]

jobs:
  foo_command:
    if: startsWith(github.event.comment.body, '/foo')
    name: foo
    runs-on: macOS-latest
    steps:
      - uses: actions/checkout@v1
      - uses: r-lib/actions/pr-fetch@master
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```
