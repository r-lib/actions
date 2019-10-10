import * as core from "@actions/core";
import * as github from "@actions/github";
import * as exec from "@actions/exec";

async function run() {
  try {
    const token: string = core.getInput("repo-token", { required: true });

    const client: github.GitHub = new github.GitHub(token);

    const context = github.context;

    const issue: { owner: string; repo: string; number: number } =
      context.issue;

    console.log(`Collecting information about PR #${issue.number}...`);

    const { status, data: pr } = await client.pulls.get({
      owner: issue.owner,
      repo: issue.repo,
      pull_number: issue.number
    });

    const headBranch: string = pr.head.ref;
    const headCloneURL: string = pr.head.repo.clone_url;

    const headCloneURL2: string = headCloneURL.replace(
      "https://",
      `https://x-access-token:${token}@`
    );

    await exec.exec("git", ["push", headCloneURL2, `HEAD:${headBranch}`]);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
