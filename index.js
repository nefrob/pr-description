const core = require('@actions/core');
const github = require('@actions/github');
const fs = require("fs");

async function run() {
  const content = core.getInput('content', { required: true });
  const contentIsFilePath = core.getInput('contentIsFilePath');
  const regex = core.getInput('regex') || /---.*/s;
  const token = core.getInput('token', { required: true });

  const [repoOwner, repoName] = process.env.GITHUB_REPOSITORY.split('/');
  const prNumber = github.context.payload.pull_request.number;

  const octokit = github.getOctokit(token);

  const { data } = await octokit.rest.pulls.get({
    owner: repoOwner,
    repo: repoName,
    pull_number: prNumber,
  });

  body = data.body;

  let output = content;
  if (contentIsFilePath && contentIsFilePath === "true") {
    output = fs.readFileSync(content).toString('utf-8');
  }

  if (body && body.match(regex)) {
    body = body.replace(regex, '---\n' + output);
  } else if (body) {
    body += '\n---\n' + output;
  } else {
    body = '---\n' + output;
  }

  await octokit.rest.pulls.update({
    owner: repoOwner,
    repo: repoName,
    body: body,
    pull_number: prNumber,
  });
}

run();
