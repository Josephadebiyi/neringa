import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const [mode, root] = process.argv.slice(2);
if (!['create', 'verify'].includes(mode) || !root) {
  throw new Error('Usage: node checksums.mjs <create|verify> <snapshot-directory>');
}

async function filesUnder(directory) {
  const results = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...await filesUnder(absolute));
    else if (entry.isFile() && entry.name !== 'SHA256SUMS') results.push(absolute);
  }
  return results.sort();
}

async function digest(file) {
  const hash = crypto.createHash('sha256');
  hash.update(await fs.readFile(file));
  return hash.digest('hex');
}

const checksumFile = path.join(root, 'SHA256SUMS');
if (mode === 'create') {
  const lines = [];
  for (const file of await filesUnder(root)) {
    lines.push(`${await digest(file)}  ${path.relative(root, file).split(path.sep).join('/')}`);
  }
  await fs.writeFile(checksumFile, `${lines.join('\n')}\n`, { mode: 0o600 });
  console.log(`Checksummed ${lines.length} files.`);
} else {
  const lines = (await fs.readFile(checksumFile, 'utf8')).trim().split('\n').filter(Boolean);
  for (const line of lines) {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/);
    if (!match) throw new Error(`Invalid checksum entry: ${line}`);
    const [, expected, relative] = match;
    const candidate = path.resolve(root, relative);
    const rootBoundary = `${path.resolve(root)}${path.sep}`;
    if (!candidate.startsWith(rootBoundary)) throw new Error(`Unsafe checksum path: ${relative}`);
    const actual = await digest(candidate);
    if (actual !== expected) throw new Error(`Checksum mismatch: ${relative}`);
  }
  console.log(`Verified ${lines.length} checksums.`);
}
