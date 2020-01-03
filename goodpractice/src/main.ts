import * as core from "@actions/core";
import * as github from "@actions/github";
import * as exec from "@actions/exec";
import * as fs from "fs";

async function run() {
  try {
    const token: string = core.getInput("repo-token", { required: true });

    const octokit = new github.GitHub(token);

    const context = github.context;

    const check = await octokit.checks.create({
      ...context.repo,
      name: "goodpractice",
      head_sha: context.sha,
      status: "in_progress"
    });

    await exec.exec("Rscript", [
      "-e",
      "x <- goodpractice::goodpractice()",
      "-e",
      'capture.outupt(print(x), file = ".goodpractice")'
    ]);

    const results = fs.readFileSync(".goodpractice").toString();

    const finishedCheck = await octokit.checks.update({
      ...context.repo,
      check_run_id: check.data.id,
      name: check.data.name,
      output: {
        title: "goodpractice results",
        summary: results
      },
      status: "completed"
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
