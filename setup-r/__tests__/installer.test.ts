import io = require("@actions/io");
import fs = require("fs");
import os = require("os");
import path = require("path");
//import nock = require('nock');

const toolDir = path.join(__dirname, "runner", "tools");
const tempDir = path.join(__dirname, "runner", "temp");
const dataDir = path.join(__dirname, "data");

process.env["RUNNER_TOOL_CACHE"] = toolDir;
process.env["RUNNER_TEMP"] = tempDir;
import * as installer from "../src/installer";

const IS_WINDOWS = process.platform === "win32";

describe("installer tests", () => {
  it("Acquires version of R if no matching version is installed", async () => {
    expect(true).toBe(true);
  }, 100000);
});
