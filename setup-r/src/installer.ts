let tempDirectory = process.env["RUNNER_TEMP"] || "";

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";
import * as io from "@actions/io";
import * as util from "util";
import * as path from "path";
import { promises as fs } from "fs";
import * as restm from "typed-rest-client/RestClient";
import * as semver from "semver";
import osInfo from "linux-os-info";

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

export async function getR(version: string, rtoolsVersion: string) {
  const selected = await determineVersion(version);
  if (selected) {
    version = selected;
  }

  let toolPath = tc.find("R", version);

  if (toolPath) {
    core.debug(`Tool found in cache ${toolPath}`);
  } else {
    try {
      await acquireR(version, rtoolsVersion);
    } catch (error) {
      core.debug(error);

      throw `Failed to get R ${version}: ${error}`;
    }
  }

  setREnvironmentVariables();
  setupRLibrary();
}

async function acquireR(version: string, rtoolsVersion: string) {
  try {
    if (IS_WINDOWS) {
      await Promise.all([
        acquireRWindows(version),
        acquireRtools(rtoolsVersion),
        acquireQpdfWindows()
      ]);
    } else if (IS_MAC) {
      await Promise.all([
        acquireFortranMacOS(),
        acquireUtilsMacOS(),
        acquireRMacOS(version)
      ]);
      if (core.getInput("remove-openmp-macos")) {
        await removeOpenmpFlags();
      }
    } else {
      let returnCode = 1;
      try {
        returnCode = await exec.exec("R", ["--version"], {
          ignoreReturnCode: true,
          silent: true
        });
      } catch (e) {}

      core.debug(`returnCode: ${returnCode}`);
      if (returnCode != 0) {
        // We only want to acquire R here if it
        // doesn't already exist (because you are running in a container that
        // already includes it)
        await acquireRUbuntu(version);
      }
    }
  } catch (error) {
    core.debug(error);

    throw `Failed to get R ${version}: ${error}`;
  }
}

async function acquireFortranMacOS() {
  try {
    await exec.exec("brew", ["cask", "install", "gfortran"]);
  } catch (error) {
    core.debug(error);

    throw `Failed to install gfortan: ${error}`;
  }
}

async function acquireUtilsMacOS() {
  // qpdf is needed by `--as-cran`
  try {
    await exec.exec("brew", ["install", "qpdf", "pkgconfig", "checkbashisms"]);
  } catch (error) {
    core.debug(error);

    throw `Failed to install qpdf: ${error}`;
  }
}

async function removeOpenmpFlags() {
  try {
    await exec.exec("sed", [
      "-i",
      ".bak",
      "-e",
      "s/-fopenmp//g",
      "/Library/Frameworks/R.framework/Resources/etc/Makeconf"
    ]);
  } catch (error) {
    core.debug(error);

    throw `Failed to remove OpenMP flags: ${error}`;
  }
}

async function acquireRUbuntu(version: string): Promise<string> {
  //
  // Download - a tool installer intimately knows how to get the tool (and construct urls)
  //
  let fileName: string = getFileNameUbuntu(version);
  let downloadUrl: string = getDownloadUrlUbuntu(fileName);
  let downloadPath: string | null = null;
  try {
    downloadPath = await tc.downloadTool(downloadUrl);
    await io.mv(downloadPath, path.join(tempDirectory, fileName));
  } catch (error) {
    core.debug(error);

    throw `Failed to download version ${version}: ${error}`;
  }

  //
  // Install
  //
  let extPath: string = tempDirectory;
  if (!extPath) {
    throw new Error("Temp directory not set");
  }

  try {
    await exec.exec("sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq");
    // install gdbi-core and also qpdf, which is used by `--as-cran`
    await exec.exec(
      "sudo DEBIAN_FRONTEND=noninteractive apt-get install gdebi-core qpdf"
    );
    await exec.exec("sudo gdebi", [
      "--non-interactive",
      path.join(tempDirectory, fileName)
    ]);
  } catch (error) {
    core.debug(error);

    throw `Failed to install R: ${error}`;
  }

  //
  // Add symlinks to the installed R to the path
  //
  //
  try {
    await exec.exec("sudo ln", [
      "-s",
      path.join("/opt", "R", version, "bin", "R"),
      "/usr/local/bin/R"
    ]);
    await exec.exec("sudo ln", [
      "-s",
      path.join("/opt", "R", version, "bin", "Rscript"),
      "/usr/local/bin/Rscript"
    ]);
  } catch (error) {
    core.debug(error);

    throw `Failed to setup symlinks to R: ${error}`;
  }

  return "/usr/local/bin";
}

