let tempDirectory = process.env["RUNNER_TEMP"] || "";

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";
import * as io from "@actions/io";
import * as util from "util";
import * as path from "path";
import * as fs from "fs";
import * as restm from "typed-rest-client/RestClient";
import * as semver from "semver";
import osInfo from "linux-os-info";

const IS_WINDOWS = process.platform === "win32";
const IS_MAC = process.platform === "darwin";
const IS_LINUX = process.platform === "linux";

if (!tempDirectory) {
  let baseLocation: string;
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

export async function getR(version: string) {
  const selected = await determineVersion(version);
  if (selected) {
    version = selected;
  }

  // this works for 'next' and 'devel' as well, currently, release and oldrel should
  // have been converted to version numbers here.
  let rtoolsVersion =
	core.getInput("rtools-version") ||
	(version.charAt(0) == "3" ?
	    "35" :
	    (version == "devel" || version == "next" || semver.gte(version, "4.3.0") ? "43" : "40")
	);

  let toolPath = tc.find("R", version);

  if (toolPath) {
    core.debug(`Tool found in cache ${toolPath}`);
  } else {
    try {
      await acquireR(version, rtoolsVersion);
    } catch (error) {
      core.debug(`${error}`);

      throw `Failed to get R ${version}: ${error}`;
    }
  }

  setREnvironmentVariables();
  setupRLibrary();
  core.setOutput("installed-r-version", version);
}

async function acquireR(version: string, rtoolsVersion: string) {
  if (core.getInput("install-r") !== "true") {
    return;
  }

  try {
    if (IS_WINDOWS) {
      await Promise.all([
        await acquireRWindows(version),
        await acquireRtools(rtoolsVersion, version),
      ]);
    } else if (IS_MAC) {
      await core.group('Downloading gfortran', async() => { await acquireFortranMacOS() });
      await core.group('Downloading macOS utils', async() => { await acquireUtilsMacOS() });
      await core.group('Downloading R', async() => { await acquireRMacOS(version) });
      if (core.getInput("remove-openmp-macos") === "true") {
        await core.group('Patching -fopenmp', async() => { await removeOpenmpFlags() });
      }
    } else {
      await acquireRUbuntu(version);
    }
  } catch (error) {
    core.debug(`${error}`);


    throw `Failed to get R ${version}: ${error}`;
  }

  if (IS_WINDOWS) {
    const rtoolsVersionNumber = parseInt(rtoolsVersion.substring(0, 2));
    const noqpdf = rtoolsVersionNumber >= 41;
    var tries_left = 10;
    var ok = false;
    while (!ok && tries_left > 0) {
      try {
        await acquireQpdfWindows(noqpdf);
        ok = true;
      } catch (error) {
        core.warning("Failed to download qpdf or ghostscript: ${error}");
          await new Promise(f => setTimeout(f, 10000));
          tries_left = tries_left - 1;
      }
    }
    if (!ok) { throw `Failed to get qpdf and ghostscript in 10 tries :(` }
    let gspath = "c:\\program files\\gs\\" +
          fs.readdirSync("c:\\program files\\gs") +
          "\\bin";
    core.addPath(gspath);
  }
}

async function acquireFortranMacOS(): Promise<string> {
  let gfortran: string = "gfortran-8.2-Mojave";
  let mntPath: string = path.join("/Volumes", gfortran);
  let fileName: string = `${gfortran}.dmg`;
  let downloadUrl: string = `https://mac.r-project.org/tools/${fileName}`;
  let downloadPath: string | null = null;

  try {
    downloadPath = await tc.downloadTool(downloadUrl);
    await io.mv(downloadPath, path.join(tempDirectory, fileName));
  } catch (error) {
    core.debug(`${error}`);

    throw `Failed to download ${downloadUrl}: ${error}`;
  }

  try {
    await exec.exec("sudo", [
      "hdiutil",
      "attach",
      path.join(tempDirectory, fileName)
    ]);
  } catch (error) {
    core.debug(`${error}`);

    throw `Failed to mount ${fileName}: ${error}`;
  }

  try {
    await exec.exec("sudo", [
      "installer",
      "-allowUntrusted",
      "-dumplog",
      "-package",
      path.join(mntPath, gfortran, "gfortran.pkg"),
      "-target",
      "/"
    ]);
  } catch (error) {
    core.debug(`${error}`);

    throw `Failed to install gfortran: ${error}`;
  }

  // We do not detach the volume here, because it might lead to hangs

  core.addPath("/usr/local/gfortran/bin");
  // rename the gcov executable shipped with gfortran, as it conflits with the
  // normal gcov executable in llvm, and we cannot append paths to PATH
  // currently https://github.com/actions/toolkit/issues/270
  await exec.exec("sudo", [
    "mv",
    "/usr/local/gfortran/bin/gcov",
    "/usr/local/gfortran/bin/gcov-fortran"
  ]);

  return "/";
}

async function acquireUtilsMacOS() {
  // qpdf is needed by `--as-cran`
  try {
    await exec.exec("brew", ["install", "qpdf", "pkgconfig", "checkbashisms", "ghostscript"]);
  } catch (error) {
    core.debug(`${error}`);

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
    core.debug(`${error}`);

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
  core.startGroup('Downloading R');

  try {
    downloadPath = await tc.downloadTool(downloadUrl);
    await io.mv(downloadPath, path.join(tempDirectory, fileName));
  } catch (error) {
    core.debug(`${error}`);

    throw `Failed to download version ${version}: ${error}`;
  }
  core.endGroup()

  //
  // Install
  //
  let extPath: string = tempDirectory;
  if (!extPath) {
    throw new Error("Temp directory not set");
  }

  try {
    await core.group('Updating system package data', async() => {
      await exec.exec(
        "sudo DEBIAN_FRONTEND=noninteractive apt-get update -y -qq"
      );
    });
    // install gdbi-core and also qpdf, which is used by `--as-cran`
    await core.group('Installing R system requirements', async() => {
      await exec.exec(
        "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gdebi-core qpdf devscripts ghostscript"
      );
    });
    await core.group("Installing R", async() => {
      await exec.exec("sudo gdebi", [
        "--non-interactive",
        path.join(tempDirectory, fileName)
      ]);
    });
  } catch (error) {
    core.debug(`${error}`);

    throw `Failed to install R: ${error}`;
  }

  //
  // Add symlinks to the installed R to the path
  //
  //
  try {
    await exec.exec("sudo ln", [
      "-sf",
      path.join("/opt", "R", version, "bin", "R"),
      "/usr/local/bin/R"
    ]);
    await exec.exec("sudo ln", [
      "-sf",
      path.join("/opt", "R", version, "bin", "Rscript"),
      "/usr/local/bin/Rscript"
    ]);
  } catch (error) {
    core.debug(`${error}`);

    throw `Failed to setup symlinks to R: ${error}`;
  }

  return "/usr/local/bin";
}

async function acquireRMacOS(version: string): Promise<string> {
  //
  // Download - a tool installer intimately knows how to get the tool (and construct urls)
  //
  let fileName: string = getFileNameMacOS(version);
  let downloadUrl: string = await getDownloadUrlMacOS(version);
  let downloadPath: string | null = null;
  try {
    if (downloadUrl == "") {
      throw("Cannot determine download URL");
    }
    downloadPath = await tc.downloadTool(downloadUrl);
    await io.mv(downloadPath, path.join(tempDirectory, fileName));
  } catch (error) {
    core.debug(`${error}`);

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
      "-allowUntrusted",
      "-dumplog",
      "-pkg",
      path.join(tempDirectory, fileName),
      "-target",
      "/"
    ]);
  } catch (error) {
    core.debug(`${error}`);

    throw `Failed to install R: ${error}`;
  }

  // Older R versions on newer macOS cannot create a symlink to R and
  // Rscript, we'll need to do it manually.
  try {
    await exec.exec("sudo ln", [
      "-sf",
      "/Library/Frameworks/R.framework/Resources/bin/R",
      "/usr/local/bin/R"
    ]);
    await exec.exec("sudo ln", [
      "-sf",
      "/Library/Frameworks/R.framework/Resources/bin/Rscript",
      "/usr/local/bin/Rscript"
    ]);
  } catch (error) {
    core.debug(`${error}`);
    core.debug("Marching on despite failed symlink creation.")
  }

  return "/";
}

