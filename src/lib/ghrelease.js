import { statSync, existsSync } from 'node:fs';
import { basename } from 'node:path';
import { sh, shx } from './proc.js';

export const RELEASE_TAG = 'flutter-sim-build';

export function ensureRelease(cwd, repo) {
  const check = sh('gh', ['release', 'view', RELEASE_TAG, '--repo', repo], { cwd });
  if (!check.ok) {
    shx(
      'gh',
      [
        'release',
        'create',
        RELEASE_TAG,
        '--repo',
        repo,
        '--title',
        'flutter-sim prebuilt simulator builds',
        '--notes',
        'Reused draft release for flutter-sim simulator binaries.',
        '--draft',
      ],
      { cwd }
    );
  }
}

export function upload(cwd, repo, filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  ensureRelease(cwd, repo);
  const assetName = basename(filePath);

  shx('gh', ['release', 'upload', RELEASE_TAG, filePath, '--repo', repo, '--clobber'], { cwd });

  const bytes = statSync(filePath).size;
  return {
    asset: assetName,
    bytes,
  };
}
