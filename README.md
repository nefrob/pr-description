# Update Pull Request Description

GitHub action to append or replace text in a pull request description.

<a href="https://gitmoji.dev">
  <img
    src="https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg?style=flat-square"
    alt="Gitmoji"
  />
</a>

## Usage

This action supports `pull_request` and `push` events (where the `push` event ocurred on a branch with an open pull request).

### Inputs

-   `content`: The content to append or replace in the PR body. Can be raw text or a file path. If a file path is provided, `contentIsFilePath` must be set to `"true"`.
-   `contentIsFilePath`: Whether the `content` input is a file path. Defaults to `"false"`.
-   `regex`: The regex to match against the PR body and replace with `content`. Defaults to `"---.*"`.
-   `regexFlags`: The regex flags to use. Defaults to `""`.
-   `appendContentOnMatchOnly`: Whether to skip appending the `content` to the PR body if no `regex` matches are found. Defaults to `"false"`.
-   `token`: The GitHub token to use.

Note: append mode is the default behavior when no `regex` match is found for backwards compatibility with existing action users. This may change in future minor/major versions and will be noted in the [changelog](./CHANGELOG.md).

### Example Workflows

-   Simple replace all text in the PR description with `Hello there!`:

    ```yaml
    on:
        pull_request:

    jobs:
        update-pr-description:
            runs-on: ubuntu-latest
            steps:
                - name: Checkout
                  uses: actions/checkout@v4
                - name: Update PR Description
                  uses: nefrob/pr-description@v1.1.2
                  with:
                      content: "Hello there!"
                      regex: ".*"
                      regexFlags: s
                      token: ${{ secrets.GITHUB_TOKEN }}
    ```

    Body before:

    ```markdown
    Existing
    Body
    ```

    Body after:

    ```markdown
    Hello there!
    ```

-   Reading from a file:

    ```yaml
    on:
        pull_request:

    jobs:
        update-pr-description:
            runs-on: ubuntu-latest
            steps:
                - name: Checkout
                  uses: actions/checkout@v4
                - name: Update PR Description
                  uses: nefrob/pr-description@v1.1.2
                  with:
                      content: path/to/file.txt
                      contentIsFilePath: true
                      token: ${{ secrets.GITHUB_TOKEN }}
    ```

    File content:

    ```text
    Hello there!
    ```

    Body before:

    ```markdown
    Existing body
    ```

    Body after:

    ```markdown
    Hello there!
    ```

-   Replace text in between comments:

    ```yaml
    on:
        pull_request:

    jobs:
        update-pr-description:
            runs-on: ubuntu-latest
            steps:
                - name: Checkout
                  uses: actions/checkout@v3
                - name: Update PR Description
                  uses: nefrob/pr-description@v1.1.2
                  with:
                      content: "<!-- start match -->\nHello there!\n<!-- end match -->"
                      regex: "<!-- start match -->.*?<!-- end match -->"
                      regexFlags: ims
                      token: ${{ secrets.GITHUB_TOKEN }}
    ```

    Body before:

    ```text
    <!-- start match -->
    Anything in between these comments will be replaced by a push to the PR.
    <!-- end match -->
    ```

    Body after:

    ```text
    <!-- start match -->
    Hello there!
    <!-- end match -->
    ```

    This is particularly useful when paired with a `pull_request_template.md` that includes comments like these for automatic updates on every PR.
