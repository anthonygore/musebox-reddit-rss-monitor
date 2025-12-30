import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

class EmailService {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.mailerSend = new MailerSend({
      apiKey: config.mailersend.apiToken
    });
  }

  /**
   * Format posts into plain text email body
   * @param {Object[]} posts - Array of post objects
   * @returns {string} - Formatted email body
   */
  formatEmailBody(posts) {
    const header = `You have ${posts.length} new Reddit post${posts.length > 1 ? 's' : ''}:\n\n`;

    const postsList = posts.map((post, index) => {
      let postText = `${index + 1}.\nr/${post.subreddit}\n${post.title}\n${post.link}`;

      // Check if AI decided to reply or skip
      if (post.shouldReply === false) {
        // AI decided to skip this post
        const reason = post.skipReason || 'Not relevant';
        postText += `\n\nAI Decision: SKIP\nReason: ${reason}`;
      } else if (post.aiReply) {
        // AI generated a reply
        postText += `\n\nAI Suggested Reply:\n${post.aiReply.split('\n').join('\n')}`;
      }

      return postText;
    }).join('\n\n');

    const footer = `\n\n---\nReddit RSS Monitor`;

    return header + postsList + footer;
  }

  /**
   * Send email notification with new posts
   * @param {Object[]} posts - Array of new posts
   * @returns {Promise<boolean>} - True if email sent successfully
   */
  async sendNotification(posts) {
    if (!posts || posts.length === 0) {
      this.logger.debug('No posts to send, skipping email');
      return false;
    }

    // Filter out posts that AI decided to skip
    const postsToEmail = posts.filter(post => post.shouldReply !== false);

    if (postsToEmail.length === 0) {
      this.logger.info('All posts were skipped by AI, no email sent');
      return false;
    }

    if (postsToEmail.length < posts.length) {
      const skippedCount = posts.length - postsToEmail.length;
      this.logger.info(`Filtered out ${skippedCount} skipped post(s), sending ${postsToEmail.length} post(s)`);
    }

    try {
      const sentFrom = new Sender(
        this.config.email.fromEmail,
        this.config.email.fromName
      );

      const recipients = [
        new Recipient(this.config.email.toEmail)
      ];

      let subject = postsToEmail.length === 1
        ? `New Reddit post from r/${postsToEmail[0].subreddit}`
        : `${postsToEmail.length} new Reddit posts`;

      // Prefix with [dev] if in development mode
      if (this.config.env.isDevelopment) {
        subject = `[dev] ${subject}`;
      }

      const emailBody = this.formatEmailBody(postsToEmail);

      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject(subject)
        .setText(emailBody);

      this.logger.info(`Sending email notification for ${postsToEmail.length} post(s)...`);

      await this.mailerSend.email.send(emailParams);

      this.logger.info('Email sent successfully');
      return true;

    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      if (error.body) {
        this.logger.error('Error details:', JSON.stringify(error.body));
      }
      return false;
    }
  }
}

export default EmailService;
