const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");

async function run() {
    const content = core.getInput("content", { required: true });
    const contentIsFilePath = core.getInput("contentIsFilePath");
    const regex = core.getInput("regex") || "---.*";
    const regexFlags = core.getInput("regexFlags") || "";
    const token = core.getInput("token", { required: true });

    const { owner, repo } = github.context.repo;
    const octokit = github.getOctokit(token);

    let prNumber = github.context.payload.pull_request?.number;
    if (!prNumber) {
        // not a pull_request event, try and find the PR number from the commit sha
        const { data: pullRequests } =
            await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
                owner,
                repo,
                commit_sha: github.context.sha,
            });

        const candidatePullRequests = pullRequests.filter(
            (pr) =>
                github.context.payload.ref === `refs/heads/${pr.head.ref}` &&
                pr.state === "open"
        );

        prNumber = candidatePullRequests?.[0]?.number;
    }

    if (!prNumber) {
        core.setFailed(
            `No open pull request found for ${github.context.eventName}, ${github.context.sha}`
        );
        return;
    }

    const { data } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
    });

    body = data.body;

    let output = content;
    if (contentIsFilePath && contentIsFilePath === "true") {
        output = fs.readFileSync(content).toString("utf-8");
    }

    const re = RegExp(regex, regexFlags);
    if (body && body.match(re)) {
        body = body.replace(re, output);
    } else if (body) {
        body += output;
    } else {
        body = output;
    }

    await octokit.rest.pulls.update({
        owner,
        repo,
        body: body,
        pull_number: prNumber,
    });
}

run().catch((error) => core.setFailed(error.message));
