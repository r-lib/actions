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
const fs = __importStar(require("fs"));
const IS_WINDOWS = process.platform === "win32";
const IS_MAC = process.platform === "darwin";
const IS_LINUX = !(IS_WINDOWS || IS_MAC);
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
            yield getTinyTex();
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
function getTinyTex() {
    return __awaiter(this, void 0, void 0, function* () {
        if (IS_WINDOWS) {
            installTinyTexWindows();
        }
        else {
            installTinyTexPosix();
        }
    });
}
exports.getTinyTex = getTinyTex;
function installTinyTexPosix() {
    return __awaiter(this, void 0, void 0, function* () {
        // We need to install texinfo for texi2dvi, but only on linux
        if (IS_LINUX) {
            try {
                yield exec.exec("sudo apt", ["install", "-y", "texinfo"]);
            }
            catch (error) {
                throw `Failed to install texinfo package: ${error}`;
            }
        }
        const fileName = "install-unx.sh";
        const downloadUrl = "https://yihui.name/gh/tinytex/tools/install-unx.sh";
        let downloadPath = null;
        try {
            downloadPath = yield tc.downloadTool(downloadUrl);
        }
        catch (error) {
            throw `Failed to download TinyTex: ${error}`;
        }
        yield io.mv(downloadPath, path.join(tempDirectory, fileName));
        yield exec.exec("sh", [path.join(tempDirectory, fileName)]);
        let binPath;
        // The binaries are in TinyTeX/bin/*/, where the wildcard is the
        // architecture, but we should always take the first one.
        if (IS_MAC) {
            binPath = path.join(process.env["HOME"] || "/", "Library/TinyTeX/bin");
        }
        else {
            binPath = path.join(process.env["HOME"] || "/", ".TinyTeX/bin");
        }
        const arch = fs.readdirSync(binPath)[0];
        core.addPath(path.join(binPath, arch));
    });
}
function installTinyTexWindows() {
    return __awaiter(this, void 0, void 0, function* () {
        const fileName = "install-windows.bat";
        const downloadUrl = "https://yihui.name/gh/tinytex/tools/install-windows.bat";
        let downloadPath = null;
        try {
            downloadPath = yield tc.downloadTool(downloadUrl);
        }
        catch (error) {
            throw `Failed to download TinyTex: ${error}`;
        }
        yield io.mv(downloadPath, path.join(tempDirectory, fileName));
        
        var txtl = io.length
        var linesExceptLast = io.split('\n').slice(txtl).join('\n');
        
        exec.exec(path.join(tempDirectory, linesExceptLast));
        core.addPath(path.join(process.env["APPDATA"] || "C:\\", "TinyTeX", "bin", "win32"));
    });
}
run();
