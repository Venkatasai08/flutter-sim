import * as gh from '../lib/gh.js';
import { loadSession, clearSession } from '../lib/session.js';
import { ok, info, warn, err, bold } from '../lib/ui.js';

export async function down(cwd) {
  const session = loadSession(cwd);
  if (!session) {
    info('No active flutter-sim session found to terminate.');
    return;
  }

  if (session.runId) {
    info(`Cancelling GitHub Actions workflow run ${bold(session.runId)}...`);
    const cancelled = gh.cancelRun(cwd, session.runId);
    if (cancelled) {
      ok(`Workflow run cancelled. Runner and stream are terminated.`);
    } else {
      warn(`Could not cancel run ${session.runId} (it may have already stopped).`);
    }
  }

  clearSession(cwd);
  ok('Local session cleared.');
}