async function acquireRMacOS(version: string): Promise<string> {
  //
  // Download - a tool installer intimately knows how to get the tool (and construct urls)
  //
  let fileName: string = getFileNameMacOS(version);
  let downloadUrl: string = getDownloadUrlMacOS(version);
  let downloadPath: string | null = null;
  try {
    downloadPath = await tc.downloadTool(downloadUrl);
    await io.mv(downloadPath, path.join(tempDirectory, fileName));
  } catch (error) {
    core.debug(error);

    throw `Failed to download version ${version}: ${error}`;
  }

  //
  // Extract
  //
  let extPath: string = tempDirectory;
  if (!extPath) {
    throw new Error("Temp directory not set");
  }

  try {
    await exec.exec("sudo", [
      "installer",
      "-pkg",
      path.join(tempDirectory, fileName),
      "-target",
      "/"
    ]);
  } catch (error) {
    core.debug(error);

    throw `Failed to install R: ${error}`;
  }

  return "/";
}

async function acquireRWindows(version: string): Promise<string> {
  let fileName: string = getFileNameWindows(version);
  let downloadUrl: string = await getDownloadUrlWindows(version);
  let downloadPath: string | null = null;
  try {
    downloadPath = await tc.downloadTool(downloadUrl);
    await io.mv(downloadPath, path.join(tempDirectory, fileName));
  } catch (error) {
    core.debug(error);

    throw `Failed to download version ${version}: ${error}`;
  }

  //
  // Install
  //
  let extPath: string = tempDirectory;
  if (!extPath) {
    throw new Error("Temp directory not set");
  }

  try {
    await exec.exec(path.join(tempDirectory, fileName), [
      "/VERYSILENT",
      "/SUPPRESSMSGBOXES",
      "/DIR=C:\\R"
    ]);
  } catch (error) {
    core.debug(error);

    throw `Failed to install R: ${error}`;
  }

  core.addPath(`C:\\R\\bin`);

  return "";
}

async function acquireRtools(version: string) {
  const rtools4 = version.charAt(0) == '4';
  let fileName: string = util.format(rtools4 ? "rtools%s-x86_64.exe" : "Rtools%s.exe", version);
  let downloadUrl: string = util.format(
    "http://cloud.r-project.org/bin/windows/Rtools/%s",
    fileName
  );
  console.log(`Downloading ${downloadUrl}...`);
  let downloadPath: string | null = null;
  try {
    downloadPath = await tc.downloadTool(downloadUrl);
    await io.mv(downloadPath, path.join(tempDirectory, fileName));
  } catch (error) {
    core.debug(error);

    throw `Failed to download version ${version}: ${error}`;
  }

  try {
    await exec.exec(path.join(tempDirectory, fileName), [
      "/VERYSILENT",
      "/SUPPRESSMSGBOXES"
    ]);
  } catch (error) {
    core.debug(error);

    throw `Failed to install Rtools: ${error}`;
  }
  if(rtools4){
    core.addPath(`C:\\rtools40\\usr\\bin`);
    core.addPath(`C:\\rtools40\\mingw64\\bin`);
  } else {
    core.addPath(`C:\\Rtools\\bin`);
    core.addPath(`C:\\Rtools\\mingw_64\\bin`);
  }
}

async function acquireQpdfWindows() {
  try {
    await exec.exec("choco", ["install", "qpdf", "--no-progress"]);
  } catch (error) {
    core.debug(error);

    throw `Failed to install qpdf: ${error}`;
  }
}

async function setupRLibrary() {
  let profilePath;
  if (IS_WINDOWS) {
    profilePath = path.join(
      process.env["USERPROFILE"] || "C:\\",
      "Documents",
      ".Rprofile"
    );
  } else {
    profilePath = path.join(process.env["HOME"] || "/Users", ".Rprofile");
  }
  core.debug("R profile is at " + profilePath);

  let rspm = process.env["RSPM"] ? `'${process.env["RSPM"]}'` : "NULL";
  let cran = `'${process.env["CRAN"] || "https://cloud.r-project.org"}'`;
  await fs.writeFile(
    profilePath,
    `options(\
       repos = c(\
         RSPM = ${rspm},\
         CRAN = ${cran}\
       ),\
       crayon.enabled = ${core.getInput("crayon.enabled")},\
       Ncpus = ${core.getInput("Ncpus")}\
     )\n`
  );

  // Make R_LIBS_USER
  io.mkdirP(process.env["R_LIBS_USER"] || path.join(tempDirectory, "Library"));
}

