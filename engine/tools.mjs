// Where things live on this computer.
//
// Her studio (characters, brand, videos, and the free tools setup
// downloads) is a folder OUTSIDE the skill, so skill updates never touch her
// work: $CARTOON_STUDIO_HOME, else ~/CartoonStudio. Its config.json records
// where setup put each tool.
//
// Tool lookup order: CARTOON_STUDIO_<TOOL> env var, studio config.json,
// the skill's own local.config.json (developer machines), then PATH.
import { existsSync, readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// True when the calling module was started directly (node <file>). Compare
// real paths: when the skill is installed as a link (symlink or junction),
// Node gives the module its real path but argv keeps the link path.
const real = (p) => { try { return realpathSync(p); } catch { return resolve(p); } };
export const isMain = (metaUrl) => Boolean(process.argv[1]) && real(process.argv[1]) === real(fileURLToPath(metaUrl));

const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {});

// Developer machines can point the studio elsewhere via the skill's
// local.config.json ("studioHome"); everyone else gets ~/CartoonStudio.
export function studioHome() {
  return process.env.CARTOON_STUDIO_HOME ?? readJson(join(ROOT, 'local.config.json')).studioHome ?? join(homedir(), 'CartoonStudio');
}
const studioConfigPath = () => join(studioHome(), 'config.json');

export function config() {
  return { ...readJson(join(ROOT, 'local.config.json')), ...readJson(studioConfigPath()) };
}

export function saveStudioConfig(patch) {
  mkdirSync(studioHome(), { recursive: true });
  const next = { ...readJson(studioConfigPath()), ...patch };
  writeFileSync(studioConfigPath(), JSON.stringify(next, null, 2));
  return next;
}

export function toolPath(name) {
  const env = process.env[`CARTOON_STUDIO_${name.toUpperCase()}`];
  if (env) return env;
  const cfg = config()[name];
  return typeof cfg === 'string' ? cfg : name;
}

export function kokoroConfig() {
  const k = config().kokoro;
  if (!k?.python || !k?.model || !k?.voices) {
    throw new Error('The free AI voice tool is not set up yet. Run setup first (it installs Kokoro).');
  }
  return k;
}
