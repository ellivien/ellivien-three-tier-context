import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

function runCapture(environment) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, ['scripts/capture-github-metrics.mjs', '--commit'], {
      cwd: ROOT,
      env: { ...process.env, ...environment },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.once('error', rejectRun);
    child.once('exit', code => resolveRun({ code, stdout, stderr }));
  });
}

test('captures aggregate GitHub evidence and commits one timestamped snapshot', async t => {
  let committedBody = null;
  const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const json = value => {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(value));
    };

    if (request.method === 'PUT' && url.pathname.includes('/contents/metrics/snapshots/')) {
      let body = '';
      request.on('data', chunk => { body += chunk; });
      request.on('end', () => {
        committedBody = JSON.parse(body);
        json({
          content: { path: decodeURIComponent(url.pathname.split('/contents/')[1]) },
          commit: { html_url: 'https://example.test/commit/1' },
        });
      });
      return;
    }

    const fixtures = new Map([
      ['/repos/ellivien/ellivien-three-tier-context', { full_name: 'ellivien/ellivien-three-tier-context', default_branch: 'main', stargazers_count: 7, forks_count: 3, open_issues_count: 2 }],
      ['/repos/ellivien/ellivien-three-tier-context/traffic/views', { count: 20, uniques: 11, views: [{ timestamp: '2026-10-25T00:00:00Z', count: 20, uniques: 11 }] }],
      ['/repos/ellivien/ellivien-three-tier-context/traffic/clones', { count: 5, uniques: 4, clones: [{ timestamp: '2026-10-25T00:00:00Z', count: 5, uniques: 4 }] }],
      ['/repos/ellivien/ellivien-three-tier-context/traffic/popular/referrers', [{ referrer: 'example.test', count: 6, uniques: 5 }]],
      ['/repos/ellivien/ellivien-three-tier-context/traffic/popular/paths', [{ path: '/ellivien/ellivien-three-tier-context', title: 'Three-Tier Context', count: 20, uniques: 11 }]],
      ['/repos/ellivien/ellivien-three-tier-context/releases', [{ tag_name: 'v0.1.0', name: 'Three-Tier Context v0.1.0', draft: false, prerelease: false, published_at: '2026-10-24T00:00:00Z', html_url: 'https://example.test/release', assets: [{ name: 'ellivien-three-tier-context-v0.1.0.zip', size: 1234, content_type: 'application/zip', download_count: 9, updated_at: '2026-10-25T00:00:00Z', browser_download_url: 'https://example.test/download' }] }]],
    ]);
    const fixture = fixtures.get(url.pathname);
    if (fixture) return json(fixture);
    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: `No fixture for ${url.pathname}` }));
  });
  await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
  t.after(() => server.close());

  const address = server.address();
  const result = await runCapture({
    GITHUB_API_URL: `http://127.0.0.1:${address.port}`,
    GITHUB_REPOSITORY: 'ellivien/ellivien-three-tier-context',
    CONTEXT_TRAFFIC_TOKEN: 'traffic-test',
    METRICS_COMMIT_TOKEN: 'commit-test',
  });

  assert.equal(result.code, 0, result.stderr);
  assert.ok(committedBody, 'the workflow should commit a snapshot');
  assert.equal(committedBody.branch, 'main');
  const snapshot = JSON.parse(Buffer.from(committedBody.content, 'base64').toString('utf8'));
  assert.equal(snapshot.repository, 'ellivien/ellivien-three-tier-context');
  assert.equal(snapshot.traffic.views.uniques, 11);
  assert.equal(snapshot.traffic.clones.uniques, 4);
  assert.equal(snapshot.repositoryTotals.stars, 7);
  assert.equal(snapshot.releaseAssetDownloadTotal, 9);
  assert.equal(snapshot.releasePackageDownloadTotal, 9);
  assert.equal(snapshot.source.aggregateOnly, true);
  assert.match(JSON.parse(result.stdout).path, /^metrics\/snapshots\/.*\.json$/);
});
