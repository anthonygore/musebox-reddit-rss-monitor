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
      return `${index + 1}. r/${post.subreddit}: ${post.title}\n   ${post.link}`;
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

    try {
      const sentFrom = new Sender(
        this.config.email.fromEmail,
        this.config.email.fromName
      );

      const recipients = [
        new Recipient(this.config.email.toEmail)
      ];

      const subject = posts.length === 1
        ? `New Reddit post from r/${posts[0].subreddit}`
        : `${posts.length} new Reddit posts`;

      const emailBody = this.formatEmailBody(posts);

      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject(subject)
        .setText(emailBody);

      this.logger.info(`Sending email notification for ${posts.length} post(s)...`);

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
