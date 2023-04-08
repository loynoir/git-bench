### What

Compare performance

- 6.8K <https://github.com/isomorphic-git/isomorphic-git>
- 5.4K <https://github.com/nodegit/nodegit>
- 3K <https://github.com/steveukx/git-js>

### Consideration

- `https://github.com/yarnpkg/berry/` is a repo with 2.5G size, should be able to represent a complex enough repo.

- `packages/berry-cli/bin/berry.js` is a file with 2.2M size, should be able to represent a big enough file.

- To decrease the impact of disk read, use `BENCH_REPO` under tmpfs

### Usage

```sh
$ mountpoint /tmp
/tmp is a mountpoint
$ git clone https://github.com/yarnpkg/berry /tmp/yarn-berry
$ export BENCH_REPO=/tmp/yarn-berry
$ time env \
    BENCH_COUNT=10000 \
    BENCH_COMMIT="dd660311021046a4d09525b2cb59e15a7be99ed5" \
    BENCH_PATH="packages/berry-cli/bin/berry.js" \
    BENCH_MD5="0a6b4fa3d145c0f3b8e75b1feff2190e" \
    npm run bench
```
