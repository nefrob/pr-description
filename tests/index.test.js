// Ref: https://jeffrafter.com/working-with-github-actions/

import * as core from "@actions/core";
import * as github from "@actions/github";
import nock from "nock";

import { run } from "../index";

nock.disableNetConnect();

const originalEnv = process.env;

const noticeMock = jest.spyOn(core, "notice").mockImplementation();
const failedMock = jest.spyOn(core, "setFailed").mockImplementation();

const mockPrGet = jest.fn();
const mockPrGetReturn = jest.fn();
const mockPrList = jest.fn();
const mockPrUpdate = jest.fn();

describe("pull request event", () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.resetModules();
        nock.cleanAll();

        process.env = { ...originalEnv };

        const owner = "owner-name";
        const repo = "repo-name";
        const pull_number = 123;
        const defaultContext = {
            eventName: "pull_request",
            payload: {
                pull_request: {
                    number: pull_number,
                },
                ref: "refs/heads/branch-with-pr",
            },
            repo: {
                owner: owner,
                repo: repo,
            },
            sha: "sha",
        };

        // eslint-disable-next-line no-import-assign
        github.context = defaultContext;

        mockPrGetReturn.mockImplementation(() => {
            return {
                body: "existing body",
            };
        });
        nock("https://api.github.com")
            .get(`/repos/${owner}/${repo}/pulls/${pull_number}`, () => {
                mockPrGet();
                return true;
            })
            .reply(200, () => mockPrGetReturn());

        nock("https://api.github.com")
            .get(`/repos/${owner}/${repo}/commits/${defaultContext.sha}/pulls`, () => {
                mockPrList();
                return true;
            })
            .reply(200, [
                {
                    head: {
                        ref: "branch-without-pr",
                    },
                    state: "other",
                    number: pull_number + 1,
                },
                {
                    head: {
                        ref: "draft-branch-with-pr",
                    },
                    state: "draft",
                    number: pull_number + 2,
                },
                {
                    head: {
                        ref: "branch-with-pr",
                    },
                    state: "open",
                    number: pull_number,
                },
            ]);

        nock("https://api.github.com")
            .patch(`/repos/${owner}/${repo}/pulls/${pull_number}`, (body) => {
                mockPrUpdate(body);
                return true;
            })
            .reply(200);
    });

    it("should replace PR body content on total regex match", async () => {
        await run();

        expect(mockPrGet).toHaveBeenCalledTimes(1);
        expect(noticeMock).toHaveBeenCalledWith(
            "Replacing matched PR body with content",
        );
        expect(mockPrUpdate).toHaveBeenCalledWith({
            body: "new content",
        });
        expect(mockPrList).not.toHaveBeenCalled();
        expect(failedMock).not.toHaveBeenCalled();
    });

    it("should replace PR body content on partial regex match", async () => {
        process.env["INPUT_REGEX"] = "existing";

        await run();

        expect(mockPrGet).toHaveBeenCalledTimes(1);
        expect(noticeMock).toHaveBeenCalledWith(
            "Replacing matched PR body with content",
        );
        expect(mockPrUpdate).toHaveBeenCalledWith({
            body: "new content body",
        });
        expect(mockPrList).not.toHaveBeenCalled();
        expect(failedMock).not.toHaveBeenCalled();
    });

    it("should replace PR body content on case insensitive regex", async () => {
        process.env["INPUT_REGEX"] = "EXISTING";
        process.env["INPUT_REGEXFLAGS"] = "i";

        await run();

        expect(mockPrGet).toHaveBeenCalledTimes(1);
        expect(noticeMock).toHaveBeenCalledWith(
            "Replacing matched PR body with content",
        );
        expect(mockPrUpdate).toHaveBeenCalledWith({
            body: "new content body",
        });
        expect(mockPrList).not.toHaveBeenCalled();
        expect(failedMock).not.toHaveBeenCalled();
    });

    it("should replace PR body content on newline regex match", async () => {
        mockPrGetReturn.mockImplementation(() => {
            return {
                body: "existing body\nnewline",
            };
        });

        process.env["INPUT_REGEXFLAGS"] = "s";

        await run();

        expect(mockPrGet).toHaveBeenCalledTimes(1);
        expect(noticeMock).toHaveBeenCalledWith(
            "Replacing matched PR body with content",
        );
        expect(mockPrUpdate).toHaveBeenCalledWith({
            body: "new content",
        });
        expect(mockPrList).not.toHaveBeenCalled();
        expect(failedMock).not.toHaveBeenCalled();
    });

    it("should replace all instances of match in PR body content on global regex match", async () => {
        mockPrGetReturn.mockImplementation(() => {
            return {
                body: "existing body existing",
            };
        });

        process.env["INPUT_CONTENT"] = "new";
        process.env["INPUT_REGEX"] = "existing";
        process.env["INPUT_REGEXFLAGS"] = "g";

        await run();

        expect(mockPrGet).toHaveBeenCalledTimes(1);
        expect(noticeMock).toHaveBeenCalledWith(
            "Replacing matched PR body with content",
        );
        expect(mockPrUpdate).toHaveBeenCalledWith({
            body: "new body new",
        });
        expect(mockPrList).not.toHaveBeenCalled();
        expect(failedMock).not.toHaveBeenCalled();
    });

    it("should append content to PR body on no regex match", async () => {
        process.env["INPUT_REGEX"] = "no match";

        await run();

        expect(mockPrGet).toHaveBeenCalledTimes(1);
        expect(noticeMock).toHaveBeenCalledWith("Append content to PR body");
        expect(mockPrUpdate).toHaveBeenCalledWith({
            body: "existing bodynew content",
        });
        expect(mockPrList).not.toHaveBeenCalled();
        expect(failedMock).not.toHaveBeenCalled();
    });

    it("should append content to PR body on no regex match due to case sensitivity", async () => {
        process.env["INPUT_REGEX"] = "EXISTING";

        await run();

        expect(mockPrGet).toHaveBeenCalledTimes(1);
        expect(noticeMock).toHaveBeenCalledWith("Append content to PR body");
        expect(mockPrUpdate).toHaveBeenCalledWith({
            body: "existing bodynew content",
        });
        expect(mockPrList).not.toHaveBeenCalled();
        expect(failedMock).not.toHaveBeenCalled();
    });

    it("should not append content to PR body on no regex match when match only mode is set", async () => {
        process.env["INPUT_REGEX"] = "no match";
        process.env["INPUT_APPENDCONTENTONMATCHONLY"] = "true";

        await run();

        expect(mockPrGet).toHaveBeenCalledTimes(1);
        expect(noticeMock).toHaveBeenCalledWith(
            "No match found and appendContentOnMatchOnly is set, not updating PR body",
        );
        expect(mockPrUpdate).not.toHaveBeenCalled();
        expect(mockPrList).not.toHaveBeenCalled();
        expect(failedMock).not.toHaveBeenCalled();
    });

    it("should select from content then replace PR body", async () => {
        process.env["INPUT_CONTENTREGEX"] = "##.*?##";
        process.env["INPUT_CONTENT"] = "ignored ## REPLACEMENT ## ignored";

        await run();

        expect(mockPrGet).toHaveBeenCalledTimes(1);
        expect(noticeMock).toHaveBeenCalledWith("Selecting matched content");
        expect(noticeMock).toHaveBeenCalledWith(
            "Replacing matched PR body with content",
        );
        expect(mockPrUpdate).toHaveBeenCalledWith({
            body: "## REPLACEMENT ##",
        });
        expect(mockPrList).not.toHaveBeenCalled();
        expect(failedMock).not.toHaveBeenCalled();
    });

    it("should select all matches from content then replace PR body", async () => {
        process.env["INPUT_CONTENTREGEX"] = "^(#[^\n]*\n)";
        process.env["INPUT_CONTENTREGEXFLAGS"] = "gm";
        process.env["INPUT_CONTENT"] =
            "# Heading\n  - content\n# Another heading\n  - more content";

        await run();

        expect(mockPrGet).toHaveBeenCalledTimes(1);
        expect(noticeMock).toHaveBeenCalledWith("Selecting matched content");
        expect(noticeMock).toHaveBeenCalledWith(
            "Replacing matched PR body with content",
        );
        expect(mockPrUpdate).toHaveBeenCalledWith({
            body: "# Heading\n# Another heading\n",
        });
        expect(mockPrList).not.toHaveBeenCalled();
        expect(failedMock).not.toHaveBeenCalled();
    });

    it("should set empty PR body to content", async () => {
        mockPrGetReturn.mockImplementation(() => {
            return { body: "" };
        });

        await run();

        expect(mockPrGet).toHaveBeenCalledTimes(1);
        expect(noticeMock).toHaveBeenCalledWith("Setting PR body to content");
        expect(mockPrUpdate).toHaveBeenCalledWith({
            body: "new content",
        });
        expect(mockPrList).not.toHaveBeenCalled();
        expect(failedMock).not.toHaveBeenCalled();
    });

    it("should not set empty PR body to content when match only mode is set", async () => {
        process.env["INPUT_APPENDCONTENTONMATCHONLY"] = "true";

        mockPrGetReturn.mockImplementation(() => {
            return { body: "" };
        });

        await run();

        expect(mockPrGet).toHaveBeenCalledTimes(1);
        expect(noticeMock).toHaveBeenCalledWith(
            "No match found and appendContentOnMatchOnly is set, not updating PR body",
        );
        expect(mockPrUpdate).not.toHaveBeenCalled();
        expect(mockPrList).not.toHaveBeenCalled();
        expect(failedMock).not.toHaveBeenCalled();
    });

    it("should read file content and set PR body to content", async () => {
        process.env["INPUT_CONTENT"] = "tests/sample_content.txt";
        process.env["INPUT_CONTENTISFILEPATH"] = "true";

        await run();

        expect(mockPrGet).toHaveBeenCalledTimes(1);
        expect(noticeMock).toHaveBeenCalledWith(
            "Replacing matched PR body with content",
        );
        expect(mockPrUpdate).toHaveBeenCalledWith({
            body: "file content",
        });
        expect(mockPrList).not.toHaveBeenCalled();
        expect(failedMock).not.toHaveBeenCalled();
    });

    it("should lookup the PR via SHA and set content", async () => {
        github.context.eventName = "push";
        github.context.payload.pull_request = undefined;

        await run();

        expect(mockPrList).toHaveBeenCalledTimes(1);
        expect(mockPrGet).toHaveBeenCalledTimes(1);
        expect(noticeMock).toHaveBeenCalledWith(
            "Replacing matched PR body with content",
        );
        expect(mockPrUpdate).toHaveBeenCalledWith({
            body: "new content",
        });
        expect(failedMock).not.toHaveBeenCalled();
    });

    it("should fail when PR cannot be found", async () => {
        github.context.eventName = "other";
        github.context.payload.pull_request = undefined;
        github.context.payload.ref = "refs/heads/branch-without-pr";

        const errorMessage = `No open pull request found for ${github.context.eventName}, ${github.context.sha}`;
        try {
            await run();
        } catch (e) {
            expect(e.message).toEqual(errorMessage);
        }

        expect(failedMock).toHaveBeenCalledWith(errorMessage);

        expect(mockPrList).toHaveBeenCalled();
        expect(mockPrGet).not.toHaveBeenCalled();
        expect(mockPrUpdate).not.toHaveBeenCalled();
    });
});
