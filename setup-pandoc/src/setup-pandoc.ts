let tempDirectory = process.env["RUNNER_TEMP"] || "";

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import * as path from "path";
import * as util from "util";
import * as fs from "fs";

const IS_WINDOWS = process.platform === "win32";
const IS_MAC = process.platform === "darwin";

if (!tempDirectory) {
  let baseLocation;
  if (IS_WINDOWS) {
    // On windows use the USERPROFILE env variable
    baseLocation = process.env["USERPROFILE"] || "C:\\";
  } else {
    if (IS_MAC) {
      baseLocation = "/Users";
    } else {
      baseLocation = "/home";
    }
  }
  tempDirectory = path.join(baseLocation, "actions", "temp");
}

async function run() {
  try {
    let pandocVersion = core.getInput("pandoc-version");
    core.debug(`got pandoc-version ${pandocVersion}`);
    await getPandoc(pandocVersion);
  } catch (error) {
    core.setFailed(error.message);
  }
}

export async function getPandoc(version: string) {
  if (IS_WINDOWS) {
    installPandocWindows(version);
  } else if (IS_MAC) {
    installPandocMac(version);
  } else {
    installPandocLinux(version);
  }
}

async function installPandocMac(version: string) {
  const fileName = util.format("pandoc-%s-macOS.pkg", version);
  const downloadUrl = util.format(
    "https://github.com/jgm/pandoc/releases/download/%s/%s",
    version,
    fileName
  );
  let downloadPath: string | null = null;


  try {
    downloadPath = await tc.downloadTool(downloadUrl);
  } catch (error) {
    throw `Failed to download Pandoc ${version}: ${error}`;
  }

  await io.mv(downloadPath, path.join(tempDirectory, fileName));

  exec.exec("sudo installer", [
    "-pkg",
    path.join(tempDirectory, fileName),
    "-target",
    "/"
  ]);
}

async function installPandocWindows(version: string) {
  const fileName = util.format("pandoc-%s-windows-x86_64.zip", version);
  const downloadUrl = util.format(
    "https://github.com/jgm/pandoc/releases/download/%s/%s",
    version,
    fileName
  );
  let downloadPath: string | null = null;

  try {
    downloadPath = await tc.downloadTool(downloadUrl);
  } catch (error) {
    throw `Failed to download Pandoc ${version}: ${error}`;
  }

  //
  // Extract
  //
  let extPath: string = tempDirectory;
  if (!extPath) {
    throw new Error("Temp directory not set");
  }

  extPath = await tc.extractZip(downloadPath);

  const toolPath = await tc.cacheDir(extPath, "pandoc", version);

  // It extracts to this folder
  const toolRoot = path.join(
    toolPath,
    util.format("pandoc-%s-windows-x86_64", version)
  );

  core.addPath(toolRoot);
}

async function installPandocLinux(version: string) {
  const fileName = util.format("pandoc-%s-1-amd64.deb", version);
  const downloadUrl = util.format(
    "https://github.com/jgm/pandoc/releases/download/%s/%s",
    version,
    fileName
  );
  let downloadPath: string | null = null;

  try {
    downloadPath = await tc.downloadTool(downloadUrl);
  } catch (error) {
    throw `Failed to download Pandoc ${version}: ${error}`;
  }

  await io.mv(downloadPath, path.join(tempDirectory, fileName));

  try {
    await exec.exec("sudo apt-get", ["install", "-y", "gdebi-core"]);
    await exec.exec("sudo gdebi", [
      "--non-interactive",
      path.join(tempDirectory, fileName)
    ]);
  } catch (error) {
    core.debug(error);

    throw `Failed to install pandoc: ${error}`;
  }
}

run();
