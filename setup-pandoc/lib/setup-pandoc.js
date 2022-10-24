"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
let tempDirectory = process.env["RUNNER_TEMP"] || "";
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const io = __importStar(require("@actions/io"));
const tc = __importStar(require("@actions/tool-cache"));
const path = __importStar(require("path"));
const util = __importStar(require("util"));
const compare_versions_1 = require("compare-versions");
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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("::warning r-lib/actions/setup-pandoc@v1 is deprecated. Please update your workflow to use the '@v2' version.");
        try {
            let pandocVersion = core.getInput("pandoc-version");
            core.debug(`got pandoc-version ${pandocVersion}`);
            yield getPandoc(pandocVersion);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
function getPandoc(version) {
    return __awaiter(this, void 0, void 0, function* () {
        if (IS_WINDOWS) {
            installPandocWindows(version);
        }
        else if (IS_MAC) {
            installPandocMac(version);
        }
        else {
            installPandocLinux(version);
        }
    });
}
exports.getPandoc = getPandoc;
function installPandocMac(version) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileName = util.format("pandoc-%s-macOS.pkg", version);
        const downloadUrl = util.format("https://github.com/jgm/pandoc/releases/download/%s/%s", version, fileName);
        let downloadPath = null;
        try {
            downloadPath = yield tc.downloadTool(downloadUrl);
        }
        catch (error) {
            throw `Failed to download Pandoc ${version}: ${error}`;
        }
        yield io.mv(downloadPath, path.join(tempDirectory, fileName));
        exec.exec("sudo installer", [
            "-pkg",
            path.join(tempDirectory, fileName),
            "-target",
            "/"
        ]);
    });
}
function installPandocWindows(version) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileName = util.format("pandoc-%s-windows-x86_64.zip", version);
        const downloadUrl = util.format("https://github.com/jgm/pandoc/releases/download/%s/%s", version, fileName);
        let downloadPath = null;
        try {
            downloadPath = yield tc.downloadTool(downloadUrl);
        }
        catch (error) {
            throw `Failed to download Pandoc ${version}: ${error}`;
        }
        //
        // Extract
        //
        let extPath = tempDirectory;
        if (!extPath) {
            throw new Error("Temp directory not set");
        }
        extPath = yield tc.extractZip(downloadPath);
        const toolPath = yield tc.cacheDir(extPath, "pandoc", version);
        // It extracts to this folder
        const toolRoot = path.join(toolPath, pandocSubdir(version));
        core.addPath(toolRoot);
    });
}
function pandocSubdir(version) {
    if (compare_versions_1.compare(version, "2.9.2", ">=")) {
        return util.format("pandoc-%s", version);
    }
    if (compare_versions_1.compare(version, "2.9.1", "=")) {
        return "";
    }
    return util.format("pandoc-%s-windows-x86_64", version);
}
function installPandocLinux(version) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileName = util.format("pandoc-%s-1-amd64.deb", version);
        const downloadUrl = util.format("https://github.com/jgm/pandoc/releases/download/%s/%s", version, fileName);
        let downloadPath = null;
        try {
            downloadPath = yield tc.downloadTool(downloadUrl);
        }
        catch (error) {
            throw `Failed to download Pandoc ${version}: ${error}`;
        }
        yield io.mv(downloadPath, path.join(tempDirectory, fileName));
        try {
            yield exec.exec("sudo apt-get", ["install", "-y", "gdebi-core"]);
            yield exec.exec("sudo gdebi", [
                "--non-interactive",
                path.join(tempDirectory, fileName)
            ]);
        }
        catch (error) {
            core.debug(error);
            throw `Failed to install pandoc: ${error}`;
        }
    });
}
run();
