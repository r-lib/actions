import * as core from "@actions/core";
import * as github from "@actions/github";
import * as exec from "@actions/exec";

async function run() {
  try {
    const token: string = core.getInput("repo-token", { required: true });

    const client = github.getOctokit(token);

    const context = github.context;

    const issue: { owner: string; repo: string; number: number } =
      context.issue;

    console.log(`Collecting information about PR #${issue.number}...`);

    const { status, data: pr } = await client.rest.pulls.get({
      owner: issue.owner,
      repo: issue.repo,
      pull_number: issue.number
    });

    const headBranch: string = pr.head.ref;
    const headCloneURL: string | undefined = pr.head.repo?.clone_url.replace(
      "https://",
      `https://x-access-token:${token}@`
    );
    const headRepoOwnerLogin: string | undefined = pr.head.repo?.owner.login;

    if (headCloneURL !== undefined && headRepoOwnerLogin !== undefined) {
      await exec.exec("git", ["remote", "add", "pr", headCloneURL]);
      await exec.exec("git", ["fetch", "pr", headBranch]);
      await exec.exec("git", [
        "checkout",
        "-b",
        `${headRepoOwnerLogin}-${headBranch}`,
        `pr/${headBranch}`
      ]);
    } else {
      throw new Error("Could not find repository, this should not happen");
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
