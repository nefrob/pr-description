
# Update Pull Request Description

GitHub action to add or update text in a pull request description.

- Input content can be raw text or a file to read from.
- A regex is used to match and replace text in the PR description. If no matches are found or the description body is empty the content is appended to the bottom of the PR description.

This action supports `pull_request` and `push` events (where the `push` event ocurred on a branch with an open pull request).

## Quickstart

- Sample workflow:

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
          uses: nefrob/pr-description@v1.1.0
          with:
            content: "Hello there!"
            regex: "matchuntilthenend.*"
            regexFlags: i
            token: ${{ secrets.GITHUB_TOKEN }}
  ```

- Alternatively reading content from a file:

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
          uses: nefrob/pr-description@v1.1.0
          with:
            content: path/to/file.txt
            contentIsFilePath: true
            token: ${{ secrets.GITHUB_TOKEN }}
  ```

- Using a pull request template with comments to match via regex can be very useful. For example in your `pull_request_template.md` add

  ```markdown
  <!-- start regex match -->
  Anything in between these comments will be replaced by a push to the PR.
  <!-- end regex match -->
  ```

  and in your workflow parameters

  ```yaml
  content: "<!-- start regex match -->I am new content!<!-- end regex match -->"
  regex: "<!-- start regex match -->.*?<!-- end regex match -->"
  regexFlags: ims
  ```

See an example of it in action [here](https://github.com/nefrob/pr-action-test/pull/1).

## References

- [Creating a JavaScript action](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action)
