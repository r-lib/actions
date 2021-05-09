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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
                core.debug(error);
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
                    acquireRWindows(version),
                    acquireRtools(rtoolsVersion),
                    acquireQpdfWindows()
                ]);
            }
            else if (IS_MAC) {
                yield Promise.all([
                    acquireFortranMacOS(),
                    acquireUtilsMacOS(),
                    acquireRMacOS(version)
                ]);
                if (core.getInput("remove-openmp-macos") === "true") {
                    yield removeOpenmpFlags();
                }
            }
            else {
                yield acquireRUbuntu(version);
            }
        }
        catch (error) {
            core.debug(error);
            throw `Failed to get R ${version}: ${error}`;
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
            core.debug(error);
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
            core.debug(error);
            throw `Failed to mount ${fileName}: ${error}`;
        }
        try {
            yield exec.exec("sudo", [
                "installer",
                "-package",
                path.join(mntPath, gfortran, "gfortran.pkg"),
                "-target",
                "/"
            ]);
        }
        catch (error) {
            core.debug(error);
            throw `Failed to install gfortran: ${error}`;
        }
        try {
            yield exec.exec("sudo", ["hdiutil", "detach", mntPath]);
        }
        catch (error) {
            core.debug(error);
            throw `Failed to umount ${mntPath}: ${error}`;
        }
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
            core.debug(error);
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
            core.debug(error);
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
        try {
            downloadPath = yield tc.downloadTool(downloadUrl);
            yield io.mv(downloadPath, path.join(tempDirectory, fileName));
        }
        catch (error) {
            core.debug(error);
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
            // Important backports needed for CRAN packages, including libgit2
            yield exec.exec("sudo DEBIAN_FRONTEND=noninteractive add-apt-repository -y ppa:cran/travis");
            yield exec.exec("sudo DEBIAN_FRONTEND=noninteractive apt-get update -y -qq");
            // install gdbi-core and also qpdf, which is used by `--as-cran`
            yield exec.exec("sudo DEBIAN_FRONTEND=noninteractive apt-get install -y gdebi-core qpdf devscripts");
            yield exec.exec("sudo gdebi", [
                "--non-interactive",
                path.join(tempDirectory, fileName)
            ]);
        }
        catch (error) {
            core.debug(error);
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
            core.debug(error);
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
        let downloadUrl = getDownloadUrlMacOS(version);
        let downloadPath = null;
        try {
            downloadPath = yield tc.downloadTool(downloadUrl);
            yield io.mv(downloadPath, path.join(tempDirectory, fileName));
        }
        catch (error) {
            core.debug(error);
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
                "-pkg",
                path.join(tempDirectory, fileName),
                "-target",
                "/"
            ]);
        }
        catch (error) {
            core.debug(error);
            throw `Failed to install R: ${error}`;
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
            downloadPath = yield tc.downloadTool(downloadUrl);
            yield io.mv(downloadPath, path.join(tempDirectory, fileName));
        }
        catch (error) {
            core.debug(error);
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
            core.debug(error);
            throw `Failed to install R: ${error}`;
        }
        core.addPath(`C:\\R\\bin`);
        return "";
    });
}
function acquireRtools(version) {
    return __awaiter(this, void 0, void 0, function* () {
        const rtools4 = version.charAt(0) == "4";
        let fileName = util.format(rtools4 ? "rtools%s-x86_64.exe" : "Rtools%s.exe", version);
        // If Rtools is already installed just return, as there is a message box
        // which hangs the build otherwise.
        if ((!rtools4 && fs.existsSync("C:\\Rtools")) ||
            (rtools4 && fs.existsSync("C:\\rtools40"))) {
            core.debug("Skipping Rtools installation as a suitable Rtools is already installed");
        }
        else {
            let downloadUrl = util.format("http://cloud.r-project.org/bin/windows/Rtools/%s", fileName);
            console.log(`Downloading ${downloadUrl}...`);
            let downloadPath = null;
            try {
                downloadPath = yield tc.downloadTool(downloadUrl);
                yield io.mv(downloadPath, path.join(tempDirectory, fileName));
            }
            catch (error) {
                core.debug(error);
                throw `Failed to download version ${version}: ${error}`;
            }
            try {
                yield exec.exec(path.join(tempDirectory, fileName), [
                    "/VERYSILENT",
                    "/SUPPRESSMSGBOXES"
                ]);
            }
            catch (error) {
                core.debug(error);
                throw `Failed to install Rtools: ${error}`;
            }
        }
        if (rtools4) {
            core.addPath(`C:\\rtools40\\usr\\bin`);
            if (core.getInput("windows-path-include-mingw") === "true") {
                core.addPath(`C:\\rtools40\\mingw64\\bin`);
            }
            if (core.getInput("update-rtools") === "true") {
                try {
                    yield exec.exec("c:\\rtools40\\usr\\bin\\bash.exe", ["--login", "-c", "pacman -Syu --noconfirm"]);
                }
                catch (error) {
                    core.debug(error);
                    throw `Failed to update rtools40 libraries: ${error}`;
                }
            }
        }
        else {
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
            core.debug(error);
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
        let cran = `'${process.env["CRAN"] || "https://cloud.r-project.org"}'`;
        let user_agent = core.getInput("http-user-agent") === "default" ||
            core.getInput("http-user-agent") === ""
            ? 'sprintf("R/%s R (%s) on GitHub Actions", getRversion(), paste(getRversion(), R.version$platform, R.version$arch, R.version$os))'
            : `"${core.getInput("http-user-agent")}"`;
        yield fs.promises.writeFile(profilePath, `options(\
       repos = c(\
         RSPM = ${rspm},\
         CRAN = ${cran}\
       ),\
       crayon.enabled = ${core.getInput("crayon.enabled")},\
       Ncpus = ${core.getInput("Ncpus")},\
       HTTPUserAgent = ${user_agent}\
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
    if (version == "devel") {
        return "https://mac.r-project.org/high-sierra/R-devel/R-devel.pkg";
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
}
function getFileNameUbuntu(version) {
    const filename = util.format("r-%s_1_amd64.deb", version);
    return filename;
}
function getDownloadUrlUbuntu(filename) {
    try {
        const info = linux_os_info_1.default({ mode: "sync" });
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
function determineVersion(version) {
    return __awaiter(this, void 0, void 0, function* () {
        // There is no linux endpoint, so we just use the tarball one for linux.
        version = version.toLowerCase();
        if (version == "latest" || version == "release") {
            let platform = IS_MAC ? "macos" : IS_WINDOWS ? "win" : "tarball";
            return yield getReleaseVersion(platform);
        }
        if (version == "oldrel") {
            return yield getOldrelVersion();
        }
        if (!version.endsWith(".x")) {
            const versionPart = version.split(".");
            if (versionPart[1] == null || versionPart[2] == null) {
                return yield getLatestVersion(version.concat(".x"));
            }
            else {
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
function getReleaseVersion(platform) {
    return __awaiter(this, void 0, void 0, function* () {
        let rest = new restm.RestClient("setup-r");
        let tags = (yield rest.get(util.format("https://rversions.r-pkg.org/r-release-%s", platform))).result || [];
        return tags[0].version;
    });
}
function getOldrelVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        let rest = new restm.RestClient("setup-r");
        let tags = (yield rest.get("https://rversions.r-pkg.org/r-oldrel")).result ||
            [];
        return tags[0].version;
    });
}
function getAvailableVersions() {
    return __awaiter(this, void 0, void 0, function* () {
        let rest = new restm.RestClient("setup-r");
        let tags = (yield rest.get("https://rversions.r-pkg.org/r-versions"))
            .result || [];
        return tags.map(tag => tag.version);
    });
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
