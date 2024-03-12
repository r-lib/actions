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
const fs = __importStar(require("fs"));
const compare_versions_1 = require("compare-versions");
const http_client_1 = require("@actions/http-client");
const action_1 = require("@octokit/action");
const IS_WINDOWS = process.platform === "win32";
const IS_MAC = process.platform === "darwin";
const OS = !!process.env.SETUP_R_OS ? process.env.SETUP_R_OS :
    IS_WINDOWS ? "win" : IS_MAC ? "mac" : "linux";
const ARCH = !!process.env.SETUP_R_ARCH ? process.env.SETUP_R_ARCH :
    OS == "win" ? undefined :
        (OS == "mac" && process.arch == "arm64") ? "arm64" :
            (OS == "mac" && process.arch == "x64") ? "x86_64" :
                process.arch == "x64" ? "amd64" : process.arch;
const api_url = process.env.GITHUB_API_URL || "https://api.github.com";
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
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            var pandocVersion = core.getInput("pandoc-version");
            core.debug(`got pandoc-version ${pandocVersion}`);
            if (pandocVersion == "latest") {
                pandocVersion = yield getLatestVersion();
            }
            if (pandocVersion == "nightly") {
                yield getNightlyPandoc();
            }
            else {
                yield getPandoc(pandocVersion);
            }
        }
        catch (error) {
            core.setFailed((_b = (_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : error) !== null && _b !== void 0 ? _b : "Unknown error");
        }
    });
}
function getLatestVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        const http = new http_client_1.HttpClient("setup-pandoc", [], {
            allowRedirects: false,
        });
        const resp = yield http.head("https://github.com/jgm/pandoc/releases/latest");
        const location = resp.message.headers.location;
        if (!location) {
            throw "Failed to deduce latest Pandoc release";
        }
        return path.basename(location);
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
function getAuthHeaderValue() {
    var _a;
    const authToken = (_a = core.getInput("token", {
        required: false,
        trimWhitespace: true,
    })) !== null && _a !== void 0 ? _a : undefined;
    return !!authToken ? `Bearer ${authToken}` : undefined;
}
function getNightlyPandoc() {
    return __awaiter(this, void 0, void 0, function* () {
        if (OS == "mac" || OS == "linux") {
            if (ARCH == "arm64") {
                throw "Nightly Pandoc is not supported on arm64 OS.";
            }
        }
        // There is no way to query a single workflow, so we need to paginate
        // to find the one called 'Nightly'.
        const octokit = new action_1.Octokit();
        const owner = "jgm";
        const repo = "pandoc";
        const res = yield octokit.paginate('GET /repos/{owner}/{repo}/actions/runs', {
            owner,
            repo,
            status: "success"
        }, (response, done) => {
            var bld = response.data.find(x => x.name == "Nightly");
            if (!!bld) {
                done();
                return [bld.id];
            }
            return [];
        });
        const run_id = res[0];
        const res2 = yield octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts', {
            owner,
            repo,
            run_id
        });
        var arts = {};
        for (var i in res2.data.artifacts) {
            arts[res2.data.artifacts[i].name] = res2.data.artifacts[i].id;
        }
        const which = IS_WINDOWS ? 'nightly-windows' : (IS_MAC ? 'nightly-macos' : 'nightly-linux');
        const artifact_id = arts[which];
        let { url } = yield octokit.request("HEAD /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}", {
            owner,
            repo,
            artifact_id,
            archive_format: "zip",
            request: {
                redirect: "manual",
            },
        });
        let downloadPath;
        try {
            downloadPath = yield tc.downloadTool(url);
        }
        catch (error) {
            throw new Error('Failed to download Pandoc nightly build: ' + error);
        }
        const fileName = which + '.zip';
        const extractionPath = yield tc.extractZip(downloadPath);
        const subdir = yield fs.promises.readdir(extractionPath);
        const pandocPath = extractionPath + '/' + subdir[0];
        if (!IS_WINDOWS) {
            const pandoc = pandocPath + '/pandoc';
            yield fs.promises.chmod(pandoc, '755');
        }
        core.debug(`Adding '${pandocPath}' to PATH.`);
        core.addPath(pandocPath);
    });
}
function installPandocMac(version) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // Since 3.1.2, Pandoc uses cabal instead of stack to build the macOS binary.
        const is_new_macos_installer = (0, compare_versions_1.compare)(version, "3.1.2", ">=") ? true : false;
        const fileName = is_new_macos_installer ?
            util.format("pandoc-%s-%s-macOS.pkg", version, ARCH) :
            util.format("pandoc-%s-macOS.pkg", version);
        const downloadUrl = util.format("https://github.com/jgm/pandoc/releases/download/%s/%s", version, fileName);
        let downloadPath;
        try {
            downloadPath = yield tc.downloadTool(downloadUrl);
        }
        catch (error) {
            throw new Error(`Failed to download Pandoc ${version}: ${(_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : error}`);
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
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const fileName = util.format("pandoc-%s-windows-x86_64.zip", version);
        const downloadUrl = util.format("https://github.com/jgm/pandoc/releases/download/%s/%s", version, fileName);
        let downloadPath;
        try {
            downloadPath = yield tc.downloadTool(downloadUrl);
        }
        catch (error) {
            throw new Error(`Failed to download Pandoc ${version}: ${(_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : error}`);
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
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const is_new_linux_installer = (0, compare_versions_1.compare)(version, "2.8", ">=") ? true : false;
        const fileName = is_new_linux_installer ?
            util.format("pandoc-%s-linux-%s.tar.gz", version, ARCH) :
            util.format("pandoc-%s-linux.tar.gz", version);
        const downloadUrl = util.format("https://github.com/jgm/pandoc/releases/download/%s/%s", version, fileName);
        let downloadPath;
        try {
            console.log("::group::Download pandoc");
            downloadPath = yield tc.downloadTool(downloadUrl);
        }
        catch (error) {
            throw new Error(`Failed to download Pandoc ${version}: ${error}`);
        }
        try {
            const extractionPath = yield tc.extractTar(downloadPath);
            const binDirPath = path.join(extractionPath, `pandoc-${version}/bin`);
            const cachedBinDirPath = yield tc.cacheDir(binDirPath, "pandoc", version);
            core.addPath(cachedBinDirPath);
        }
        catch (error) {
            throw new Error(`Failed to install pandoc: ${(_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : error}`);
        }
    });
}
run();
