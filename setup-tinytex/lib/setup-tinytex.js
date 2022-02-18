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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTinyTeX = void 0;
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
            yield getTinyTeX();
        }
        catch (error) {
            console.error("RUN FAILED");
            core.setFailed(error.message);
            process.exit(1);
        }
    });
}
function getTinyTeX() {
    return __awaiter(this, void 0, void 0, function* () {
        if (IS_WINDOWS) {
            installTinyTeXWindows();
        }
        else {
            installTinyTeXPosix();
        }
    });
}
exports.getTinyTeX = getTinyTeX;
function installTinyTeXPosix() {
    return __awaiter(this, void 0, void 0, function* () {
        // We need to install texinfo for texi2dvi, but only on linux
        if (IS_LINUX) {
            try {
                yield exec.exec("sudo apt-get", ["install", "-y", "texinfo"]);
            }
            catch (error) {
                throw `Failed to install texinfo package: ${error}`;
            }
        }
        const fileName = "install-unx.sh";
        const downloadUrl = "https://yihui.name/gh/tinytex/tools/install-bin-unix.sh";
        let downloadPath = null;
        try {
            downloadPath = yield tc.downloadTool(downloadUrl);
        }
        catch (error) {
            throw `Failed to download TinyTeX: ${error}`;
        }
        try {
            yield io.mv(downloadPath, path.join(tempDirectory, fileName));
            console.error("EXEC");
            yield exec.exec("sh", [path.join(tempDirectory, fileName)]);
        }
        catch (error) {
            console.error("EXEC ERROR");
            throw `Failed to install TinyTeX: ${error}`;
        }
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
function installTinyTeXWindows() {
    return __awaiter(this, void 0, void 0, function* () {
        const fileName = "install-windows.bat";
        const downloadUrl = "https://yihui.name/gh/tinytex/tools/install-bin-windows.bat";
        let downloadPath = null;
        try {
            downloadPath = yield tc.downloadTool(downloadUrl);
        }
        catch (error) {
            throw `Failed to download TinyTeX: ${error}`;
        }
        yield io.mv(downloadPath, path.join(tempDirectory, fileName));
        const fs = require("fs");
        console.log(path.join(tempDirectory, fileName));
        var text = fs.readFileSync(path.join(tempDirectory, fileName), "utf8");
        var textWithoutLastLine = text
            .split("\n")
            .slice(0, -2)
            .join("\n");
        fs.writeFile(path.join(tempDirectory, fileName), textWithoutLastLine, function (err, result) {
            if (err)
                console.log("error", err);
        });
        try {
            exec.exec(path.join(tempDirectory, fileName));
        }
        catch (error) {
            throw `Failed to install TinyTeX: ${error}`;
        }
        core.addPath(path.join(process.env["APPDATA"] || "C:\\", "TinyTeX", "bin", "win32"));
    });
}
run();
