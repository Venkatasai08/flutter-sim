import { existsSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';

/** Parse basic fields from pubspec.yaml without heavy yaml parser dependencies */
export function parsePubspec(cwd) {
  const pubspecPath = join(cwd, 'pubspec.yaml');
  if (!existsSync(pubspecPath)) return null;

  try {
    const content = readFileSync(pubspecPath, 'utf8');
    const nameMatch = content.match(/^name:\s*([a-zA-Z0-9_-]+)/m);
    const versionMatch = content.match(/^version:\s*([^\r\n]+)/m);
    const hasFlutter = /^\s*flutter:\s*$/m.test(content) || /sdk:\s*flutter/m.test(content);

    return {
      name: nameMatch ? nameMatch[1] : null,
      version: versionMatch ? versionMatch[1].trim() : null,
      isFlutter: hasFlutter,
      hasIos: existsSync(join(cwd, 'ios')),
    };
  } catch {
    return null;
  }
}

/** Assert the directory is a valid Flutter project. */
export function assertFlutterProject(cwd) {
  const info = parsePubspec(cwd);
  if (!info) {
    throw new Error(`No pubspec.yaml found in ${cwd}. Run flutter-sim from your Flutter project root.`);
  }
  if (!info.isFlutter) {
    throw new Error(`pubspec.yaml in ${cwd} does not appear to be a Flutter project (no flutter SDK dependency).`);
  }
  if (!info.hasIos) {
    throw new Error(
      `No 'ios/' directory found in ${cwd}. Run 'flutter create --platforms=ios .' inside your project first.`
    );
  }
  return info;
}

export function defaultRepoName(cwd) {
  const info = parsePubspec(cwd);
  return (info?.name || basename(cwd)).toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
}