async function acquireRWindows(version: string): Promise<string> {
  let fileName: string = getFileNameWindows(version);
  let downloadUrl: string = await getDownloadUrlWindows(version);
  let downloadPath: string | null = null;
  try {
    if (downloadUrl == "") {
      throw("Cannot determine download URL");
    }
    downloadPath = await tc.downloadTool(downloadUrl);
    await io.mv(downloadPath, path.join(tempDirectory, fileName));
  } catch (error) {
    core.debug(`${error}`);

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
    core.debug(`${error}`);

    throw `Failed to install R: ${error}`;
  }

  core.addPath(`C:\\R\\bin`);

  return "";
}

async function acquireRtools(version: string, rversion: string) {
  const versionNumber = parseInt(version.substring(0, 2));
  const rtools43 = versionNumber >= 43;
  const rtools42 = !rtools43 && versionNumber >= 41;
  const rtools40 = !rtools43 && !rtools42 && versionNumber >= 40;
  const rtools3x = !rtools43 && !rtools42 && !rtools40;
  var downloadUrl, fileName;
  if (rtools3x) {
    fileName = util.format("Rtools%s.exe", version);
    downloadUrl = util.format(
      "http://cloud.r-project.org/bin/windows/Rtools/%s",
      fileName)
  } else if (rtools40) {
    fileName = util.format("rtools%s-x86_64.exe", version);
    downloadUrl = util.format(
      "http://cloud.r-project.org/bin/windows/Rtools/%s",
      fileName)
  } else if (rtools42) {
    fileName = "rtools42.exe";
    downloadUrl = "https://github.com/r-hub/rtools42/releases/download/latest/rtools42.exe";
  } else {
    // rtools43
    fileName = "rtools43.exe";
    downloadUrl = "https://github.com/r-hub/rtools43/releases/download/latest/rtools43.exe";
  }

  // If Rtools is already installed just return, as there is a message box
  // which hangs the build otherwise.
  if (
      (rtools43 && fs.existsSync("C:\\Rtools43")) ||
      (rtools42 && fs.existsSync("C:\\Rtools42")) ||
      (rtools40 && fs.existsSync("C:\\rtools40")) ||
      (rtools3x && fs.existsSync("C:\\Rtools"))
  ) {
    core.debug(
      "Skipping Rtools installation as a suitable Rtools is already installed"
    );
  } else {
    console.log(`Downloading ${downloadUrl}...`);
    let downloadPath: string | null = null;
    try {
      downloadPath = await tc.downloadTool(downloadUrl);
      await io.mv(downloadPath, path.join(tempDirectory, fileName));
    } catch (error) {
      core.debug(`${error}`);

      throw `Failed to download version ${version}: ${error}`;
    }

    try {
      await exec.exec(path.join(tempDirectory, fileName), [
        "/VERYSILENT",
        "/SUPPRESSMSGBOXES"
      ]);
    } catch (error) {
      core.debug(`${error}`);

      throw `Failed to install Rtools: ${error}`;
    }
  }
  // we never want patches (by default)
  let addpath = core.getInput("windows-path-include-rtools") === "true";
  core.exportVariable("_R_INSTALL_TIME_PATCHES_", "no");
  if (rtools43) {
    if (addpath) {
      core.addPath(`C:\\rtools43\\usr\\bin`);
      core.addPath(`C:\\rtools43\\x86_64-w64-mingw32.static.posix\\bin`);
    }
  } else if (rtools42) {
    if (addpath) {
      core.addPath(`C:\\rtools42\\usr\\bin`);
      core.addPath(`C:\\rtools42\\x86_64-w64-mingw32.static.posix\\bin`);
    }
  } else if (rtools40) {
    if (addpath) {
      core.addPath(`C:\\rtools40\\usr\\bin`);
      // If we use Rtools40 and R 4.2.0 or later, then we need to add this
      // to the path, because GHA might put a different gcc on the PATH,
      // and R 4.2.x picks that up. We do this for R-devel, R-next and
      // every numeric version that is not 4.0.x and 4.1.x. (For 3.x.y
      // Rtools3.x is selected.) Issue #610.
      if (rversion == "devel" || rversion == "next" ||
          (!rversion.startsWith("4.0.") && !rversion.startsWith("4.1."))) {
        core.addPath(`C:\\rtools40\\ucrt64\\bin`);
      }
    }
    if (core.getInput("update-rtools") === "true") {
      try {
        await exec.exec("c:\\rtools40\\usr\\bin\\bash.exe", [
          "--login",
          "-c",
          "pacman -Syu --noconfirm"
        ]);
      } catch (error) {
        core.debug(`${error}`);
        throw `Failed to update rtools40 libraries: ${error}`;
      }
    }
  } else { // rtools3x
    if (addpath) {
      core.addPath(`C:\\Rtools\\bin`);
      if (core.getInput("windows-path-include-mingw") === "true") {
        core.addPath(`C:\\Rtools\\mingw_64\\bin`);
      }
    }
  }
}

