import fs from "node:fs";
import { deepStrictEqual } from "node:assert";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";

import { Bench } from "tinybench";
import nodegit from "nodegit";
import git from "isomorphic-git";
import { simpleGit } from "simple-git";
import { execa } from "execa";

function getEnv(name) {
  const val = process.env[name];
  if (!val) throw new Error(`env ${name} is not set`);

  return val;
}

const config = {
  repo: getEnv("BENCH_REPO"),
  commit: getEnv("BENCH_COMMIT"),
  path: getEnv("BENCH_PATH"),
  md5: getEnv("BENCH_MD5"),
  count: getEnv("BENCH_COUNT"),
};

async function nodegit_show() {
  const repo = await nodegit.Repository.open(`${config.repo}/.git`);
  const commit = await repo.getCommit(config.commit);
  const entry = await commit.getEntry(config.path);
  const blob = await entry.getBlob();
  const content = blob.content();
  return content;
}

async function isomorphicGit_show() {
  const { blob } = await git.readBlob({
    fs,
    dir: config.repo,
    oid: config.commit,
    filepath: config.path,
  });
  const content = Buffer.from(blob);
  return content;
}

async function simpleGit_show() {
  const git = simpleGit(config.repo);
  const content = await new Promise((resolve, reject) => {
    git.show([`${config.commit}:${config.path}`], (err, data) => {
      if (err !== null) {
        reject(err);
        return;
      }

      resolve(data);
    });
  });
  return content;
}

async function execFile_show() {
  const content = await new Promise((resolve, reject) => {
    execFile(
      "git",
      ["show", `${config.commit}:${config.path}`],
      {
        cwd: config.repo,
        maxBuffer: 1024 * 1024 * 1024,
        encoding: null,
      },
      (err, stdout, _stderr) => {
        if (err !== null) {
          reject(err);
          return;
        }

        resolve(stdout);
      }
    );
  });
  return content;
}

async function execa_show() {
  const content = (
    await execa("git", ["show", `${config.commit}:${config.path}`], {
      cwd: config.repo,
      encoding: null,
      stripFinalNewline: false,
    })
  ).stdout;
  return content;
}

function md5sum(content) {
  const hashFunc = createHash("md5");
  hashFunc.update(content);
  return hashFunc.digest("hex");
}

switch (process.argv[2]) {
  case "test":
    deepStrictEqual(md5sum(await nodegit_show()), config.md5);
    deepStrictEqual(md5sum(await isomorphicGit_show()), config.md5);
    deepStrictEqual(md5sum(await simpleGit_show()), config.md5);
    deepStrictEqual(md5sum(await execFile_show()), config.md5);
    deepStrictEqual(md5sum(await execa_show()), config.md5);
    break;
  case "bench":
    const bench = new Bench({ time: config.count });

    bench
      .add(nodegit_show.name, nodegit_show)
      .add(isomorphicGit_show.name, isomorphicGit_show)
      .add(simpleGit_show.name, simpleGit_show)
      .add(execFile_show.name, execFile_show)
      .add(execa_show.name, execa_show);

    await bench.run();

    console.table(
      bench.tasks.map(({ name, result }) => ({
        "Task Name": name,
        "Average Time (ps)": result?.mean * 1000,
        "Variance (ps)": result?.variance * 1000,
      }))
    );

    break;
  default:
    throw new Error();
}
