import { existsSync, readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { sh, shx } from './proc.js';

export const FLUTTER_GITIGNORE_ENTRIES = [
  '.flutter-sim',
  '*.log',
  'build/',
  '.dart_tool/',
  '.packages',
];

export function isRepo(cwd) {
  return existsSync(join(cwd, '.git'));
}

export function init(cwd) {
  shx('git', ['init'], { cwd });
}

export function currentBranch(cwd) {
  const r = sh('git', ['branch', '--show-current'], { cwd });
  if (r.ok && r.out) return r.out;
  const rev = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd });
  return rev.ok && rev.out !== 'HEAD' ? rev.out : 'main';
}

export function hasCommits(cwd) {
  return sh('git', ['rev-parse', 'HEAD'], { cwd }).ok;
}

export function isDirty(cwd) {
  const r = sh('git', ['status', '--porcelain'], { cwd });
  return r.ok && r.out.length > 0;
}

export function commitAll(cwd, message) {
  shx('git', ['add', '-A'], { cwd });
  shx('git', ['commit', '-m', message], { cwd });
}

export function push(cwd, branch = 'main') {
  shx('git', ['push', '-u', 'origin', branch], { cwd });
}

export function headSha(cwd) {
  const r = sh('git', ['rev-parse', 'HEAD'], { cwd });
  return r.ok ? r.out : '';
}

export function ensureGitignore(cwd) {
  const gitignorePath = join(cwd, '.gitignore');
  let current = '';
  if (existsSync(gitignorePath)) {
    current = readFileSync(gitignorePath, 'utf8');
  }

  const toAdd = FLUTTER_GITIGNORE_ENTRIES.filter((entry) => !current.includes(entry));
  if (toAdd.length > 0) {
    const textToAdd = (current && !current.endsWith('\n') ? '\n' : '') + toAdd.join('\n') + '\n';
    appendFileSync(gitignorePath, textToAdd, 'utf8');
  }
}
