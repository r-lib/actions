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
        const fileName = "install-unx.sh";
        const downloadUrl = "https://yihui.name/gh/tinytex/tools/install-unx.sh";
        let downloadPath = null;
        downloadPath = yield tc.downloadTool(downloadUrl);
        yield io.mv(downloadPath, path.join(tempDirectory, fileName));
        exec.exec("sh", [path.join(tempDirectory, fileName)]);
    });
}
function installTinyTexWindows() {
    return __awaiter(this, void 0, void 0, function* () {
        const fileName = "install-windows.bat";
        const downloadUrl = "https://yihui.name/gh/tinytex/tools/install-unx.sh";
        let downloadPath = null;
        downloadPath = yield tc.downloadTool(downloadUrl);
        yield io.mv(downloadPath, path.join(tempDirectory, fileName));
        exec.exec(path.join(tempDirectory, fileName));
        core.addPath(path.join(process.env["APPDATA"] || "C:\\", "TinyTeX", "bin", "win32"));
    });
}
