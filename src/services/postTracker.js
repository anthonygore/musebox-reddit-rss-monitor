import { isWithinTimeWindow } from '../utils/dateUtils.js';

class PostTracker {
  constructor(logger) {
    this.logger = logger;
    this.seenPosts = new Map(); // Map<postId, timestamp>
    this.MAX_AGE_MS = 60 * 60 * 1000; // Keep posts for 1 hour
  }

  /**
   * Check if a post is new (recent and not seen before)
   * @param {Object} post - Post object with id and pubDate
   * @param {number} timeWindowMinutes - Time window in minutes
   * @returns {boolean} - True if the post is new
   */
  isNewPost(post, timeWindowMinutes) {
    if (!post.id || !post.pubDate) {
      this.logger.error('Invalid post object:', post);
      return false;
    }

    const isRecent = isWithinTimeWindow(post.pubDate, timeWindowMinutes);
    const notSeen = !this.seenPosts.has(post.id);

    if (isRecent && notSeen) {
      this.logger.debug(`New post detected: ${post.id}`);
      return true;
    }

    return false;
  }

  /**
   * Mark a post as seen
   * @param {string} postId - The ID of the post
   */
  markAsSeen(postId) {
    this.seenPosts.set(postId, Date.now());
    this.logger.debug(`Post marked as seen: ${postId} (total tracked: ${this.seenPosts.size})`);
  }

  /**
   * Clean up old posts from memory to prevent unbounded growth
   * Removes posts older than MAX_AGE_MS
   */
  cleanup() {
    const now = Date.now();
    let removedCount = 0;

    for (const [postId, timestamp] of this.seenPosts.entries()) {
      if (now - timestamp > this.MAX_AGE_MS) {
        this.seenPosts.delete(postId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.info(`Cleaned up ${removedCount} old posts from memory (remaining: ${this.seenPosts.size})`);
    }
  }

  /**
   * Get the number of posts currently being tracked
   * @returns {number} - Number of tracked posts
   */
  getTrackedCount() {
    return this.seenPosts.size;
  }
}

export default PostTracker;
