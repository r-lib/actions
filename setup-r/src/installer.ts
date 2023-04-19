interface IRRef {
  version: string;
}

interface IRVersion {
  version: string;
  url: string;
  rtools_version?: string;
  rtools_url?: string;
  type: string;
}

interface IRRefURL {
  URL: string;
}

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

const OS = !!process.env.SETUP_R_OS ? process.env.SETUP_R_OS :
    IS_WINDOWS ? "win" : IS_MAC ? "mac" : "linux";
const ARCH = !!process.env.SETUP_R_ARCH ? process.env.SETUP_R_ARCH :
    OS == "win" ? undefined :
    (OS == "mac" && process.arch == "arm64") ? "arm64" :
    (OS == "mac" && process.arch == "x64") ? "x86_64" :
    process.arch == "x64" ? "x86_64" : process.arch;

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

  var ok = false;
  if (!!process.env.RUNNER_TOOL_CACHE) {
    let toolPath = tc.find("R", selected.version);
    if (toolPath) {
        ok = true;
        core.debug(`Tool found in cache ${toolPath}`);
    }
  }

  if (!ok) {
    try {
      await acquireR(selected);
    } catch (error) {
      core.debug(`${error}`);
      throw `Failed to get R ${version}: ${error}`;
    }
  }

  setREnvironmentVariables();
  setupRLibrary();
  core.setOutput("installed-r-version", version);
}

async function acquireR(version: IRVersion) {
  if (core.getInput("install-r") !== "true") {
    return;
  }

  try {
    if (IS_WINDOWS) {
      await Promise.all([
        await acquireRWindows(version),
        await acquireRtools(version)
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

  // version.rtools_cersion is always trithy on Windows, but typescript
  // does not know that
  if (IS_WINDOWS && version.rtools_version) {
    const rtoolsVersionNumber = parseInt(version.rtools_version);
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

async function acquireRUbuntu(version: IRVersion): Promise<string> {
  //
  // Download - a tool installer intimately knows how to get the tool (and construct urls)
  //
  let downloadUrl: string = version.url;
  let fileName: string = path.basename(downloadUrl);
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
  let rdir = (version.type == "next" || version.type == "devel") ?
        version.type : version.version;
  try {
    await exec.exec("sudo ln", [
      "-sf",
      path.join("/opt", "R", rdir, "bin", "R"),
      "/usr/local/bin/R"
    ]);
    await exec.exec("sudo ln", [
      "-sf",
      path.join("/opt", "R", rdir, "bin", "Rscript"),
      "/usr/local/bin/Rscript"
    ]);
  } catch (error) {
    core.debug(`${error}`);
    throw `Failed to setup symlinks to R: ${error}`;
  }

  return "/usr/local/bin";
}

async function acquireRMacOS(version: IRVersion): Promise<string> {
  //
  // Download - a tool installer intimately knows how to get the tool (and construct urls)
  //
  let downloadUrl: string = version.url;
  let fileName: string = path.basename(downloadUrl);
  let downloadPath: string | null = null;
  try {
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

async function acquireRWindows(version: IRVersion): Promise<string> {
  let fileName: string = path.basename(version.url);
  let downloadPath: string | null = null;
  try {
    downloadPath = await tc.downloadTool(version.url);
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

async function acquireRtools(version: IRVersion) {
  const versionNumber = parseInt(version.rtools_version || 'error');
  const rtools43 = versionNumber >= 43;
  const rtools42 = !rtools43 && versionNumber >= 41;
  const rtools40 = !rtools43 && !rtools42 && versionNumber >= 40;
  const rtools3x = !rtools43 && !rtools42 && !rtools40;
  var downloadUrl = version.rtools_url || 'error';
  var fileName = path.basename(downloadUrl);

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
      if (semver.gte(version.version, "4.2.0")) {
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

async function getLinuxPlatform() : Promise<string> {
    if (process.env.SETUP_R_LINUX_PLATFORM) {
      return process.env.SETUP_R_LINUX_PLATFORM;
    } else {
        const info = await osInfo();
        return "linux-" + info.id + "-" + info.version_id;
    }
}

function setREnvironmentVariables() {
  core.exportVariable("R_LIBS_USER", path.join(tempDirectory, "Library"));
  core.exportVariable("TZ", "UTC");
  core.exportVariable("_R_CHECK_SYSTEM_CLOCK_", "FALSE");
  if (!process.env["NOT_CRAN"]) core.exportVariable("NOT_CRAN", "true");
}

// Need to keep this for setting the HTTP User-Agent header to
// R-release for RSPM
async function getReleaseVersion(platform: string): Promise<string> {
  let rest: restm.RestClient = new restm.RestClient("setup-r");
  let tags: IRRef = (
    await rest.get<IRRef>(
      util.format("https://api.r-hub.io/rversions/r-release-%s", platform)
    )
  ).result || { version: "" };

  return tags.version;
}

export async function determineVersion(version: string): Promise<IRVersion> {
  // A temporary hack to make these work
  if (version == "latest" || version == "4" || version == "4.x" || version == "4.x.x") {
    version = "release"
  } else if (version == "3" || version == "3.x" || version == "3.x.x") {
    version = "3.6.3"
  } else if (version.endsWith(".x")) {
    version = version.replace(/[.]x$/, "")
  }

  let rest: restm.RestClient = new restm.RestClient("setup-r");
  let os: string = OS != "linux" ? OS : await getLinuxPlatform();
  let url: string = "https://api.r-hub.io/rversions/resolve/" +
        version + "/" + os;
  if (ARCH) { url = url + "/" + ARCH; }
  let tags = (await rest.get<IRVersion>(url)).result;

  if (!tags) {
    throw new Error(`Failed to resolve R version ${version} at ${url}.`);
  }

  return tags;
}
