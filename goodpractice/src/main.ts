import * as core from "@actions/core";
import * as github from "@actions/github";
import * as exec from "@actions/exec";
import * as fs from "fs";

async function run() {
  try {
    const token: string = core.getInput("repo-token", { required: true });

    const octokit = new github.GitHub(token);

    const context = github.context;

    await exec.exec("Rscript", [
      "-e",
      "x <- goodpractice::goodpractice()",
      "-e",
      'capture.output(print(x), file = ".goodpractice")'
    ]);

    const results = fs.readFileSync(".goodpractice").toString();

    const check = await octokit.issues.createComment({
      ...context.repo,
      issue_number: context.issue.number,
      body: results
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
