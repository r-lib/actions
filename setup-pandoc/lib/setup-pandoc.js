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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPandoc = void 0;
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
    if (IS_WINDOWS) {
        return installPandocWindows(version);
    }
    else if (IS_MAC) {
        return installPandocMac(version);
    }
    else {
        return installPandocLinux(version);
    }
}
exports.getPandoc = getPandoc;
function installPandocMac(version) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileName = util.format("pandoc-%s-macOS.pkg", version);
        const downloadUrl = util.format("https://github.com/jgm/pandoc/releases/download/%s/%s", version, fileName);
        let downloadPath;
        try {
            downloadPath = yield tc.downloadTool(downloadUrl);
        }
        catch (error) {
            throw `Failed to download Pandoc ${version}: ${error}`;
        }
        yield io.mv(downloadPath, path.join(tempDirectory, fileName));
        exec.exec("sudo installer", [
            "-allowUntrusted",
            "-dumplog",
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
        let downloadPath;
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
    if ((0, compare_versions_1.compare)(version, "2.9.2", ">=")) {
        return util.format("pandoc-%s", version);
    }
    if ((0, compare_versions_1.compare)(version, "2.9.1", "=")) {
        return "";
    }
    return util.format("pandoc-%s-windows-x86_64", version);
}
function installPandocLinux(version) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileName = util.format("pandoc-%s-1-amd64.deb", version);
        const downloadUrl = util.format("https://github.com/jgm/pandoc/releases/download/%s/%s", version, fileName);
        let downloadPath;
        try {
            console.log("::group::Download pandoc");
            downloadPath = yield tc.downloadTool(downloadUrl);
        }
        catch (error) {
            throw `Failed to download Pandoc ${version}: ${error}`;
        }
        yield io.mv(downloadPath, path.join(tempDirectory, fileName));
        try {
            console.log("::group::Install gdebi-core");
            yield exec.exec("sudo apt-get", ["install", "-yqq", "gdebi-core"]);
            console.log("::group::Install pandoc");
            yield exec.exec("sudo gdebi", [
                "--non-interactive",
                path.join(tempDirectory, fileName)
            ]);
        }
        catch (error) {
            core.debug(error);
            throw `Failed to install pandoc: ${error}`;
        }
        console.log("::endgroup::");
    });
}
run();
