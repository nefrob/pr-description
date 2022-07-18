
# Update Pull Request Description

GitHub action to add or update text in a pull request description.  
- Input content can be raw text or a file to read from.
- A regex is used to match and replace text in the PR description. If no matches are found or the description body is empty the content is appended to the bottom of the PR description.

### Quickstart

Sample workflow file:

```yaml
on:
  pull_request:

jobs:
  update-pr-description:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Do action
        uses: nefrob/pr-description@v0.1.2
        with:
          content: "Hello there!"
          regex: "matchuntilthenend.*"
          regexFlags: i
          token: ${{ secrets.GITHUB_TOKEN }}
```

or from a file:

```yaml
on:
  pull_request:

jobs:
  update-pr-description:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Do action
        uses: nefrob/pr-description@v0.1.2
        with:
          content: path/to/file.txt
          contentIsFilePath: true
          token: ${{ secrets.GITHUB_TOKEN }}
```

See an example of it in action [here](https://github.com/nefrob/pr-action-test/pull/1).

### References

- [Creating a JavaScript action](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action)
