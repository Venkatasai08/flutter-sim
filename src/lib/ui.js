/** Terminal styling and formatted output */

export const bold = (s) => `\x1b[1m${s}\x1b[0m`;
export const dim = (s) => `\x1b[2m${s}\x1b[0m`;
export const green = (s) => `\x1b[32m${s}\x1b[0m`;
export const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
export const red = (s) => `\x1b[31m${s}\x1b[0m`;
export const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
export const magenta = (s) => `\x1b[35m${s}\x1b[0m`;

export function step(msg) {
  console.log(`${cyan('›')} ${msg}`);
}

export function ok(msg) {
  console.log(`${green('✓')} ${msg}`);
}

export function warn(msg) {
  console.log(`${yellow('!')} ${msg}`);
}

export function err(msg) {
  console.error(`${red('✗')} ${msg}`);
}

export function info(msg) {
  console.log(`${dim('•')} ${msg}`);
}

export function createSpinner(initialText = '') {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  let text = initialText;
  let timer = null;

  function render() {
    process.stdout.write(`\r${cyan(frames[i++ % frames.length])} ${text}`);
  }

  return {
    start(t) {
      if (t) text = t;
      if (timer) clearInterval(timer);
      timer = setInterval(render, 80);
      render();
    },
    update(t) {
      text = t;
    },
    stop(finalText = '', success = true) {
      if (timer) clearInterval(timer);
      timer = null;
      process.stdout.write('\r\x1b[K');
      if (finalText) {
        if (success) ok(finalText);
        else err(finalText);
      }
    },
  };
}
