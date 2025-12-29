import OpenAI from 'openai';

class OpenAIService {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.enabled = !!config.openai.apiKey;

    if (this.enabled) {
      this.client = new OpenAI({
        apiKey: config.openai.apiKey,
        timeout: 30000 // 30 second timeout
      });
      this.logger.info('OpenAI service initialized');
    } else {
      this.logger.info('OpenAI service disabled (no API key provided)');
    }
  }

  /**
   * Generate a reply for a single post
   * @param {Object} post - Post object with title, content, link, subreddit
   * @returns {Promise<string|null>} - Generated reply or null if failed
   */
  async generateReply(post) {
    if (!this.enabled) {
      return null;
    }

    try {
      const systemMessage = this.config.openai.prompt;
      const userMessage = this.formatPostForPrompt(post);

      // Log the complete prompt being sent to OpenAI for auditing
      this.logger.info(`\n${'='.repeat(80)}\nOpenAI Prompt for post ${post.id}:\n${'='.repeat(80)}`);
      this.logger.info(`SYSTEM: ${systemMessage}`);
      this.logger.info(`${'─'.repeat(80)}`);
      this.logger.info(`USER:\n${userMessage}`);
      this.logger.info(`${'='.repeat(80)}\n`);

      const completion = await this.client.chat.completions.create({
        model: this.config.openai.model,
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 600,
        temperature: 0.2
      });

      const responseText = completion.choices[0]?.message?.content?.trim();

      if (!responseText) {
        this.logger.error(`No response from OpenAI for post ${post.id}`);
        return { shouldReply: false, reply: null, reason: 'No response from AI' };
      }

      // Parse JSON response
      try {
        const response = JSON.parse(responseText);
        const shouldReply = response.should_reply === true;
        const reply = response.reply || null;
        const reason = response.reason || 'Not relevant';

        this.logger.info(`AI Decision for post ${post.id}: ${shouldReply ? 'REPLY' : 'SKIP'}`);
        if (shouldReply && reply) {
          this.logger.debug(`AI reply: ${reply.substring(0, 50)}...`);
        } else if (!shouldReply && reason) {
          this.logger.debug(`Skip reason: ${reason}`);
        }

        return { shouldReply, reply, reason };

      } catch (parseError) {
        this.logger.error(`Failed to parse JSON response for post ${post.id}: ${parseError.message}`);
        this.logger.error(`Raw response: ${responseText}`);
        return { shouldReply: false, reply: null, reason: 'AI response error' };
      }

    } catch (error) {
      this.logger.error(`Failed to generate AI reply for post ${post.id}: ${error.message}`);

      // Log specific error types for debugging
      if (error.status === 429) {
        this.logger.error('OpenAI rate limit exceeded');
      } else if (error.status === 401) {
        this.logger.error('OpenAI API key invalid');
      }

      return { shouldReply: false, reply: null, reason: 'OpenAI API error' };
    }
  }

  /**
   * Analyze all posts with AI but don't filter them out
   * @param {Object[]} posts - Array of post objects
   * @returns {Promise<Object[]>} - All posts with shouldReply and aiReply properties
   */
  async analyzeAllPosts(posts) {
    if (!this.enabled || posts.length === 0) {
      return posts;
    }

    this.logger.info(`Analyzing ${posts.length} post(s) with AI...`);

    // Generate replies for each post individually
    const analyzedPosts = await Promise.all(
      posts.map(async (post) => {
        const result = await this.generateReply(post);
        return {
          ...post,
          shouldReply: result.shouldReply,
          aiReply: result.reply,
          skipReason: result.shouldReply ? null : result.reason
        };
      })
    );

    const replyCount = analyzedPosts.filter(p => p.shouldReply).length;
    const skipCount = analyzedPosts.filter(p => !p.shouldReply).length;

    this.logger.info(`AI Analysis: ${replyCount} posts to reply to, ${skipCount} posts to skip`);

    return analyzedPosts;
  }

  /**
   * Generate replies for multiple posts and filter based on AI decision
   * @param {Object[]} posts - Array of post objects
   * @returns {Promise<Object[]>} - Posts that AI decided should be replied to, with aiReply property
   */
  async generateReplies(posts) {
    if (!this.enabled || posts.length === 0) {
      return posts;
    }

    this.logger.info(`Analyzing ${posts.length} post(s) with AI...`);

    // Generate replies for each post individually
    const analyzedPosts = await Promise.all(
      posts.map(async (post) => {
        const result = await this.generateReply(post);
        return {
          ...post,
          shouldReply: result.shouldReply,
          aiReply: result.reply
        };
      })
    );

    // Filter to only posts that AI decided should be replied to
    const postsToReply = analyzedPosts.filter(p => p.shouldReply);
    const skippedCount = analyzedPosts.length - postsToReply.length;

    this.logger.info(`AI Analysis: ${postsToReply.length} posts to reply to, ${skippedCount} posts skipped`);

    return postsToReply;
  }

  /**
   * Format post data for OpenAI prompt
   * @param {Object} post - Post object
   * @returns {string} - Formatted message for OpenAI
   */
  formatPostForPrompt(post) {
    let message = `Subreddit: r/${post.subreddit}\n\n`;
    message += `Post Title: ${post.title}\n\n`;

    // Use fullContent (fetched from Reddit), fallback to RSS snippet
    const content = post.fullContent || post.content || post.contentSnippet;
    if (content && content.trim().length > 0) {
      message += `Post Content:\n${content}\n\n`;
    } else {
      message += `Post Content: [No text content - may be link/image/video post]\n\n`;
    }

    message += `Post Link: ${post.link}`;

    return message;
  }

  /**
   * Check if the service is enabled
   * @returns {boolean} - True if OpenAI is configured
   */
  isEnabled() {
    return this.enabled;
  }
}

export default OpenAIService;
