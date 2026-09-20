import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { sh, has } from '../lib/proc.js';
import { assertFlutterProject } from '../lib/flutter.js';
import { WORKFLOW_PATH, GATE_PATH } from './init.js';
import { green, red, yellow, dim, bold } from '../lib/ui.js';

const PASS = green('✓');
const FAIL = red('✗');
const WARN = yellow('!');

export async function doctor(cwd) {
  const checks = [];
  const add = (icon, label, detail = '') => checks.push(`  ${icon} ${label}${detail ? ` ${dim(detail)}` : ''}`);

  console.log(`\n${bold('flutter-sim doctor')}\n`);

  // 1. Flutter Project check
  try {
    const pkg = assertFlutterProject(cwd);
    add(PASS, 'Flutter project', `${pkg.name} (${pkg.version || '1.0.0'})`);
  } catch (err) {
    add(FAIL, 'Flutter project', err.message.split('\n')[0]);
  }

  // 2. Git check
  add(has('git') ? PASS : FAIL, 'Git installed');

  // 3. GitHub CLI check
  if (!has('gh')) {
    add(FAIL, 'GitHub CLI (gh)', 'Run: winget install GitHub.cli');
  } else {
    add(PASS, 'GitHub CLI (gh)');
    const authStatus = sh('gh', ['auth', 'status']);
    if (!authStatus.ok) {
      add(FAIL, 'GitHub Authentication', 'Run: gh auth login');
    } else {
      add(PASS, 'GitHub Authentication');
    }
  }

  // 4. Flutter CLI local check (optional for remote builds, but good to know)
  if (has('flutter')) {
    add(PASS, 'Local Flutter SDK');
  } else {
    add(WARN, 'Local Flutter SDK', 'Optional (App will be built remotely on macOS runner)');
  }

  // 5. Workflow files check
  const hasWorkflow = existsSync(join(cwd, WORKFLOW_PATH));
  const hasGate = existsSync(join(cwd, GATE_PATH));
  if (hasWorkflow && hasGate) {
    add(PASS, 'flutter-sim files in repository');
  } else {
    add(WARN, 'flutter-sim files', 'Will be created automatically on next `flutter-sim up`');
  }

  console.log(checks.join('\n'));
  console.log('');
}