async function acquireQpdfWindows(noqpdf) {
  var pkgs = ["ghostscript"];
  if (noqpdf) {
    pkgs = pkgs.concat(["qpdf"]);
  }
  var args = ["install"].concat(pkgs).concat(["--no-progress"]);
  try {
    await exec.exec("choco", args);
  } catch (error) {
    core.debug(`${error}`);

    throw `Failed to install qpdf: ${error}`;
  }
}

async function setupRLibrary() {
  let profilePath: fs.PathLike | fs.promises.FileHandle;
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

  if (rspm === "NULL" && core.getInput("use-public-rspm") === "true") {
    if (IS_WINDOWS) {
      rspm = "'https://packagemanager.posit.co/cran/latest'";
    }
    if (IS_LINUX) {
      let codename = "";
      try {
        await exec.exec("lsb_release", ["--short", "--codename"], {
          listeners: {
            stdout: (data: Buffer): string => (codename += data.toString())
          }
        });
      } catch (error) {
        core.debug(`${error}`);

        throw `Failed to query the linux version: ${error}`;
      }
      codename = codename.trim();

      rspm = `'https://packagemanager.posit.co/cran/__linux__/${codename}/latest'`;
    }
  }

  if (rspm !== "NULL") {
    let rspm_noq = rspm.replace(/^'|'$/g, "");
    core.exportVariable("RSPM", rspm_noq);
    core.exportVariable("RENV_CONFIG_REPOS_OVERRIDE", rspm_noq);
  }

  let cran = `'${core.getInput("cran") ||
    process.env["CRAN"] ||
    "https://cloud.r-project.org"}'`;

  let user_agent;

  if (core.getInput("http-user-agent") === "release") {
    let os = IS_WINDOWS ? "win" : IS_MAC ? "macos" : "tarball";

    let version = await getReleaseVersion(os);
    user_agent = `sprintf("R/${version} R (${version} %s) on GitHub Actions", paste(R.version$platform, R.version$arch, R.version$os))`;
  } else {
    user_agent =
      core.getInput("http-user-agent") === "default" ||
      core.getInput("http-user-agent") === ""
        ? 'sprintf("R/%s R (%s) on GitHub Actions", getRversion(), paste(getRversion(), R.version$platform, R.version$arch, R.version$os))'
        : `"${core.getInput("http-user-agent")}"`;
  }

  // Split the repositories by whitespace and then quote each entry joining with commas
  let extra_repositories = core.getInput("extra-repositories");

  // Prepend a , if there are extra repositories
  if (extra_repositories) {
    extra_repositories = extra_repositories
      .split(/\s+/)
      .map(x => `"${x}"`)
      .join(",");
    extra_repositories = ",\n    " + extra_repositories;
  }

  await fs.promises.writeFile(
    profilePath,
    `Sys.setenv("PKGCACHE_HTTP_VERSION" = "2")
options(
  repos = c(
    RSPM = ${rspm},
    CRAN = ${cran}${extra_repositories}
  ),
  Ncpus = ${core.getInput("Ncpus")},
  HTTPUserAgent = ${user_agent}
)\n`
  );

  // Make R_LIBS_USER
  io.mkdirP(process.env["R_LIBS_USER"] || path.join(tempDirectory, "Library"));
}

