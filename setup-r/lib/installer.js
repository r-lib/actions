"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.getR = void 0;
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
        if (selected) {
            version = selected;
        }
        // this works for 'next' and 'devel' as well, currently.
        let rtoolsVersion = core.getInput("rtools-version") || (version.charAt(0) == "3" ? "35" : "40");
        let toolPath = tc.find("R", version);
        if (toolPath) {
            core.debug(`Tool found in cache ${toolPath}`);
        }
        else {
            try {
                yield acquireR(version, rtoolsVersion);
            }
            catch (error) {
                core.debug(`${error}`);
                throw `Failed to get R ${version}: ${error}`;
            }
        }
        setREnvironmentVariables();
        setupRLibrary();
        core.setOutput("installed-r-version", version);
    });
}
exports.getR = getR;
function acquireR(version, rtoolsVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        if (core.getInput("install-r") !== "true") {
            return;
        }
        try {
            if (IS_WINDOWS) {
                yield Promise.all([
                    yield acquireRWindows(version),
                    yield acquireRtools(rtoolsVersion),
                ]);
            }
            else if (IS_MAC) {
                yield core.group('Downloading gfortran', () => __awaiter(this, void 0, void 0, function* () { yield acquireFortranMacOS(); }));
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
            throw `Failed to get R ${version}: ${error}`;
        }
        if (IS_WINDOWS) {
            const rtoolsVersionNumber = parseInt(rtoolsVersion.substring(0, 2));
            const rtools42 = rtoolsVersionNumber >= 41;
            if (rtools42) {
                var tries_left = 10;
                var ok = false;
                while (!ok && tries_left > 0) {
                    try {
                        yield acquireQpdfWindows();
                        ok = true;
                    }
                    catch (error) {
                        core.warning("Failed to download qpdf: ${error}");
                        yield new Promise(f => setTimeout(f, 10000));
                        tries_left = tries_left - 1;
                    }
                }
                if (!ok) {
                    throw `Failed to get qpdf in 10 tries :(`;
                }
            }
        }
    });
}
function acquireFortranMacOS() {
    return __awaiter(this, void 0, void 0, function* () {
        let gfortran = "gfortran-8.2-Mojave";
        let mntPath = path.join("/Volumes", gfortran);
        let fileName = `${gfortran}.dmg`;
        let downloadUrl = `https://mac.r-project.org/tools/${fileName}`;
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
            yield exec.exec("brew", ["install", "qpdf", "pkgconfig", "checkbashisms"]);
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
        let fileName = getFileNameUbuntu(version);
        let downloadUrl = getDownloadUrlUbuntu(fileName);
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
                yield exec.exec("sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gdebi-core qpdf devscripts");
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
        try {
            yield exec.exec("sudo ln", [
                "-sf",
                path.join("/opt", "R", version, "bin", "R"),
                "/usr/local/bin/R"
            ]);
            yield exec.exec("sudo ln", [
                "-sf",
                path.join("/opt", "R", version, "bin", "Rscript"),
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
        let fileName = getFileNameMacOS(version);
        let downloadUrl = yield getDownloadUrlMacOS(version);
        let downloadPath = null;
        try {
            if (downloadUrl == "") {
                throw ("Cannot determine download URL");
            }
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
        // Older R versions on newer macOS cannot create a symlink to R and
        // Rscript, we'll need to do it manually.
        try {
            yield exec.exec("sudo ln", [
                "-sf",
                "/Library/Frameworks/R.framework/Resources/bin/R",
                "/usr/local/bin/R"
            ]);
            yield exec.exec("sudo ln", [
                "-sf",
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
        let fileName = getFileNameWindows(version);
        let downloadUrl = yield getDownloadUrlWindows(version);
        let downloadPath = null;
        try {
            if (downloadUrl == "") {
                throw ("Cannot determine download URL");
            }
            downloadPath = yield tc.downloadTool(downloadUrl);
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
function acquireRtools(version) {
    return __awaiter(this, void 0, void 0, function* () {
        const versionNumber = parseInt(version.substring(0, 2));
        const rtools42 = versionNumber >= 41;
        const rtools40 = !rtools42 && versionNumber >= 40;
        const rtools3x = !rtools42 && !rtools40;
        var downloadUrl, fileName;
        if (rtools3x) {
            fileName = util.format("Rtools%s.exe", version);
            downloadUrl = util.format("http://cloud.r-project.org/bin/windows/Rtools/%s", fileName);
        }
        else if (rtools40) {
            fileName = util.format("rtools%s-x86_64.exe", version);
            downloadUrl = util.format("http://cloud.r-project.org/bin/windows/Rtools/%s", fileName);
        }
        else { // rtools42
            fileName = "rtools42-5038-5046.exe";
            downloadUrl = "https://github.com/gaborcsardi/Rtools42/releases/download/5038-5046/rtools42-5038-5046.exe";
        }
        // If Rtools is already installed just return, as there is a message box
        // which hangs the build otherwise.
        if ((rtools42 && fs.existsSync("C:\\Rtools42")) ||
            (rtools40 && fs.existsSync("C:\\rtools40")) ||
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
        if (rtools42) {
            core.addPath(`C:\\rtools42\\usr\\bin`);
            core.addPath(`C:\\rtools42\\x86_64-w64-mingw32.static.posix\\bin`);
        }
        else if (rtools40) {
            core.addPath(`C:\\rtools40\\usr\\bin`);
            if (core.getInput("r-version").match("devel")) {
                core.addPath(`C:\\rtools40\\ucrt64\\bin`);
                core.exportVariable("_R_INSTALL_TIME_PATCHES_", "no");
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
            core.addPath(`C:\\Rtools\\bin`);
            if (core.getInput("windows-path-include-mingw") === "true") {
                core.addPath(`C:\\Rtools\\mingw_64\\bin`);
            }
        }
    });
}
function acquireQpdfWindows() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield exec.exec("choco", ["install", "qpdf", "--no-progress"]);
        }
        catch (error) {
            core.debug(`${error}`);
            throw `Failed to install qpdf: ${error}`;
        }
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
                rspm = "'https://packagemanager.rstudio.com/all/latest'";
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
                rspm = `'https://packagemanager.rstudio.com/all/__linux__/${codename}/latest'`;
            }
        }
        if (rspm !== "NULL") {
            core.exportVariable("RSPM", rspm.replace(/^'|'$/g, ""));
        }
        let cran = `'${core.getInput("cran") ||
            process.env["CRAN"] ||
            "https://cloud.r-project.org"}'`;
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
function getFileNameMacOS(version) {
    const filename = util.format("R-%s.pkg", version);
    return filename;
}
function getDownloadUrlMacOS(version) {
    return __awaiter(this, void 0, void 0, function* () {
        if (version == "devel") {
            return "https://mac.R-project.org/high-sierra/last-success/R-devel-x86_64.pkg";
        }
        if (version == "next" || version == "prerelease") {
            return getDownloadUrlMacOSNext();
        }
        const filename = getFileNameMacOS(version);
        if (semver.eq(version, "3.2.5")) {
            // 3.2.5 is 'special', it is actually 3.2.4-revised...
            return "https://cloud.r-project.org/bin/macosx/old/R-3.2.4-revised.pkg";
        }
        if (semver.lt(version, "3.4.0")) {
            // older versions are in /old
            return util.format("https://cloud.r-project.org/bin/macosx/old/%s", filename);
        }
        if (semver.lt(version, "4.0.0")) {
            // older versions are in el-capitan/base
            return util.format("https://cloud.r-project.org/bin/macosx/el-capitan/base/%s", filename);
        }
        // 4.0.0+ are in base/
        return util.format("https://cloud.r-project.org/bin/macosx/base/%s", filename);
    });
}
function getFileNameUbuntu(version) {
    const filename = util.format("r-%s_1_amd64.deb", version);
    return filename;
}
function getDownloadUrlUbuntu(filename) {
    try {
        const info = (0, linux_os_info_1.default)({ mode: "sync" });
        const versionStr = info.version_id.replace(/[.]/g, "");
        return util.format("https://cdn.rstudio.com/r/ubuntu-%s/pkgs/%s", versionStr, filename);
    }
    catch (error) {
        throw `Failed to get OS info: ${error}`;
    }
}
function getFileNameWindows(version) {
    const filename = util.format("R-%s-win.exe", version);
    return filename;
}
function getDownloadUrlWindows(version) {
    return __awaiter(this, void 0, void 0, function* () {
        if (version == "devel") {
            return "https://cloud.r-project.org/bin/windows/base/R-devel-win.exe";
        }
        if (version == "next" || version == "prerelease") {
            return getDownloadUrlWindowsNext();
        }
        const filename = getFileNameWindows(version);
        const releaseVersion = yield getReleaseVersion("win");
        if (version == releaseVersion) {
            return util.format("https://cloud.r-project.org/bin/windows/base/%s", filename);
        }
        return util.format("https://cloud.r-project.org/bin/windows/base/old/%s/%s", version, filename);
    });
}
function setREnvironmentVariables() {
    core.exportVariable("R_LIBS_USER", path.join(tempDirectory, "Library"));
    core.exportVariable("TZ", "UTC");
    core.exportVariable("_R_CHECK_SYSTEM_CLOCK_", "FALSE");
    if (!process.env["NOT_CRAN"])
        core.exportVariable("NOT_CRAN", "true");
}
function getReleaseVersion(platform) {
    return __awaiter(this, void 0, void 0, function* () {
        let rest = new restm.RestClient("setup-r");
        let tags = (yield rest.get(util.format("https://api.r-hub.io/rversions/r-release-%s", platform))).result || { version: "" };
        return tags.version;
    });
}
function getOldrelVersion(version) {
    return __awaiter(this, void 0, void 0, function* () {
        let rest = new restm.RestClient("setup-r");
        let tags = (yield rest.get(util.format("https://api.r-hub.io/rversions/r-oldrel/%s", version))).result || { version: "" };
        return tags.version;
    });
}
function getAvailableVersions() {
    return __awaiter(this, void 0, void 0, function* () {
        let rest = new restm.RestClient("setup-r");
        let tags = (yield rest.get("https://api.r-hub.io/rversions/r-versions"))
            .result || [];
        return tags.map(tag => tag.version);
    });
}
function determineVersion(version) {
    return __awaiter(this, void 0, void 0, function* () {
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
                return yield getLatestVersion(version.concat(".x"));
            }
            else {
                // This is also 'next' and 'devel'
                return version;
            }
        }
        return yield getLatestVersion(version);
    });
}
// This function is required to convert the version 1.10 to 1.10.0.
// Because caching utility accept only sementic version,
// which have patch number as well.
function normalizeVersion(version) {
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
function getPossibleVersions(version) {
    return __awaiter(this, void 0, void 0, function* () {
        const versions = yield getAvailableVersions();
        const possibleVersions = versions.filter(v => v.startsWith(version));
        const versionMap = new Map();
        possibleVersions.forEach(v => versionMap.set(normalizeVersion(v), v));
        return Array.from(versionMap.keys())
            .sort(semver.rcompare)
            .map(v => versionMap.get(v));
    });
}
function getLatestVersion(version) {
    return __awaiter(this, void 0, void 0, function* () {
        // clean .x syntax: 1.10.x -> 1.10
        const trimmedVersion = version.slice(0, version.length - 2);
        const versions = yield getPossibleVersions(trimmedVersion);
        core.debug(`evaluating ${versions.length} versions`);
        if (version.length === 0) {
            throw new Error("unable to get latest version");
        }
        core.debug(`matched: ${versions[0]}`);
        return versions[0];
    });
}
function getDownloadUrlWindowsNext() {
    return __awaiter(this, void 0, void 0, function* () {
        let rest = new restm.RestClient("setup-r");
        let tags = (yield rest.get("https://api.r-hub.io/rversions/r-next-win")).result || { URL: "" };
        return tags.URL;
    });
}
function getDownloadUrlMacOSNext() {
    return __awaiter(this, void 0, void 0, function* () {
        let rest = new restm.RestClient("setup-r");
        let tags = (yield rest.get("https://api.r-hub.io/rversions/r-next-macos")).result || { URL: "" };
        return tags.URL;
    });
}
