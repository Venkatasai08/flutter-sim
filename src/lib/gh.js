import { sh, shx, has, sleep } from './proc.js';

export function requireAuth() {
  if (!has('gh')) {
    throw new Error('GitHub CLI (gh) not found. Install it with winget or brew.');
  }
  const r = sh('gh', ['auth', 'status']);
  if (!r.ok) {
    throw new Error('Not logged in to GitHub. Please run: gh auth login');
  }
}

/** `gh api <path>` returning parsed JSON. Returns null on failure. */
export function api(path, extra = []) {
  const r = sh('gh', ['api', path, ...extra]);
  if (!r.ok) return null;
  try {
    return JSON.parse(r.out);
  } catch {
    return null;
  }
}

/** owner/repo for the git repository in cwd. */
export function nameWithOwner(cwd) {
  const r = sh('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], { cwd });
  return r.ok && r.out ? r.out : null;
}

export function createRepo(cwd, name, { isPublic = true, branch = 'main' } = {}) {
  const args = [
    'repo',
    'create',
    name,
    isPublic ? '--public' : '--private',
    '--source=.',
    '--remote=origin',
    '--push',
  ];
  shx('gh', args, { cwd });
  sh('git', ['branch', '--set-upstream-to', `origin/${branch}`, branch], { cwd });
  return nameWithOwner(cwd);
}

export function isPublicRepo(cwd) {
  const r = sh('gh', ['repo', 'view', '--json', 'visibility', '-q', '.visibility'], { cwd });
  return r.ok && r.out.toUpperCase() === 'PUBLIC';
}

/**
 * Trigger workflow run via `gh workflow run`.
 * Newly created/pushed workflows take 5-15 seconds for GitHub's backend to index
 * the YAML `workflow_dispatch` trigger, temporarily returning HTTP 404 or HTTP 422.
 */
export async function dispatch(cwd, workflow, ref, inputs = {}, { attempts = 15 } = {}) {
  const args = ['workflow', 'run', workflow, '--ref', ref];
  for (const [k, v] of Object.entries(inputs)) {
    if (v !== undefined && v !== null && v !== '') {
      args.push('-f', `${k}=${v}`);
    }
  }

  let last = '';
  for (let i = 0; i < attempts; i++) {
    const r = sh('gh', args, { cwd });
    if (r.ok) return;

    last = r.err || r.out;

    // Retry on temporary indexing errors from GitHub API
    const isIndexingError = /could not find|not found|404|422|workflow_dispatch|does not exist|disabled|dispatchevent/i.test(last);
    if (!isIndexingError && i > 0) {
      break;
    }

    await sleep(4000);
  }

  throw new Error(`Could not dispatch workflow '${workflow}': ${last}`);
}

/** Get recent workflow runs for correlation. */
export function getRecentRuns(cwd, workflow, branch) {
  const res = api(`repos/:owner/:repo/actions/workflows/${workflow}/runs?branch=${branch}&per_page=5`);
  return res?.workflow_runs || [];
}

/** Read commit status for live stream URL discovery. */
export function readStatus(cwd, repo, sha, context) {
  if (!repo || !sha) return null;
  const statuses = api(`repos/${repo}/commits/${sha}/statuses`);
  if (!Array.isArray(statuses)) return null;
  return statuses.find((s) => s.context === context) || null;
}

export function getRun(cwd, runId) {
  if (!runId) return null;
  return api(`repos/:owner/:repo/actions/runs/${runId}`);
}

export function cancelRun(cwd, runId) {
  if (!runId) return false;
  return sh('gh', ['run', 'cancel', String(runId)], { cwd }).ok;
}