function getFileNameMacOS(version: string): string {
  const filename: string = util.format("R-%s.pkg", version);
  return filename;
}

async function getDownloadUrlMacOS(version: string): Promise<string> {
  if (version == "devel") {
    return "https://mac.R-project.org/high-sierra/last-success/R-devel-x86_64.pkg";
  }
  if (version == "next" || version == "prerelease") {
    return getDownloadUrlMacOSNext();
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
  if (semver.lt(version, "4.0.0")) {
    // older versions are in el-capitan/base
    return util.format(
      "https://cloud.r-project.org/bin/macosx/el-capitan/base/%s",
      filename
    );
  }

  // 4.0.0+ are in base/
  return util.format(
    "https://cloud.r-project.org/bin/macosx/base/%s",
    filename
  );
}

function getFileNameUbuntu(version: string): string {
  const filename: string = util.format("r-%s_1_amd64.deb", version);
  return filename;
}

function getDownloadUrlUbuntu(filename: string): string {
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
  if (version == "next" || version == "prerelease") {
    return getDownloadUrlWindowsNext();
  }

  const filename: string = getFileNameWindows(version);

  const releaseVersion: string = await getReleaseVersion("win");

  if (version == releaseVersion) {
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
  core.exportVariable("TZ", "UTC");
  core.exportVariable("_R_CHECK_SYSTEM_CLOCK_", "FALSE");
  if (!process.env["NOT_CRAN"]) core.exportVariable("NOT_CRAN", "true");
}

interface IRRef {
  version: string;
}

interface IRRefURL {
  URL: string;
}

async function getReleaseVersion(platform: string): Promise<string> {
  let rest: restm.RestClient = new restm.RestClient("setup-r");
  let tags: IRRef = (
    await rest.get<IRRef>(
      util.format("https://api.r-hub.io/rversions/r-release-%s", platform)
    )
  ).result || { version: "" };

  return tags.version;
}

async function getOldrelVersion(version: string): Promise<string> {
  let rest: restm.RestClient = new restm.RestClient("setup-r");
  let tags: IRRef = (
    await rest.get<IRRef>(
      util.format("https://api.r-hub.io/rversions/r-oldrel/%s", version)
    )
  ).result || { version: "" };

  return tags.version;
}

async function getAvailableVersions(): Promise<string[]> {
  let rest: restm.RestClient = new restm.RestClient("setup-r");
  let tags: IRRef[] =
    (await rest.get<IRRef[]>("https://api.r-hub.io/rversions/r-versions"))
      .result || [];

  return tags.map(tag => tag.version);
}

async function determineVersion(version: string): Promise<string> {
  // There is no linux endpoint, so we just use the tarball one for linux.

  version = version.toLowerCase();

  // Formerly called 'devel-ucrt' is now just 'devel'
  if (version == "devel-ucrt") {
    return "devel";
  }
  if (version == "latest" || version == "release") {
    if (IS_WINDOWS) {
      return getReleaseVersion("win");
    }
    if (IS_MAC) {
      return getReleaseVersion("macos");
    }
    return getReleaseVersion("tarball");
  }

  if (version.startsWith("oldrel")) {
    const [, oldRelVersion] = version.split(/[-\/]/);
    if (oldRelVersion == null) {
      return getOldrelVersion("1");
    }
    return getOldrelVersion(oldRelVersion);
  }

  if (!version.endsWith(".x")) {
    const versionPart = version.split(".");

    if (versionPart[1] == null || versionPart[2] == null) {
      return await getLatestVersion(version.concat(".x"));
    } else {
      // This is also 'next' and 'devel'
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

async function getDownloadUrlWindowsNext(): Promise<string> {
  let rest: restm.RestClient = new restm.RestClient("setup-r");
  let tags: IRRefURL = (
    await rest.get<IRRefURL>(
      "https://api.r-hub.io/rversions/r-next-win"
    )
  ).result || { URL: "" };

  return tags.URL;
}

async function getDownloadUrlMacOSNext() {
  let rest: restm.RestClient = new restm.RestClient("setup-r");
  let tags: IRRefURL = (
    await rest.get<IRRefURL>(
      "https://api.r-hub.io/rversions/r-next-macos"
    )
  ).result || { URL: "" };

  return tags.URL;
}
