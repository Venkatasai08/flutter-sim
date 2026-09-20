import * as gh from '../lib/gh.js';
import { loadSession } from '../lib/session.js';
import { info, ok, warn, dim, bold, cyan, green, red } from '../lib/ui.js';

export async function status(cwd) {
  const session = loadSession(cwd);
  if (!session) {
    info('No active or recent flutter-sim session recorded for this project.');
    return;
  }

  const age = Math.round((Date.now() - session.startedAt) / 60000);
  const run = session.runId ? gh.getRun(cwd, session.runId) : null;
  const commitStatus = gh.readStatus(cwd, session.repo, session.sha, session.context);

  console.log(`\n${bold('flutter-sim session status')}\n`);
  console.log(`  Session ID:   ${bold(session.sessionId)}`);
  console.log(`  Device:       ${session.device || 'iPhone 16 Pro'}`);
  console.log(`  Started:      ${age} minute(s) ago (duration: ${session.minutes}m)`);
  console.log(`  Repository:   ${session.repo || 'unknown'}`);

  const isExpired = run ? run.status === 'completed' : age > (session.minutes || 30);

  if (run) {
    const runState = run.status === 'completed' ? (run.conclusion === 'success' ? green('completed (session ended)') : red(run.conclusion)) : cyan(`${run.status} (active)`);
    console.log(`  Run Status:   ${runState} ${dim(`(ID: ${session.runId})`)}`);
    console.log(`  Run Logs:     ${dim(run.html_url)}`);
  }

  if (!isExpired && (session.streamUrl || commitStatus?.target_url)) {
    const url = session.streamUrl || `${commitStatus.target_url}/?k=${session.token}`;
    console.log(`\n  ${green('● Live Stream URL:')} ${cyan(bold(url))}`);
  } else if (isExpired) {
    console.log(`\n  ${red('● Session Expired:')} ${dim('This session has finished. Run')} ${bold('flutter-sim up')} ${dim('to start a new live simulator.')}`);
  } else {
    console.log(`\n  ${dim('● Stream URL:')}   ${dim('Not available yet or runner starting up')}`);
  }
  console.log('');
}
