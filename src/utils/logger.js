const LOG_LEVELS = {
  debug: 0,
  info: 1,
  error: 2
};

class Logger {
  constructor(level = 'info') {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.info;
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : arg
    ).join(' ') : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
  }

  debug(message, ...args) {
    if (this.level <= LOG_LEVELS.debug) {
      console.log(this.formatMessage('debug', message, ...args));
    }
  }

  info(message, ...args) {
    if (this.level <= LOG_LEVELS.info) {
      console.log(this.formatMessage('info', message, ...args));
    }
  }

  error(message, ...args) {
    if (this.level <= LOG_LEVELS.error) {
      console.error(this.formatMessage('error', message, ...args));
    }
  }
}

export default Logger;
