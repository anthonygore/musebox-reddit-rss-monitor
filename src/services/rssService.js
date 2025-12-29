import Parser from 'rss-parser';

class RssService {
  constructor(logger) {
    this.logger = logger;
    this.parser = new Parser({
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
  }

  /**
   * Fetch and parse RSS feed for a subreddit
   * @param {string} subreddit - Name of the subreddit (without r/)
   * @returns {Promise<Object>} - Object with success status and posts array
   */
  async fetchFeed(subreddit) {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/.rss`;
      this.logger.debug(`Fetching RSS feed: ${url}`);

      const feed = await this.parser.parseURL(url);

      // Parse posts from feed items
      const posts = feed.items.map(item => ({
        id: item.id || item.guid,
        title: item.title,
        link: item.link,
        pubDate: item.pubDate || item.isoDate,
        subreddit: subreddit
      }));

      this.logger.debug(`Fetched ${posts.length} posts from r/${subreddit}`);

      return {
        success: true,
        subreddit,
        posts
      };

    } catch (error) {
      this.logger.error(`Failed to fetch RSS for r/${subreddit}: ${error.message}`);
      return {
        success: false,
        subreddit,
        error: error.message,
        posts: []
      };
    }
  }

  /**
   * Fetch RSS feeds for multiple subreddits
   * @param {string[]} subreddits - Array of subreddit names
   * @returns {Promise<Object[]>} - Array of results from each subreddit
   */
  async fetchMultipleFeeds(subreddits) {
    this.logger.info(`Fetching RSS feeds for ${subreddits.length} subreddits: ${subreddits.join(', ')}`);

    const results = await Promise.all(
      subreddits.map(subreddit => this.fetchFeed(subreddit))
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    this.logger.info(`Fetch complete: ${successCount} succeeded, ${failureCount} failed`);

    return results;
  }

  /**
   * Get all posts from multiple feed results
   * @param {Object[]} feedResults - Array of feed results
   * @returns {Object[]} - Flat array of all posts
   */
  getAllPosts(feedResults) {
    return feedResults
      .filter(result => result.success)
      .flatMap(result => result.posts);
  }
}

export default RssService;
