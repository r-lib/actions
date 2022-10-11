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
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const exec = __importStar(require("@actions/exec"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = core.getInput("repo-token", { required: true });
            const client = new github.GitHub(token);
            const context = github.context;
            const issue = context.issue;
            console.log(`Collecting information about PR #${issue.number}...`);
            const { status, data: pr } = yield client.pulls.get({
                owner: issue.owner,
                repo: issue.repo,
                pull_number: issue.number
            });
            const headBranch = pr.head.ref;
            const headCloneURL = pr.head.repo.clone_url.replace("https://", `https://x-access-token:${token}@`);
            const headRepoOwnerLogin = pr.head.repo.owner.login;
            yield exec.exec("git", ["remote", "add", "pr", headCloneURL]);
            yield exec.exec("git", ["fetch", "pr", headBranch]);
            yield exec.exec("git", [
                "checkout",
                "-b",
                `${headRepoOwnerLogin}-${headBranch}`,
                `pr/${headBranch}`
            ]);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
