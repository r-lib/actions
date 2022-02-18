let tempDirectory = process.env["RUNNER_TEMP"] || "";

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import * as path from "path";
import * as fs from "fs";

const IS_WINDOWS = process.platform === "win32";
const IS_MAC = process.platform === "darwin";
const IS_LINUX = !(IS_WINDOWS || IS_MAC);

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
    await getTinyTeX();
  } catch (error) {
    core.setFailed(error.message);
    process.exit(1);
  }
}

export async function getTinyTeX() {
  if (IS_WINDOWS) {
    await installTinyTeXWindows();
  } else {
    await installTinyTeXPosix();
  }
}

async function installTinyTeXPosix() {
  // We need to install texinfo for texi2dvi, but only on linux
  if (IS_LINUX) {
    try {
      await exec.exec("sudo apt-get", ["install", "-y", "texinfo"]);
    } catch (error) {
      throw `Failed to install texinfo package: ${error}`;
    }
  }

  const fileName = "install-unx.sh";
  const downloadUrl = "https://yihui.name/gh/tinytex/tools/install-bin-unix.sh";
  let downloadPath: string | null = null;

  try {
    downloadPath = await tc.downloadTool(downloadUrl);
  } catch (error) {
    throw `Failed to download TinyTeX: ${error}`;
  }

  try {
    await io.mv(downloadPath, path.join(tempDirectory, fileName));
    await exec.exec("sh", [path.join(tempDirectory, fileName)]);
  } catch (error) {
    throw `Failed to install TinyTeX: ${error}`;
  }

  let binPath: string;

  // The binaries are in TinyTeX/bin/*/, where the wildcard is the
  // architecture, but we should always take the first one.
  if (IS_MAC) {
    binPath = path.join(process.env["HOME"] || "/", "Library/TinyTeX/bin");
  } else {
    binPath = path.join(process.env["HOME"] || "/", ".TinyTeX/bin");
  }

  const arch = fs.readdirSync(binPath)[0];

  core.addPath(path.join(binPath, arch));
}

async function installTinyTeXWindows() {
  const fileName = "install-windows.bat";
  const downloadUrl =
    "https://yihui.name/gh/tinytex/tools/install-bin-windows.bat";
  let downloadPath: string | null = null;

  try {
    downloadPath = await tc.downloadTool(downloadUrl);
  } catch (error) {
    throw `Failed to download TinyTeX: ${error}`;
  }

  await io.mv(downloadPath, path.join(tempDirectory, fileName));

  const fs = require("fs");
  console.log(path.join(tempDirectory, fileName));
  var text = fs.readFileSync(path.join(tempDirectory, fileName), "utf8");
  var textWithoutLastLine = text
    .split("\n")
    .slice(0, -2)
    .join("\n");
  fs.writeFile(
    path.join(tempDirectory, fileName),
    textWithoutLastLine,
    function(err, result) {
      if (err) console.log("error", err);
    }
  );

  try {
    exec.exec(path.join(tempDirectory, fileName));
  } catch (error) {
    throw `Failed to install TinyTeX: ${error}`;
  }

  core.addPath(
    path.join(process.env["APPDATA"] || "C:\\", "TinyTeX", "bin", "win32")
  );
}

run();
