// Polyfill fetch for Node.js < 18
if (!globalThis.fetch) {
  const nodeFetch = await import('node-fetch');
  globalThis.fetch = nodeFetch.default;
  globalThis.Headers = nodeFetch.Headers;
  globalThis.Request = nodeFetch.Request;
  globalThis.Response = nodeFetch.Response;
}

import cron from 'node-cron';
import config from './config/env.js';
import Logger from './utils/logger.js';
import RssService from './services/rssService.js';
import EmailService from './services/emailService.js';
import PostTracker from './services/postTracker.js';
import OpenAIService from './services/openaiService.js';

// Initialize logger
const logger = new Logger(config.logging.level);

// Initialize services
const rssService = new RssService(logger);
const emailService = new EmailService(config, logger);
const postTracker = new PostTracker(logger);
const openaiService = new OpenAIService(config, logger);

/**
 * Main monitoring task - checks RSS feeds for new posts
 */
async function monitorFeeds() {
  try {
    logger.info('Starting RSS feed check...');

    // Fetch all RSS feeds
    const feedResults = await rssService.fetchMultipleFeeds(config.monitoring.subreddits);

    // Get all posts from successful feeds
    const allPosts = rssService.getAllPosts(feedResults);
    logger.info(`Retrieved ${allPosts.length} total posts`);

    // Filter for new posts (recent and not seen)
    const newPosts = allPosts.filter(post =>
      postTracker.isNewPost(post, config.monitoring.postAgeMinutes)
    );

    logger.info(`Found ${newPosts.length} new post(s)`);

    // Send email notification if there are new posts
    if (newPosts.length > 0) {
      // Fetch full post content for each new post
      logger.info('Fetching full post content...');
      const postsWithFullContent = await Promise.all(
        newPosts.map(async (post) => {
          const fullContent = await rssService.fetchFullPostContent(post.link);
          return {
            ...post,
            fullContent: fullContent || post.contentSnippet || post.content
          };
        })
      );

      // Analyze posts with AI if enabled (but don't filter them out)
      let analyzedPosts = postsWithFullContent;
      if (openaiService.isEnabled()) {
        analyzedPosts = await openaiService.analyzeAllPosts(postsWithFullContent);
      }

      // Send email for ALL posts (including ones AI decided to skip)
      const emailSent = await emailService.sendNotification(analyzedPosts);

      // Mark posts as seen only if email was sent successfully
      if (emailSent) {
        newPosts.forEach(post => postTracker.markAsSeen(post.id));
      }
    }

    // Clean up old posts from memory
    postTracker.cleanup();

    logger.info(`Check complete. Tracking ${postTracker.getTrackedCount()} posts in memory.`);

  } catch (error) {
    logger.error('Error during feed monitoring:', error.message);
    logger.error(error.stack);
  }
}

/**
 * Initialize and start the application
 */
async function start() {
  logger.info('=== Reddit RSS Monitor Starting ===');
  logger.info(`Monitoring subreddits: ${config.monitoring.subreddits.join(', ')}`);
  logger.info(`Check interval: every ${config.monitoring.checkIntervalMinutes} minute(s)`);
  logger.info(`Post age window: ${config.monitoring.postAgeMinutes} minute(s)`);
  logger.info(`Email notifications to: ${config.email.toEmail}`);

  // Run initial check immediately
  logger.info('Running initial feed check...');
  await monitorFeeds();

  // Schedule recurring checks using cron
  // Pattern: */N * * * * means "every N minutes"
  const cronPattern = `*/${config.monitoring.checkIntervalMinutes} * * * *`;
  logger.info(`Setting up cron schedule: ${cronPattern}`);

  const task = cron.schedule(cronPattern, async () => {
    await monitorFeeds();
  });

  logger.info('Cron job scheduled successfully');
  logger.info('Press Ctrl+C to stop');

  // Graceful shutdown handler
  const shutdown = () => {
    logger.info('Shutting down gracefully...');
    task.stop();
    logger.info('Cron job stopped');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Start the application
start().catch(error => {
  logger.error('Fatal error during startup:', error.message);
  logger.error(error.stack);
  process.exit(1);
});
