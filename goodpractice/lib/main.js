"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const exec = __importStar(require("@actions/exec"));
const fs = __importStar(require("fs"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = core.getInput("repo-token", { required: true });
            const octokit = new github.GitHub(token);
            const context = github.context;
            const check = yield octokit.checks.create(Object.assign({}, context.repo, { name: "goodpractice", head_sha: context.sha, status: "in_progress" }));
            yield exec.exec("Rscript", [
                "-e",
                "x <- goodpractice::goodpractice()",
                "-e",
                'capture.output(print(x), file = ".goodpractice")'
            ]);
            const results = fs.readFileSync(".goodpractice").toString();
            const finishedCheck = yield octokit.checks.update(Object.assign({}, context.repo, { check_run_id: check.data.id, name: check.data.name, output: {
                    title: "goodpractice results",
                    summary: results
                }, status: "completed" }));
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
