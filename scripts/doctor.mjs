// Laptop check: what this computer has, what's missing, in plain words.
// Read-only — it never installs or changes anything.
//
//   node scripts/doctor.mjs          human-readable report
//   node scripts/doctor.mjs --json   machine-readable (for the skill)
import { execFileSync } from 'node:child_process';
import { existsSync, statfsSync } from 'node:fs';
import { platform, release, totalmem, cpus } from 'node:os';
import { toolPath, config, studioHome, ROOT, isMain } from '../engine/tools.mjs';

const run = (cmd, args) => {
  try { return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 }).trim(); } catch { return null; }
};
const os = platform() === 'win32' ? 'windows' : platform() === 'darwin' ? 'mac' : 'linux';

function freeGb(path) {
  try { const s = statfsSync(path); return (s.bavail * s.bsize) / 1e9; } catch { return null; }
}

export function checkAll() {
  const checks = [];
  const add = (id, ok, what, fix) => checks.push({ id, ok, what, fix: ok ? null : fix });

  const [major] = process.versions.node.split('.').map(Number);
  add('node', major >= 20, `Node.js ${process.versions.node}`, 'Node.js 20 or newer is needed (free, from nodejs.org).');

  add('deps', existsSync(`${ROOT}/node_modules/@resvg/resvg-js`), 'Drawing library (resvg)', 'Setup installs it (about 10 MB).');

  const ff = run(toolPath('ffmpeg'), ['-version']);
  add('ffmpeg', Boolean(ff), ff ? ff.split('\n')[0].slice(0, 40) : 'ffmpeg (video maker)',
    os === 'windows' ? 'Setup installs it with winget (free, about 100 MB).' : 'Setup installs it with Homebrew (free).');

  const rh = run(toolPath('rhubarb'), ['--version']);
  add('rhubarb', Boolean(rh), rh ?? 'Rhubarb (lip-sync)', 'Setup downloads it from its official GitHub page (free, about 87 MB).');

  const k = config().kokoro;
  const kokoroOk = Boolean(k?.python && existsSync(k.python) && existsSync(k.model ?? '') && existsSync(k.voices ?? '')
    && run(k.python, ['-c', 'import kokoro_onnx, soundfile']) !== null);
  add('kokoro', kokoroOk, 'Kokoro (free AI voices)', 'Setup installs it (about 400 MB, one time). Only needed for AI voices.');

  const home = studioHome();
  const free = freeGb(existsSync(home) ? home : homedir());
  add('disk', free === null || free >= 3, `Free space: ${free === null ? 'unknown' : `${free.toFixed(1)} GB`}`,
    'Less than 3 GB free. Free up some space before making videos.');

  const gpu = os === 'windows'
    ? run('powershell', ['-NoProfile', '-Command', '(Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name) -join ", "'])
    : os === 'mac' ? run('sysctl', ['-n', 'machdep.cpu.brand_string']) : null;

  return {
    os, osVersion: release(), studio: home,
    ramGb: Math.round(totalmem() / 1e9), cpu: cpus()[0]?.model, gpu,
    checks, ready: checks.filter((c) => c.id !== 'kokoro').every((c) => c.ok),
  };
}

function homedir() { return process.env.USERPROFILE ?? process.env.HOME ?? '.'; }

if (isMain(import.meta.url)) {
  const r = checkAll();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(`Computer: ${r.os} ${r.osVersion}, ${r.ramGb} GB memory${r.gpu ? `, graphics: ${r.gpu}` : ''}`);
    console.log(`Studio folder: ${r.studio}\n`);
    for (const c of r.checks) console.log(`${c.ok ? '  ok ' : '  -- '} ${c.what}${c.fix ? `\n       ${c.fix}` : ''}`);
    console.log(`\n${r.ready ? 'Ready to make videos.' : 'Some pieces are missing. Setup can add them.'}`);
  }
}
