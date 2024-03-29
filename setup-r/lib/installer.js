"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineVersion = exports.getR = void 0;
let tempDirectory = process.env["RUNNER_TEMP"] || "";
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const tc = __importStar(require("@actions/tool-cache"));
const io = __importStar(require("@actions/io"));
const util = __importStar(require("util"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const restm = __importStar(require("typed-rest-client/RestClient"));
const semver = __importStar(require("semver"));
const linux_os_info_1 = __importDefault(require("linux-os-info"));
const IS_WINDOWS = process.platform === "win32";
const IS_MAC = process.platform === "darwin";
const IS_LINUX = process.platform === "linux";
const OS = !!process.env.SETUP_R_OS ? process.env.SETUP_R_OS :
    IS_WINDOWS ? "win" : IS_MAC ? "mac" : "linux";
function detect_arch() {
    var a = process.env.SETUP_R_ARCH;
    if (!!a) {
        return a;
    }
    a = process.arch;
    if (a == "x64") {
        return "x86_64";
    }
    if (a == "aarch64") {
        return "arm64";
    }
    return a;
}
const ARCH = detect_arch();
if (!tempDirectory) {
    let baseLocation;
    if (IS_WINDOWS) {
        // On windows use the USERPROFILE env variable
        baseLocation = process.env["USERPROFILE"] || "C:\\";
    }
    else {
        if (IS_MAC) {
            baseLocation = "/Users";
        }
        else {
            baseLocation = "/home";
        }
    }
    tempDirectory = path.join(baseLocation, "actions", "temp");
}
function getR(version) {
    return __awaiter(this, void 0, void 0, function* () {
        const selected = yield determineVersion(version);
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
                yield acquireR(selected);
            }
            catch (error) {
                core.debug(`${error}`);
                throw `Failed to get R ${version}: ${error}`;
            }
        }
        setREnvironmentVariables();
        setupRLibrary();
        core.setOutput("installed-r-version", selected.version);
    });
}
exports.getR = getR;
function acquireR(version) {
    return __awaiter(this, void 0, void 0, function* () {
        if (core.getInput("install-r") !== "true") {
            return;
        }
        try {
            if (IS_WINDOWS) {
                yield Promise.all([
                    yield acquireRWindows(version),
                    yield acquireRtools(version)
                ]);
            }
            else if (IS_MAC) {
                yield core.group('Downloading gfortran', () => __awaiter(this, void 0, void 0, function* () { yield acquireFortranMacOS(version.version); }));
                yield core.group('Downloading macOS utils', () => __awaiter(this, void 0, void 0, function* () { yield acquireUtilsMacOS(); }));
                yield core.group('Downloading R', () => __awaiter(this, void 0, void 0, function* () { yield acquireRMacOS(version); }));
                if (core.getInput("remove-openmp-macos") === "true") {
                    yield core.group('Patching -fopenmp', () => __awaiter(this, void 0, void 0, function* () { yield removeOpenmpFlags(); }));
                }
            }
            else {
                yield acquireRUbuntu(version);
            }
        }
        catch (error) {
            core.debug(`${error}`);
            throw `Failed to get R ${version.version}: ${error}`;
        }
        // version.rtools_cersion is always trithy on Windows, but typescript
        // does not know that
        if (IS_WINDOWS && version.rtools) {
            const rtoolsVersionNumber = parseInt(version.rtools);
            try {
                yield acquireQpdfWindows();
            }
            catch (error) {
                throw "Failed to get qpdf.";
            }
            try {
                yield acquireGsWindows();
            }
            catch (error) {
                throw "Failed to get Ghostscript.";
            }
            let gspath = "c:\\program files\\gs\\" +
                fs.readdirSync("c:\\program files\\gs") +
                "\\bin";
            core.addPath(gspath);
        }
    });
}
function acquireFortranMacOS(version) {
    return __awaiter(this, void 0, void 0, function* () {
        if (semver.lt(version, "4.3.0")) {
            return acquireFortranMacOSOld();
        }
        else {
            return acquireFortranMacOSNew();
        }
    });
}
function acquireFortranMacOSNew() {
    return __awaiter(this, void 0, void 0, function* () {
        let downloadUrl = "https://github.com/r-hub/mac-tools/releases/download/tools/gfortran-12.2-universal.pkg";
        let fileName = path.basename(downloadUrl);
        let downloadPath = null;
        try {
            downloadPath = yield tc.downloadTool(downloadUrl);
            yield io.mv(downloadPath, path.join(tempDirectory, fileName));
        }
        catch (error) {
            core.debug(`${error}`);
            throw `Failed to download gfortran: ${error}`;
        }
        try {
            yield exec.exec("sudo", [
                "installer",
                "-allowUntrusted",
                "-dumplog",
                "-pkg",
                path.join(tempDirectory, fileName),
                "-target",
                "/"
            ]);
        }
        catch (error) {
            core.debug(`${error}`);
            throw `Failed to install gfortran: ${error}`;
        }
        core.addPath("/opt/gfortran/bin");
        return "/";
    });
}
function acquireFortranMacOSOld() {
    return __awaiter(this, void 0, void 0, function* () {
        let gfortran = "gfortran-8.2-Mojave";
        let mntPath = path.join("/Volumes", gfortran);
        let fileName = `${gfortran}.dmg`;
        let downloadUrl = `https://github.com/r-hub/mac-tools/releases/download/tools/${fileName}`;
        let downloadPath = null;
        try {
            downloadPath = yield tc.downloadTool(downloadUrl);
            yield io.mv(downloadPath, path.join(tempDirectory, fileName));
        }
        catch (error) {
            core.debug(`${error}`);
            throw `Failed to download ${downloadUrl}: ${error}`;
        }
        try {
            yield exec.exec("sudo", [
                "hdiutil",
                "attach",
                path.join(tempDirectory, fileName)
            ]);
        }
        catch (error) {
            core.debug(`${error}`);
            throw `Failed to mount ${fileName}: ${error}`;
        }
        try {
            yield exec.exec("sudo", [
                "installer",
                "-allowUntrusted",
                "-dumplog",
                "-package",
                path.join(mntPath, gfortran, "gfortran.pkg"),
                "-target",
                "/"
            ]);
        }
        catch (error) {
            core.debug(`${error}`);
            throw `Failed to install gfortran: ${error}`;
        }
        // We do not detach the volume here, because it might lead to hangs
        core.addPath("/usr/local/gfortran/bin");
        // rename the gcov executable shipped with gfortran, as it conflits with the
        // normal gcov executable in llvm, and we cannot append paths to PATH
        // currently https://github.com/actions/toolkit/issues/270
        yield exec.exec("sudo", [
            "mv",
            "/usr/local/gfortran/bin/gcov",
            "/usr/local/gfortran/bin/gcov-fortran"
        ]);
        return "/";
    });
}
function acquireUtilsMacOS() {
    return __awaiter(this, void 0, void 0, function* () {
        // qpdf is needed by `--as-cran`
        try {
            process.env.HOMEBREW_NO_INSTALLED_DEPENDENTS_CHECK = "true";
            yield exec.exec("brew", ["install", "qpdf", "pkgconfig", "checkbashisms", "ghostscript"]);
        }
        catch (error) {
            core.debug(`${error}`);
            throw `Failed to install qpdf: ${error}`;
        }
    });
}
function removeOpenmpFlags() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield exec.exec("sed", [
                "-i",
                ".bak",
                "-e",
                "s/-fopenmp//g",
                "/Library/Frameworks/R.framework/Resources/etc/Makeconf"
            ]);
        }
        catch (error) {
            core.debug(`${error}`);
            throw `Failed to remove OpenMP flags: ${error}`;
        }
    });
}
function acquireRUbuntu(version) {
    return __awaiter(this, void 0, void 0, function* () {
        //
        // Download - a tool installer intimately knows how to get the tool (and construct urls)
        //
        let downloadUrl = version.url;
        let fileName = path.basename(downloadUrl);
        let downloadPath = null;
        core.startGroup('Downloading R');
        try {
            downloadPath = yield tc.downloadTool(downloadUrl);
            yield io.mv(downloadPath, path.join(tempDirectory, fileName));
        }
        catch (error) {
            core.debug(`${error}`);
            throw `Failed to download version ${version}: ${error}`;
        }
        core.endGroup();
        //
        // Install
        //
        let extPath = tempDirectory;
        if (!extPath) {
            throw new Error("Temp directory not set");
        }
        try {
            yield core.group('Updating system package data', () => __awaiter(this, void 0, void 0, function* () {
                yield exec.exec("sudo DEBIAN_FRONTEND=noninteractive apt-get update -y -qq");
            }));
            // install gdbi-core and also qpdf, which is used by `--as-cran`
            yield core.group('Installing R system requirements', () => __awaiter(this, void 0, void 0, function* () {
                yield exec.exec("sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gdebi-core qpdf devscripts ghostscript");
            }));
            yield core.group("Installing R", () => __awaiter(this, void 0, void 0, function* () {
                yield exec.exec("sudo gdebi", [
                    "--non-interactive",
                    path.join(tempDirectory, fileName)
                ]);
            }));
        }
        catch (error) {
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
            yield exec.exec("sudo ln", [
                "-sf",
                path.join("/opt", "R", rdir, "bin", "R"),
                "/usr/local/bin/R"
            ]);
            yield exec.exec("sudo ln", [
                "-sf",
                path.join("/opt", "R", rdir, "bin", "Rscript"),
                "/usr/local/bin/Rscript"
            ]);
        }
        catch (error) {
            core.debug(`${error}`);
            throw `Failed to setup symlinks to R: ${error}`;
        }
        return "/usr/local/bin";
    });
}
function acquireRMacOS(version) {
    return __awaiter(this, void 0, void 0, function* () {
        //
        // Download - a tool installer intimately knows how to get the tool (and construct urls)
        //
        let downloadUrl = version.url;
        let fileName = path.basename(downloadUrl);
        let downloadPath = null;
        try {
            downloadPath = yield tc.downloadTool(downloadUrl);
            yield io.mv(downloadPath, path.join(tempDirectory, fileName));
        }
        catch (error) {
            core.debug(`${error}`);
            throw `Failed to download version ${version}: ${error}`;
        }
        //
        // Extract
        //
        let extPath = tempDirectory;
        if (!extPath) {
            throw new Error("Temp directory not set");
        }
        try {
            yield exec.exec("sudo", [
                "installer",
                "-allowUntrusted",
                "-dumplog",
                "-pkg",
                path.join(tempDirectory, fileName),
                "-target",
                "/"
            ]);
        }
        catch (error) {
            core.debug(`${error}`);
            throw `Failed to install R: ${error}`;
        }
        // Remove homebrew R from the PATH
        try {
            yield exec.exec("brew", ["unlink", "r"]);
        }
        catch (error) {
            core.debug(`${error}`);
        }
        // Older R versions on newer macOS cannot create a symlink to R and
        // Rscript, we'll need to do it manually.
        try {
            yield exec.exec("sudo ln", [
                "-sfv",
                "/Library/Frameworks/R.framework/Resources/bin/R",
                "/usr/local/bin/R"
            ]);
            yield exec.exec("sudo ln", [
                "-sfv",
                "/Library/Frameworks/R.framework/Resources/bin/Rscript",
                "/usr/local/bin/Rscript"
            ]);
        }
        catch (error) {
            core.debug(`${error}`);
            core.debug("Marching on despite failed symlink creation.");
        }
        return "/";
    });
}
function acquireRWindows(version) {
    return __awaiter(this, void 0, void 0, function* () {
        let fileName = path.basename(version.url);
        let downloadPath = null;
        try {
            downloadPath = yield tc.downloadTool(version.url);
            yield io.mv(downloadPath, path.join(tempDirectory, fileName));
        }
        catch (error) {
            core.debug(`${error}`);
            throw `Failed to download version ${version}: ${error}`;
        }
        //
        // Install
        //
        let extPath = tempDirectory;
        if (!extPath) {
            throw new Error("Temp directory not set");
        }
        try {
            yield exec.exec(path.join(tempDirectory, fileName), [
                "/VERYSILENT",
                "/SUPPRESSMSGBOXES",
                "/DIR=C:\\R"
            ]);
        }
        catch (error) {
            core.debug(`${error}`);
            throw `Failed to install R: ${error}`;
        }
        core.addPath(`C:\\R\\bin`);
        return "";
    });
}
function getRtoolsUrl(version) {
    if (version == "44" && ARCH == "arm64") {
        return "https://github.com/r-hub/rtools44/releases/download/latest/rtools44-aarch64.exe";
    }
    else if (version == "44") {
        return "https://github.com/r-hub/rtools44/releases/download/latest/rtools44.exe";
    }
    else if (version == "43") {
        return "https://github.com/r-hub/rtools43/releases/download/latest/rtools43.exe";
    }
    else if (version == "42") {
        return "https://github.com/r-hub/rtools42/releases/download/latest/rtools42.exe";
    }
    else if (version == "40") {
        return "https://cran.rstudio.com/bin/windows/Rtools/rtools40-x86_64.exe";
    }
    else {
        return `https://cran.rstudio.com/bin/windows/Rtools/Rtools${version}.exe`;
    }
}
function acquireRtools(version) {
    return __awaiter(this, void 0, void 0, function* () {
        var rtoolsVersion = "", downloadUrl = "";
        const inpver = core.getInput("rtools-version");
        if (inpver == "none") {
            console.log("Skipping RTools installation, as requested");
            return;
        }
        else if (inpver == "") {
            rtoolsVersion = version.rtools || 'error';
            ;
            downloadUrl = version.rtools_url || 'error';
        }
        else {
            rtoolsVersion = inpver;
            downloadUrl = getRtoolsUrl(rtoolsVersion);
        }
        const versionNumber = parseInt(rtoolsVersion || 'error');
        const rtools44 = versionNumber >= 44;
        const rtools43 = !rtools44 && versionNumber >= 43;
        const rtools42 = !rtools44 && !rtools43 && versionNumber >= 41;
        const rtools40 = !rtools44 && !rtools43 && !rtools42 && versionNumber >= 40;
        const rtools3x = !rtools44 && !rtools43 && !rtools42 && !rtools40;
        var fileName = path.basename(downloadUrl);
        // If Rtools is already installed just return, as there is a message box
        // which hangs the build otherwise.
        if ((rtools44 && fs.existsSync("C:\\Rtools44")) ||
            (rtools43 && fs.existsSync("C:\\Rtools43")) ||
            (rtools42 && fs.existsSync("C:\\Rtools42")) ||
            (rtools40 && fs.existsSync("C:\\Rtools40")) ||
            (rtools3x && fs.existsSync("C:\\Rtools"))) {
            core.debug("Skipping Rtools installation as a suitable Rtools is already installed");
        }
        else {
            console.log(`Downloading ${downloadUrl}...`);
            let downloadPath = null;
            try {
                downloadPath = yield tc.downloadTool(downloadUrl);
                yield io.mv(downloadPath, path.join(tempDirectory, fileName));
            }
            catch (error) {
                core.debug(`${error}`);
                throw `Failed to download version ${version}: ${error}`;
            }
            try {
                yield exec.exec(path.join(tempDirectory, fileName), [
                    "/VERYSILENT",
                    "/SUPPRESSMSGBOXES"
                ]);
            }
            catch (error) {
                core.debug(`${error}`);
                throw `Failed to install Rtools: ${error}`;
            }
        }
        // we never want patches (by default)
        let addpath = core.getInput("windows-path-include-rtools") === "true";
        core.exportVariable("_R_INSTALL_TIME_PATCHES_", "no");
        if (rtools44) {
            if (addpath) {
                if (ARCH == "arm64") {
                    core.addPath(`C:\\rtools44-aarch64\\usr\\bin`);
                    core.addPath(`C:\\rtools44-aarch64\\aarch64-w64-mingw32.static.posix\\bin`);
                }
                else {
                    core.addPath(`C:\\rtools44\\usr\\bin`);
                    core.addPath(`C:\\rtools44\\x86_64-w64-mingw32.static.posix\\bin`);
                }
            }
        }
        else if (rtools43) {
            if (addpath) {
                core.addPath(`C:\\rtools43\\usr\\bin`);
                core.addPath(`C:\\rtools43\\x86_64-w64-mingw32.static.posix\\bin`);
            }
        }
        else if (rtools42) {
            if (addpath) {
                core.addPath(`C:\\rtools42\\usr\\bin`);
                core.addPath(`C:\\rtools42\\x86_64-w64-mingw32.static.posix\\bin`);
            }
        }
        else if (rtools40) {
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
                    yield exec.exec("c:\\rtools40\\usr\\bin\\bash.exe", [
                        "--login",
                        "-c",
                        "pacman -Syu --noconfirm"
                    ]);
                }
                catch (error) {
                    core.debug(`${error}`);
                    throw `Failed to update rtools40 libraries: ${error}`;
                }
            }
        }
        else { // rtools3x
            if (addpath) {
                core.addPath(`C:\\Rtools\\bin`);
                if (core.getInput("windows-path-include-mingw") === "true") {
                    core.addPath(`C:\\Rtools\\mingw_64\\bin`);
                }
            }
        }
    });
}
function acquireQpdfWindows() {
    return __awaiter(this, void 0, void 0, function* () {
        yield core.group("Downloading and installing qpdf", () => __awaiter(this, void 0, void 0, function* () {
            const dlpath = yield tc.downloadTool("https://github.com/r-lib/actions/releases/download/sysreqs0/qpdf.nupkg");
            yield io.mv(dlpath, path.join(tempDirectory, "qpdf.nupkg"));
            yield exec.exec("choco", ["install", "qpdf", "--source", tempDirectory]);
        }));
    });
}
function acquireGsWindows() {
    return __awaiter(this, void 0, void 0, function* () {
        yield core.group("Downloading and installing Ghostscript", () => __awaiter(this, void 0, void 0, function* () {
            const dlpath = yield tc.downloadTool("https://github.com/r-lib/actions/releases/download/sysreqs0/ghostscript-10.03.0-win.zip");
            const extractionPath = yield tc.extractZip(dlpath);
            yield io.mv(extractionPath, "c:/program files/gs");
        }));
    });
}
function setupRLibrary() {
    return __awaiter(this, void 0, void 0, function* () {
        let profilePath;
        if (IS_WINDOWS) {
            profilePath = path.join(process.env["USERPROFILE"] || "C:\\", "Documents", ".Rprofile");
        }
        else {
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
                    yield exec.exec("lsb_release", ["--short", "--codename"], {
                        listeners: {
                            stdout: (data) => (codename += data.toString())
                        }
                    });
                }
                catch (error) {
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
            "https://cran.rstudio.com"}'`;
        let user_agent;
        if (core.getInput("http-user-agent") === "release") {
            let os = IS_WINDOWS ? "win" : IS_MAC ? "macos" : "tarball";
            let version = yield getReleaseVersion(os);
            user_agent = `sprintf("R/${version} R (${version} %s) on GitHub Actions", paste(R.version$platform, R.version$arch, R.version$os))`;
        }
        else {
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
        yield fs.promises.writeFile(profilePath, `Sys.setenv("PKGCACHE_HTTP_VERSION" = "2")
options(
  repos = c(
    RSPM = ${rspm},
    CRAN = ${cran}${extra_repositories}
  ),
  Ncpus = ${core.getInput("Ncpus")},
  HTTPUserAgent = ${user_agent}
)\n`);
        // Make R_LIBS_USER
        io.mkdirP(process.env["R_LIBS_USER"] || path.join(tempDirectory, "Library"));
    });
}
function getLinuxPlatform() {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.SETUP_R_LINUX_PLATFORM) {
            return process.env.SETUP_R_LINUX_PLATFORM;
        }
        else {
            const info = yield (0, linux_os_info_1.default)();
            return "linux-" + info.id + "-" + info.version_id;
        }
    });
}
function setREnvironmentVariables() {
    core.exportVariable("R_LIBS_USER", path.join(tempDirectory, "Library"));
    core.exportVariable("TZ", "UTC");
    core.exportVariable("_R_CHECK_SYSTEM_CLOCK_", "FALSE");
    if (!process.env["NOT_CRAN"])
        core.exportVariable("NOT_CRAN", "true");
}
// Need to keep this for setting the HTTP User-Agent header to
// R-release for RSPM
function getReleaseVersion(platform) {
    return __awaiter(this, void 0, void 0, function* () {
        let rest = new restm.RestClient("setup-r");
        let tags = (yield rest.get(util.format("https://api.r-hub.io/rversions/r-release-%s", platform))).result || { version: "" };
        return tags.version;
    });
}
function determineVersion(version) {
    return __awaiter(this, void 0, void 0, function* () {
        // A temporary hack to make these work
        if (version == "latest" || version == "4" || version == "4.x" || version == "4.x.x") {
            version = "release";
        }
        else if (version == "3" || version == "3.x" || version == "3.x.x") {
            version = "3.6.3";
        }
        else if (version.endsWith(".x")) {
            version = version.replace(/[.]x$/, "");
        }
        if (version.startsWith("oldrel-")) {
            version = version.replace(/^oldrel[-]/, "oldrel/");
        }
        let rest = new restm.RestClient("setup-r");
        let os = OS != "linux" ? OS : yield getLinuxPlatform();
        let url = "https://api.r-hub.io/rversions/resolve/" +
            version + "/" + os;
        if (ARCH) {
            url = url + "/" + ARCH;
        }
        let tags = (yield rest.get(url)).result;
        if (!tags) {
            throw new Error(`Failed to resolve R version ${version} at ${url}.`);
        }
        return tags;
    });
}
exports.determineVersion = determineVersion;
