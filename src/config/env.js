import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

/**
 * Load OpenAI prompt from file
 * @returns {string} - Prompt text or default prompt
 */
function loadOpenAIPrompt() {
  const promptFilePath = path.join(__dirname, '../../openai-prompt.txt');

  try {
    if (fs.existsSync(promptFilePath)) {
      const prompt = fs.readFileSync(promptFilePath, 'utf8').trim();
      if (prompt.length > 0) {
        return prompt;
      }
    }
  } catch (error) {
    console.error(`Warning: Could not read openai-prompt.txt: ${error.message}`);
  }

  // Fallback to default prompt
  return 'You are a helpful assistant analyzing Reddit posts. Decide if the post is worth replying to and generate a thoughtful response. Respond in JSON format: {"should_reply": true/false, "reply": "your reply", "reason": "reason if skipping"}.';
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
  },

  // OpenAI (optional - feature disabled if API key not provided)
  openai: {
    apiKey: getEnv('OPENAI_API_KEY', ''),
    model: getEnv('OPENAI_MODEL', 'gpt-4o-mini'),
    prompt: loadOpenAIPrompt()
  },

  // Environment
  env: {
    nodeEnv: getEnv('NODE_ENV', 'development'),
    isDevelopment: getEnv('NODE_ENV', 'development') === 'development',
    isProduction: getEnv('NODE_ENV', 'development') === 'production'
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
