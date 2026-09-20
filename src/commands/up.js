import { randomBytes } from 'node:crypto';
import * as git from '../lib/git.js';
import * as gh from '../lib/gh.js';
import { sleep, open as openUrl } from '../lib/proc.js';
import { assertFlutterProject, defaultRepoName } from '../lib/flutter.js';
import { scaffold } from './init.js';
import { saveSession } from '../lib/session.js';
import * as ghrelease from '../lib/ghrelease.js';
import { info, ok, warn, step, createSpinner, bold, dim, cyan, green } from '../lib/ui.js';

const WORKFLOW = 'flutter-sim.yml';

export async function up(cwd, flags = {}) {
  const appFile = flags['app-file'];
  const appRelease = flags['app-release'];
  const mode = flags.app || appFile || appRelease ? 'app' : (flags.mode ?? 'build');

  if (mode !== 'app') {
    assertFlutterProject(cwd);
  }
  gh.requireAuth();

  step('Preparing Flutter repository');

  if (!git.isRepo(cwd)) {
    git.init(cwd);
    ok('Initialized git repository');
  }

  const branch = git.currentBranch(cwd);
  const message = flags.message ?? `flutter-sim update: ${new Date().toISOString()}`;

  if (git.isDirty(cwd) || !git.hasCommits(cwd)) {
    git.commitAll(cwd, message);
    ok(`Committed changes on ${bold(branch)}`);
  } else {
    info(`Working tree clean on ${bold(branch)}`);
  }

  let repo = gh.nameWithOwner(cwd);
  if (!repo) {
    const name = flags.repo ?? defaultRepoName(cwd);
    const isPublic = flags.public !== false; // default public for free GitHub minutes
    step(`Creating ${isPublic ? 'public' : 'private'} repository ${bold(name)}`);
    if (!isPublic) {
      warn(`Private repositories consume billed macOS minutes (10x multiplier). Use ${dim('--public')} for free minutes.`);
    }
    repo = gh.createRepo(cwd, name, { isPublic, branch });
    ok(`Created remote repository ${bold(repo)}`);
  } else {
    git.push(cwd, branch);
    ok(`Pushed to ${bold(repo)}`);
    if (!gh.isPublicRepo(cwd)) {
      warn(`${repo} is private — macOS minutes will be billed against your GitHub Actions quota.`);
    }
  }

  // Ensure workflow and auth gate are scaffolded and committed
  if (scaffold(cwd) || git.isDirty(cwd)) {
    git.commitAll(cwd, 'flutter-sim: add iOS simulator streaming workflow');
    git.push(cwd, branch);
    ok('Pushed flutter-sim workflow files');
  }

  let appReleaseAsset = '';
  if (appFile) {
    step(`Uploading prebuilt binary ${bold(appFile)} to draft release`);
    const uploaded = ghrelease.upload(cwd, repo, appFile);
    appReleaseAsset = uploaded.asset;
    ok(`Uploaded ${(uploaded.bytes / 1048576).toFixed(1)} MB as release asset`);
  } else if (appRelease && appRelease !== true) {
    appReleaseAsset = appRelease;
  }

  const sha = git.headSha(cwd);
  const session = randomBytes(4).toString('hex');
  const token = randomBytes(16).toString('hex');
  const context = `flutter-sim/${session}`;

  step(`Dispatching GitHub Actions build ${dim(`(session: ${session})`)}`);

  const minutes = String(flags.minutes ?? '30');
  const device = flags.device ?? 'iPhone 16 Pro';
  const flutterVersion = flags['flutter-version'] ?? '';
  const flutterChannel = flags['flutter-channel'] ?? 'stable';
  const runner = flags.runner ?? 'macos-15';
  const maxDimension = String(flags['max-dimension'] ?? '900');
  const videoFps = String(flags.fps ?? '30');
  const videoQuality = String(flags.quality ?? '0.7');
  const exportApp = flags.export ? 'true' : 'false';

  const inputs = {
    session,
    gate_token: token,
    minutes,
    device,
    mode,
    app_url: flags.app ?? '',
    app_release_asset: appReleaseAsset,
    flutter_version: flutterVersion,
    flutter_channel: flutterChannel,
    runner,
    max_dimension: maxDimension,
    video_fps: videoFps,
    video_quality: videoQuality,
    export_app: exportApp,
  };

  await gh.dispatch(cwd, WORKFLOW, branch, inputs);
  ok('Dispatched workflow run');

  // Find the dispatched run ID
  await sleep(4000);
  const recentRuns = gh.getRecentRuns(cwd, WORKFLOW, branch);
  const runId = recentRuns[0]?.id;

  if (runId) {
    info(`Workflow Run: ${cyan(`https://github.com/${repo}/actions/runs/${runId}`)}`);
  }

  saveSession(cwd, {
    sessionId: session,
    token,
    repo,
    sha,
    context,
    runId,
    branch,
    device,
    minutes: Number(minutes),
    startedAt: Date.now(),
  });

  const spinner = createSpinner('Waiting for macOS runner to boot simulator and open tunnel...');
  spinner.start();

  let streamUrl = null;
  const maxAttempts = 120; // 10 minutes polling
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(5000);

    const st = gh.readStatus(cwd, repo, sha, context);
    if (st && st.target_url) {
      streamUrl = `${st.target_url}/?k=${token}`;
      break;
    }

    if (runId) {
      const run = gh.getRun(cwd, runId);
      if (run?.status === 'completed') {
        if (run.conclusion !== 'success') {
          spinner.stop(`Workflow run ${run.conclusion || 'failed'}! Check logs: https://github.com/${repo}/actions/runs/${runId}`, false);
          return;
        }
      }
    }
  }

  if (!streamUrl) {
    spinner.stop('Timed out waiting for simulator tunnel URL. Check GitHub Actions logs.', false);
    return;
  }

  spinner.stop(`Simulator stream is live!`);

  console.log('\n' + bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(`  📱 ${bold(green('iOS Simulator Live Stream'))}`);
  console.log(`  🔗 ${cyan(bold(streamUrl))}`);
  console.log(`  ⏱️  Session active for ${bold(minutes)} minutes`);
  console.log(bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  saveSession(cwd, {
    sessionId: session,
    token,
    repo,
    sha,
    context,
    runId,
    branch,
    device,
    minutes: Number(minutes),
    startedAt: Date.now(),
    streamUrl,
  });

  if (flags.open !== false && !flags['no-open']) {
    info('Opening simulator in your default browser...');
    openUrl(streamUrl);
  }
}
