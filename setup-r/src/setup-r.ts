import * as core from "@actions/core";
import { getR } from "./installer";
import * as path from "path";

async function run() {
  try {
    core.debug(`started action`);
    console.log("::warning title=r-lib/action/check-r-packages@v1 is deprecated::Please update your workflow to use the '@v2' version. Also look at the examples at https://github.com/r-lib/actions/tree/v2/examples because '@v2' workflows are much simpler than '@v1' workflows.");
    let version = core.getInput("r-version");
    core.debug(`got version ${version}`);

    await getR(version);

    const matchersPath = path.join(__dirname, "..", ".github");
    console.log(`##[add-matcher]${path.join(matchersPath, "rcmdcheck.json")}`);
    console.log(`##[add-matcher]${path.join(matchersPath, "testthat.json")}`);
    console.log(`##[add-matcher]${path.join(matchersPath, "r.json")}`);
  } catch (error) {
    core.setFailed(error);
  }
}

run();
