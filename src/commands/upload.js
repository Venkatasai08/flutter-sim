import * as gh from '../lib/gh.js';
import * as ghrelease from '../lib/ghrelease.js';
import { ok, step, err, bold, dim } from '../lib/ui.js';

export async function upload(cwd, file) {
  if (!file) {
    err('Please specify a file path to upload (e.g., flutter-sim upload ./build/Runner.app.tar.gz)');
    return;
  }

  gh.requireAuth();
  const repo = gh.nameWithOwner(cwd);
  if (!repo) {
    err('No GitHub remote found in current directory. Run `flutter-sim up` first to create the repo.');
    return;
  }

  step(`Uploading ${bold(file)} to ${bold(repo)} draft release...`);
  const uploaded = ghrelease.upload(cwd, repo, file);
  ok(`Uploaded ${(uploaded.bytes / 1048576).toFixed(1)} MB as ${bold(uploaded.asset)}`);
  console.log(`\nYou can now run this build with:\n  flutter-sim up --app-release ${uploaded.asset}\n`);
}
