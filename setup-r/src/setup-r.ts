import * as core from "@actions/core";
import { getR } from "./installer";
import * as path from "path";

async function run() {
  try {
    core.debug(`started action`);
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
