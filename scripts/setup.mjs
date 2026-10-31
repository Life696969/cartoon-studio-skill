// One-time setup: installs only the free pieces the laptop check says are
// missing, and only the ones named. The skill asks her first and passes
// exactly what she agreed to. Every download comes from the tool's official
// release page and is checked against its published size; half-finished
// downloads are deleted on every exit path.
//
//   node scripts/setup.mjs --only deps,ffmpeg,rhubarb,kokoro [--dry-run]
import { execFileSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, renameSync, rmSync, statSync, chmodSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ROOT, studioHome, saveStudioConfig, isMain } from '../engine/tools.mjs';
import { checkAll } from './doctor.mjs';

const isWin = process.platform === 'win32', isMac = process.platform === 'darwin';

const RHUBARB = {
  version: '1.14.0',
  win32: { file: 'Rhubarb-Lip-Sync-1.14.0-Windows.zip', size: 87374842, exe: 'rhubarb.exe', dir: 'Rhubarb-Lip-Sync-1.14.0-Windows' },
  darwin: { file: 'Rhubarb-Lip-Sync-1.14.0-macOS.zip', size: 86870942, exe: 'rhubarb', dir: 'Rhubarb-Lip-Sync-1.14.0-macOS' },
};
const RHUBARB_URL = (f) => `https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v${RHUBARB.version}/${f}`;
const KOKORO_FILES = [
  { file: 'kokoro-v1.0.onnx', size: 325532387 },
  { file: 'voices-v1.0.bin', size: 28214398 },
];
const KOKORO_URL = (f) => `https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/${f}`;
const KOKORO_PIP = ['kokoro-onnx==0.4.9', 'soundfile==0.14.0'];

const say = (msg) => console.log(msg);
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: 'inherit', shell: isWin && /\.(cmd|bat)$/i.test(cmd), ...opts });
const tryRun = (cmd, args) => { try { return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); } catch { return null; } };

async function download(url, dest, size) {
  if (existsSync(dest) && statSync(dest).size === size) { say(`  already have ${dest}`); return dest; }
  const part = `${dest}.part`;
  try {
    say(`  downloading ${url.split('/').pop()} (${(size / 1e6).toFixed(0)} MB)...`);
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
    await pipeline(Readable.fromWeb(res.body), createWriteStream(part));
    const got = statSync(part).size;
    if (got !== size) throw new Error(`download size ${got} does not match the official ${size}`);
    renameSync(part, dest);
    return dest;
  } finally {
    rmSync(part, { force: true });
  }
}

const STEPS = {
  deps: {
    what: 'Drawing library (resvg) — about 10 MB',
    async run() { run(isWin ? 'npm.cmd' : 'npm', ['install', '--omit=dev', '--no-audit', '--no-fund'], { cwd: ROOT }); },
  },
  ffmpeg: {
    what: isWin ? 'ffmpeg via winget — about 100 MB' : 'ffmpeg via Homebrew',
    async run() {
      if (isWin) {
        run('winget', ['install', '--id', 'Gyan.FFmpeg', '-e', '--accept-source-agreements', '--accept-package-agreements']);
        // winget doesn't refresh this process's PATH; record where it put ffmpeg.
        const base = join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Packages');
        const pkg = readdirSync(base).find((d) => d.startsWith('Gyan.FFmpeg'));
        const inner = pkg && readdirSync(join(base, pkg)).find((d) => d.startsWith('ffmpeg-'));
        if (inner) saveStudioConfig({ ffmpeg: join(base, pkg, inner, 'bin', 'ffmpeg.exe') });
      } else if (isMac) {
        if (!tryRun('brew', ['--version'])) throw new Error('Homebrew is needed for ffmpeg on Mac. Install it from brew.sh (it asks for your Mac password), then run setup again.');
        run('brew', ['install', 'ffmpeg']);
      } else throw new Error('Install ffmpeg with your package manager.');
    },
  },
  rhubarb: {
    what: 'Rhubarb lip-sync from its official GitHub release — about 87 MB',
    async run() {
      const r = RHUBARB[process.platform];
      if (!r) throw new Error('No Rhubarb build for this system.');
      const dir = join(studioHome(), 'tools', 'rhubarb');
      mkdirSync(dir, { recursive: true });
      const zip = await download(RHUBARB_URL(r.file), join(dir, r.file), r.size);
      // Windows' own tar (bsdtar) opens zips; a Git Bash GNU tar earlier on
      // PATH would not, so name it exactly. Macs always have unzip.
      if (isWin) run(join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe'), ['-xf', zip, '-C', dir]);
      else run('/usr/bin/unzip', ['-q', '-o', zip, '-d', dir]);
      rmSync(zip, { force: true });
      const exe = join(dir, r.dir, r.exe);
      if (!isWin) chmodSync(exe, 0o755);
      saveStudioConfig({ rhubarb: exe });
    },
  },
  kokoro: {
    what: 'Kokoro free AI voices: a Python helper + voice model — about 400 MB',
    async run() {
      const py = findPython();
      if (!py) {
        throw new Error(isWin
          ? 'Python 3.10+ is needed. Install it with: winget install -e --id Python.Python.3.12  — then run setup again.'
          : 'Python 3.10+ is needed. Install it with: brew install python@3.12  — then run setup again.');
      }
      const dir = join(studioHome(), 'tools', 'kokoro');
      const venv = join(dir, 'venv');
      mkdirSync(dir, { recursive: true });
      if (!existsSync(venv)) run(py[0], [...py.slice(1), '-m', 'venv', venv]);
      const vpy = isWin ? join(venv, 'Scripts', 'python.exe') : join(venv, 'bin', 'python');
      run(vpy, ['-m', 'pip', 'install', '--quiet', '--disable-pip-version-check', ...KOKORO_PIP]);
      for (const f of KOKORO_FILES) await download(KOKORO_URL(f.file), join(dir, f.file), f.size);
      saveStudioConfig({ kokoro: { python: vpy, model: join(dir, KOKORO_FILES[0].file), voices: join(dir, KOKORO_FILES[1].file) } });
    },
  },
};

function findPython() {
  const candidates = isWin ? [['py', '-3'], ['python']] : [['python3'], ['python']];
  for (const c of candidates) {
    const v = tryRun(c[0], [...c.slice(1), '-c', 'import sys; print("%d.%d" % sys.version_info[:2])']);
    if (v && Number(v.split('.')[1]) >= 10 && v.startsWith('3.')) return c;
  }
  return null;
}

export async function setup(only, dryRun = false) {
  for (const id of only) if (!STEPS[id]) throw new Error(`Unknown setup step "${id}"`);
  say(`Studio folder: ${studioHome()}`);
  for (const id of only) {
    say(`\n${dryRun ? 'Would install' : 'Installing'}: ${STEPS[id].what}`);
    if (!dryRun) await STEPS[id].run();
  }
  if (!dryRun) {
    say('\nChecking again...');
    for (const c of checkAll().checks) say(`${c.ok ? '  ok ' : '  -- '} ${c.what}`);
  }
}

if (isMain(import.meta.url)) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--only');
  const only = i >= 0 ? args[i + 1].split(',') : [];
  if (!only.length) { console.error('Say what to install: --only deps,ffmpeg,rhubarb,kokoro'); process.exit(2); }
  setup(only, args.includes('--dry-run')).catch((e) => { console.error(`\nSetup stopped: ${e.message}`); process.exit(1); });
}
