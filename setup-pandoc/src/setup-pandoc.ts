let tempDirectory = process.env["RUNNER_TEMP"] || "";

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import * as path from "path";
import * as util from "util";
import * as fs from "fs";
import { compare } from 'compare-versions';

const IS_WINDOWS = process.platform === "win32";
const IS_MAC = process.platform === "darwin";
const OS = !!process.env.SETUP_R_OS ? process.env.SETUP_R_OS :
    IS_WINDOWS ? "win" : IS_MAC ? "mac" : "linux";
const ARCH = !!process.env.SETUP_R_ARCH ? process.env.SETUP_R_ARCH :
    OS == "win" ? undefined :
    (OS == "mac" && process.arch == "arm64") ? "arm64" :
    (OS == "mac" && process.arch == "x64") ? "x86_64" :
    process.arch == "x64" ? "amd64" : process.arch;

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
  } catch (error: any) {
    core.setFailed(error?.message ?? error ?? "Unknown error");
  }
}

export function getPandoc(version: string): Promise<void> {
  if (IS_WINDOWS) {
    return installPandocWindows(version);
  } else if (IS_MAC) {
    return installPandocMac(version);
  } else {
    return installPandocLinux(version);
  }
}

async function installPandocMac(version: string): Promise<void> {
  // Since 3.1.2, Pandoc uses cabal instead of stack to build the macOS binary.
  const is_new_macos_installer = compare(version, "3.1.2", ">=") ? true : false;
  const fileName = is_new_macos_installer ?
    util.format("pandoc-%s-%s-macOS.pkg", version, ARCH) :
    util.format("pandoc-%s-macOS.pkg", version);

  const downloadUrl = util.format(
    "https://github.com/jgm/pandoc/releases/download/%s/%s",
    version,
    fileName
  );

  let downloadPath: string;
  try {
    downloadPath = await tc.downloadTool(downloadUrl);
  } catch (error: any) {
    throw new Error(`Failed to download Pandoc ${version}: ${error?.message ?? error}`);
  }

  await io.mv(downloadPath, path.join(tempDirectory, fileName));

  exec.exec("sudo installer", [
    "-allowUntrusted",
    "-dumplog",
    "-pkg",
    path.join(tempDirectory, fileName),
    "-target",
    "/"
  ]);
}

async function installPandocWindows(version: string): Promise<void> {
  const fileName = util.format("pandoc-%s-windows-x86_64.zip", version);
  const downloadUrl = util.format(
    "https://github.com/jgm/pandoc/releases/download/%s/%s",
    version,
    fileName
  );

  let downloadPath: string;
  try {
    downloadPath = await tc.downloadTool(downloadUrl);
  } catch (error: any) {
    throw new Error(`Failed to download Pandoc ${version}: ${error?.message ?? error}`);
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
  const toolRoot = path.join(toolPath, pandocSubdir(version));

  core.addPath(toolRoot);
}

function pandocSubdir(version: string) {
  if (compare(version, "2.9.2", ">=")) {
    return util.format("pandoc-%s", version);
  }

  if (compare(version, "2.9.1", "=")) {
    return "";
  }

  return util.format("pandoc-%s-windows-x86_64", version);
}

async function installPandocLinux(version: string): Promise<void> {
  const fileName = util.format("pandoc-%s-linux-%s.tar.gz", version, ARCH);
  const downloadUrl = util.format(
    "https://github.com/jgm/pandoc/releases/download/%s/%s",
    version,
    fileName
  );

  let downloadPath: string;
  try {
    console.log("::group::Download pandoc");
    downloadPath = await tc.downloadTool(downloadUrl);
  } catch (error) {
    throw new Error(`Failed to download Pandoc ${version}: ${error}`);
  }

  try {
    const extractionPath = await tc.extractTar(downloadPath);
    const binDirPath = path.join(extractionPath, `pandoc-${version}/bin`);
    const cachedBinDirPath = await tc.cacheDir(binDirPath, "pandoc", version);
    core.addPath(cachedBinDirPath);
  } catch(error: any) {
    throw new Error(`Failed to install pandoc: ${error?.message ?? error}`);
  }
}

run();
