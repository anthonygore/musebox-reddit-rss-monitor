import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Validate that a required environment variable exists
 * @param {string} varName - Name of the environment variable
 * @returns {string} - The value of the environment variable
 * @throws {Error} - If the environment variable is missing
 */
function requireEnv(varName) {
  const value = process.env[varName];
  if (!value) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
  return value;
}

/**
 * Get an optional environment variable with a default value
 * @param {string} varName - Name of the environment variable
 * @param {string} defaultValue - Default value if not set
 * @returns {string} - The value of the environment variable or default
 */
function getEnv(varName, defaultValue) {
  return process.env[varName] || defaultValue;
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Load and validate configuration
const config = {
  // MailerSend
  mailersend: {
    apiToken: requireEnv('MAILERSEND_API_TOKEN')
  },

  // Email settings
  email: {
    fromEmail: requireEnv('FROM_EMAIL'),
    fromName: getEnv('FROM_NAME', 'Reddit RSS Monitor'),
    toEmail: requireEnv('TO_EMAIL')
  },

  // Monitoring settings
  monitoring: {
    subreddits: requireEnv('SUBREDDITS').split(',').map(s => s.trim()).filter(s => s.length > 0),
    checkIntervalMinutes: parseInt(getEnv('CHECK_INTERVAL_MINUTES', '5'), 10),
    postAgeMinutes: parseInt(getEnv('POST_AGE_MINUTES', '5'), 10)
  },

  // Logging
  logging: {
    level: getEnv('LOG_LEVEL', 'info')
  }
};

// Validate configuration
if (!isValidEmail(config.email.fromEmail)) {
  throw new Error(`Invalid FROM_EMAIL: ${config.email.fromEmail}`);
}

if (!isValidEmail(config.email.toEmail)) {
  throw new Error(`Invalid TO_EMAIL: ${config.email.toEmail}`);
}

if (config.monitoring.subreddits.length === 0) {
  throw new Error('SUBREDDITS must contain at least one subreddit');
}

if (config.monitoring.checkIntervalMinutes < 1) {
  throw new Error('CHECK_INTERVAL_MINUTES must be at least 1');
}

if (config.monitoring.postAgeMinutes < 1) {
  throw new Error('POST_AGE_MINUTES must be at least 1');
}

export default config;
