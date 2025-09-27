const chalk = require('chalk');

class Spinner {
  constructor(message = 'Loading...', options = {}) {
    this.message = message;
    this.frames = options.frames || ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.interval = options.interval || 80;
    this.stream = options.stream || process.stdout;
    this.currentFrame = 0;
    this.isSpinning = false;
    this.timer = null;
  }

  start() {
    if (this.isSpinning) return;

    this.isSpinning = true;
    this.currentFrame = 0;

    // Hide cursor
    this.stream.write('\x1B[?25l');

    this.timer = setInterval(() => {
      const frame = this.frames[this.currentFrame];
      const text = `${chalk.cyan(frame)} ${this.message}`;

      // Clear line and write new content
      this.stream.write('\r\x1B[K' + text);

      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, this.interval);

    return this;
  }

  stop(finalMessage = null) {
    if (!this.isSpinning) return;

    this.isSpinning = false;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // Clear line
    this.stream.write('\r\x1B[K');

    // Show cursor
    this.stream.write('\x1B[?25h');

    if (finalMessage) {
      this.stream.write(finalMessage + '\n');
    }

    return this;
  }

  succeed(message) {
    this.stop(chalk.green(`✅ ${message || this.message}`));
    return this;
  }

  success(message) {
    return this.succeed(message);
  }

  fail(message) {
    this.stop(chalk.red(`❌ ${message || this.message}`));
    return this;
  }

  error(message) {
    return this.fail(message);
  }

  warn(message) {
    this.stop(chalk.yellow(`⚠️  ${message || this.message}`));
    return this;
  }

  info(message) {
    this.stop(chalk.blue(`ℹ️  ${message || this.message}`));
    return this;
  }

  updateMessage(newMessage) {
    this.message = newMessage;
    return this;
  }
}

// Convenience function for quick spinners
function createSpinner(message, options) {
  return new Spinner(message, options);
}

// Multi-line progress display
class ProgressDisplay {
  constructor() {
    this.lines = [];
    this.isActive = false;
  }

  start() {
    this.isActive = true;
    // Hide cursor
    process.stdout.write('\x1B[?25l');
  }

  updateLine(index, content) {
    if (!this.isActive) return;

    while (this.lines.length <= index) {
      this.lines.push('');
    }

    this.lines[index] = content;
    this.render();
  }

  render() {
    if (!this.isActive) return;

    // Move cursor to beginning of our display area
    process.stdout.write(`\x1B[${this.lines.length}A`);

    // Clear all lines and redraw
    for (let i = 0; i < this.lines.length; i++) {
      process.stdout.write('\r\x1B[K' + this.lines[i] + '\n');
    }
  }

  stop() {
    this.isActive = false;
    // Show cursor
    process.stdout.write('\x1B[?25h');
  }
}

module.exports = {
  Spinner,
  createSpinner,
  ProgressDisplay
};