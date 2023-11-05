# Contributing

This page lists the steps needed to set up a development environment and contribute to the project.

1. Fork and clone this repo.

2. Setup `nodejs`. We recommend using [asdf](https://asdf-vm.com/guide/getting-started.html).

3. Install dependencies.

    ```shell
    yarn install
    ```

4. Run tests:

    ```shell
    yarn test
    ```

5. Rebuild `dist` files after making changes to `index.js`:

    ```shell
    yarn rebuild
    ```

6. Lint files:

    ```shell
    yarn lint
    ```