function getFileNameMacOS(version: string): string {
  const filename: string = util.format("R-%s.pkg", version);
  return filename;
}

function getDownloadUrlMacOS(version: string): string {
  if (version == "devel") {
    return "https://mac.r-project.org/high-sierra/R-devel/R-devel.pkg";
  }
  const filename: string = getFileNameMacOS(version);

  if (semver.eq(version, "3.2.5")) {
    // 3.2.5 is 'special', it is actually 3.2.4-revised...
    return "https://cloud.r-project.org/bin/macosx/old/R-3.2.4-revised.pkg";
  }
  if (semver.lt(version, "3.4.0")) {
    // older versions are in /old
    return util.format(
      "https://cloud.r-project.org/bin/macosx/old/%s",
      filename
    );
  }

  return util.format("https://cloud.r-project.org/bin/macosx/%s", filename);
}

function getFileNameUbuntu(version: string): string {
  const filename: string = util.format("r-%s_1_amd64.deb", version);
  return filename;
}

function getDownloadUrlUbuntu(filename: string): string {
  if (filename == "devel") {
    throw new Error("R-devel not currently available on ubuntu!");
  }

  try {
    const info = osInfo({ mode: "sync" });
    const versionStr = info.version_id.replace(/[.]/g, "");

    return util.format(
      "https://cdn.rstudio.com/r/ubuntu-%s/pkgs/%s",
      versionStr,
      filename
    );
  } catch (error) {
    throw `Failed to get OS info: ${error}`;
  }
}

function getFileNameWindows(version: string): string {
  const filename: string = util.format("R-%s-win.exe", version);
  return filename;
}

async function getDownloadUrlWindows(version: string): Promise<string> {
  if (version == "devel") {
    return "https://cloud.r-project.org/bin/windows/base/R-devel-win.exe";
  }

  const filename: string = getFileNameWindows(version);

  const latestVersion: string = await getLatestVersion("3.x");

  if (version == latestVersion) {
    return util.format(
      "https://cloud.r-project.org/bin/windows/base/%s",
      filename
    );
  }

  return util.format(
    "https://cloud.r-project.org/bin/windows/base/old/%s/%s",
    version,
    filename
  );
}

function setREnvironmentVariables() {
  core.exportVariable("R_LIBS_USER", path.join(tempDirectory, "Library"));
  core.exportVariable("CI", "true");
  core.exportVariable("TZ", "UTC");
  core.exportVariable("NOT_CRAN", "true");
}

async function determineVersion(version: string): Promise<string> {
  if (version.toLowerCase() == "latest" || version.toLowerCase() == "release") {
    version = "3.x";
  }

  if (!version.endsWith(".x")) {
    const versionPart = version.split(".");

    if (versionPart[1] == null || versionPart[2] == null) {
      return await getLatestVersion(version.concat(".x"));
    } else {
      return version;
    }
  }

  return await getLatestVersion(version);
}

// This function is required to convert the version 1.10 to 1.10.0.
// Because caching utility accept only sementic version,
// which have patch number as well.
function normalizeVersion(version: string): string {
  const versionPart = version.split(".");
  if (versionPart[1] == null) {
    //append minor and patch version if not available
    return version.concat(".0.0");
  }

  if (versionPart[2] == null) {
    //append patch version if not available
    return version.concat(".0");
  }

  return version;
}

interface IRRef {
  version: string;
}

async function getAvailableVersions(): Promise<string[]> {
  let rest: restm.RestClient = new restm.RestClient("setup-r");
  let tags: IRRef[] =
    (await rest.get<IRRef[]>("https://rversions.r-pkg.org/r-versions"))
      .result || [];

  return tags.map(tag => tag.version);
}

async function getPossibleVersions(version: string): Promise<string[]> {
  const versions = await getAvailableVersions();
  const possibleVersions = versions.filter(v => v.startsWith(version));

  const versionMap = new Map();
  possibleVersions.forEach(v => versionMap.set(normalizeVersion(v), v));

  return Array.from(versionMap.keys())
    .sort(semver.rcompare)
    .map(v => versionMap.get(v));
}

async function getLatestVersion(version: string): Promise<string> {
  // clean .x syntax: 1.10.x -> 1.10
  const trimmedVersion = version.slice(0, version.length - 2);

  const versions = await getPossibleVersions(trimmedVersion);

  core.debug(`evaluating ${versions.length} versions`);

  if (version.length === 0) {
    throw new Error("unable to get latest version");
  }

  core.debug(`matched: ${versions[0]}`);

  return versions[0];
}
