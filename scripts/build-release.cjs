const { createHash } = require('node:crypto');
const { mkdirSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { basename, join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const tag = process.argv[2] || `v${packageJson.version}`;

if (!/^v\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(tag)) {
  throw new Error(`Expected a version tag such as v${packageJson.version}.`);
}
if (tag !== `v${packageJson.version}`) {
  throw new Error(`Tag ${tag} does not match package.json version ${packageJson.version}.`);
}

const releaseDirectory = join(ROOT, 'release');
const archiveName = `ellivien-three-tier-context-${tag}.zip`;
const archivePath = join(releaseDirectory, archiveName);
const checksumPath = `${archivePath}.sha256`;
const included = [
  '.env.example',
  'CONTRIBUTING.md',
  'LICENSE',
  'NOTICE',
  'README.md',
  'SECURITY.md',
  'docs',
  'examples',
  'package.json',
  'src',
];

mkdirSync(releaseDirectory, { recursive: true });
rmSync(archivePath, { force: true });
rmSync(checksumPath, { force: true });

const zip = spawnSync('zip', ['-q', '-r', archivePath, ...included, '-x', '*.DS_Store', '*/.DS_Store'], {
  cwd: ROOT,
  stdio: 'inherit',
});
if (zip.status !== 0) throw new Error('Could not create the release ZIP.');

const digest = createHash('sha256').update(readFileSync(archivePath)).digest('hex');
writeFileSync(checksumPath, `${digest}  ${basename(archivePath)}\n`);
console.log(JSON.stringify({ archivePath, checksumPath, sha256: digest }));
