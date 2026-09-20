import { spawnSync, spawn } from 'node:child_process';

const IS_WIN = process.platform === 'win32';

/** Run a command and capture output. Never throws. */
export function sh(cmd, args = [], opts = {}) {
  const r = spawnSync(cmd, args, {
    encoding: 'utf8',
    windowsHide: true,
    ...opts,
  });

  if (r.error && IS_WIN && r.error.code === 'ENOENT') {
    // Fallback with cmd.exe wrapper for Windows batch/cmd scripts (.cmd / .bat)
    const cmdStr = [cmd, ...args.map((a) => (a.includes(' ') ? `"${a}"` : a))].join(' ');
    const fallback = spawnSync('cmd.exe', ['/d', '/s', '/c', cmdStr], {
      encoding: 'utf8',
      windowsHide: true,
      ...opts,
    });
    return {
      ok: fallback.status === 0,
      code: fallback.status ?? (fallback.error ? 1 : 0),
      out: (fallback.stdout ?? '').trim(),
      err: (fallback.stderr ?? (fallback.error ? fallback.error.message : '')).trim(),
    };
  }

  return {
    ok: r.status === 0,
    code: r.status ?? (r.error ? 1 : 0),
    out: (r.stdout ?? '').trim(),
    err: (r.stderr ?? (r.error ? r.error.message : '')).trim(),
  };
}

/** Run a command and throw on non-zero exit code. */
export function shx(cmd, args = [], opts = {}) {
  const r = sh(cmd, args, opts);
  if (!r.ok) {
    const err = new Error(r.err || r.out || `Command failed: ${cmd} ${args.join(' ')}`);
    err.code = r.code;
    err.stdout = r.out;
    err.stderr = r.err;
    throw err;
  }
  return r;
}

/** Check if a command is available on the system PATH. */
export function has(cmd) {
  if (IS_WIN) {
    return sh('where.exe', [cmd]).ok || sh('which', [cmd]).ok;
  }
  return sh('which', [cmd]).ok;
}

/** Open a URL in the user's default browser. */
export function open(url) {
  if (IS_WIN) {
    spawn('cmd.exe', ['/c', 'start', '', url], { detached: true, stdio: 'ignore', windowsHide: true });
  } else if (process.platform === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' });
  } else {
    spawn('xdg-open', [url], { detached: true, stdio: 'ignore' });
  }
}

/** Async sleep helper */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
