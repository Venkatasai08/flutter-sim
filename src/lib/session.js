import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const SESSION_DIR = '.flutter-sim';
const SESSION_FILE = 'session.json';

export function sessionPath(cwd) {
  return join(cwd, SESSION_DIR, SESSION_FILE);
}

export function saveSession(cwd, data) {
  const dir = join(cwd, SESSION_DIR);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(sessionPath(cwd), JSON.stringify({ ...data, savedAt: Date.now() }, null, 2), 'utf8');
}

export function loadSession(cwd) {
  const file = sessionPath(cwd);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

export function clearSession(cwd) {
  const file = sessionPath(cwd);
  if (existsSync(file)) {
    try {
      rmSync(file, { force: true });
    } catch {}
  }
}
