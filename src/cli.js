import { init } from './commands/init.js';
import { up } from './commands/up.js';
import { status } from './commands/status.js';
import { down } from './commands/down.js';
import { doctor } from './commands/doctor.js';
import { upload } from './commands/upload.js';
import { bold, dim, cyan, yellow } from './lib/ui.js';

const HELP = `
${bold('flutter-sim')} — stream an interactive iOS Simulator of your Flutter app from GitHub Actions to your browser

${bold('USAGE')}
  flutter-sim <command> [options]

${bold('COMMANDS')}
  up        Push, build on a macOS runner, and open the live simulator ${dim('(default)')}
  init      Write .github/workflows/flutter-sim.yml and the auth gate into your project
  status    Show the active session and its stream URL
  down      Cancel the runner and stop the stream
  doctor    Check local environment and prerequisites
  upload    Upload a prebuilt simulator build to draft release

${bold('OPTIONS')} ${dim('(for flutter-sim up)')}
  --minutes <n>           Stream lifetime in minutes                ${dim('default 30, max 350')}
  --device <name>         iOS Simulator device                      ${dim('default "iPhone 16 Pro"')}
  --flutter-version <v>   Flutter SDK version                       ${dim('e.g. 3.24.0 (defaults to channel latest)')}
  --flutter-channel <c>   Flutter release channel                   ${dim('stable | beta | master, default stable')}
  --mode <m>              build | app                               ${dim('default build')}
  --app <url>             URL of a prebuilt simulator .app archive  ${dim('(skips compiling)')}
  --app-file <path>       Upload local .app/.tar.gz and run it
  --app-release <name>    Run an asset already uploaded to release
  --export                Download built .app as artifact
  --public                Create public repository                  ${dim('(unlimited free GitHub minutes)')}
  --private               Create private repository
  --repo <name>           Custom repository name
  --fps <n>               MJPEG framerate                           ${dim('default 30')}
  --quality <n>           MJPEG quality                             ${dim('0.05 - 1.0, default 0.7')}
  --no-open               Do not automatically open browser

${bold('EXAMPLES')}
  flutter-sim up
  flutter-sim up --minutes 45 --device "iPhone 16 Pro Max"
  flutter-sim up --flutter-version 3.24.3
  flutter-sim up --app https://example.com/Runner.app.tar.gz
  flutter-sim doctor
  flutter-sim down
`;

export function parseArgs(args) {
  const flags = {};
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (key.startsWith('no-')) {
        flags[key] = true;
        flags[key.slice(3)] = false;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        flags[key] = args[++i];
      } else {
        flags[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        flags[key] = args[++i];
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { positional, flags };
}

export async function main(argv = process.argv.slice(2)) {
  const { positional, flags } = parseArgs(argv);
  const command = positional[0] || 'up';
  const cwd = process.cwd();

  if (flags.help || flags.h || command === 'help') {
    console.log(HELP);
    return;
  }

  switch (command) {
    case 'up':
      await up(cwd, flags);
      break;
    case 'init':
      await init(cwd, flags);
      break;
    case 'status':
      await status(cwd);
      break;
    case 'down':
      await down(cwd);
      break;
    case 'doctor':
      await doctor(cwd);
      break;
    case 'upload':
      await upload(cwd, positional[1] || flags.file);
      break;
    default:
      console.error(`Unknown command: ${command}\nRun 'flutter-sim --help' for usage.`);
      process.exit(1);
  }
}
