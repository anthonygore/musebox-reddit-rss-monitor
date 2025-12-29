# Reddit RSS Monitor

A Node.js application that monitors multiple Reddit RSS feeds and sends email notifications for new posts via MailerSend.

## Features

- Monitor multiple subreddits simultaneously
- Check RSS feeds at configurable intervals (default: every 5 minutes)
- Only notify about posts published within a specific time window (default: last 5 minutes)
- **AI-generated reply suggestions** - Uses OpenAI to generate thoughtful replies for each post (optional)
- In-memory post tracking - no database required
- Automatic memory cleanup to prevent unbounded growth
- Email notifications via MailerSend
- Configurable via environment variables

## Prerequisites

- Node.js 14.0 or higher
- MailerSend account with verified domain
- MailerSend API token
- OpenAI API key (optional - for AI reply generation feature)

## MailerSend Setup

1. Sign up for a free MailerSend account at https://www.mailersend.com/
2. Verify your domain (required for sending emails)
3. Generate an API token from the MailerSend dashboard
4. The FROM_EMAIL must be from your verified domain

## OpenAI Setup (Optional)

The app can generate AI-powered reply suggestions for each Reddit post using OpenAI's API. This feature is completely optional.

1. Sign up for an OpenAI account at https://platform.openai.com/
2. Generate an API key from the API keys section
3. Add the API key to your `.env` file (see Configuration below)
4. Customize the `OPENAI_PROMPT` to match your desired reply style

**Note:** If you don't provide an OpenAI API key, the app will work normally without AI reply generation.

**Cost:** Using `gpt-4o-mini` (default), expect ~$0.12/month for moderate usage (25 posts/day).

## Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Copy the example environment file:
```bash
cp .env.example .env
```

4. Edit `.env` and configure your settings:
```bash
# MailerSend API token (from your MailerSend dashboard)
MAILERSEND_API_TOKEN=your_token_here

# Email settings
FROM_EMAIL=monitor@yourdomain.com       # Must be from verified domain
FROM_NAME=Reddit RSS Monitor
TO_EMAIL=your-email@example.com         # Where you want notifications

# Monitoring settings
SUBREDDITS=technology,programming,nodejs    # Comma-separated list
CHECK_INTERVAL_MINUTES=5
POST_AGE_MINUTES=5

# Logging
LOG_LEVEL=info

# OpenAI Configuration (optional)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_PROMPT=You are a helpful musician responding to Reddit posts. Generate a thoughtful, friendly reply.
```

## Usage

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will:
1. Run an initial check immediately on startup
2. Continue checking every N minutes (configured via CHECK_INTERVAL_MINUTES)
3. Send email notifications when new posts are found
4. Run indefinitely until stopped

Press `Ctrl+C` to stop the application.

## Configuration

All configuration is done via environment variables in the `.env` file:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| MAILERSEND_API_TOKEN | Yes | - | Your MailerSend API token |
| FROM_EMAIL | Yes | - | Sender email (must be from verified domain) |
| FROM_NAME | No | Reddit RSS Monitor | Sender name |
| TO_EMAIL | Yes | - | Recipient email address |
| SUBREDDITS | Yes | - | Comma-separated list of subreddits (without r/) |
| CHECK_INTERVAL_MINUTES | No | 5 | How often to check RSS feeds |
| POST_AGE_MINUTES | No | 5 | Only consider posts this recent as "new" |
| LOG_LEVEL | No | info | Logging level (debug, info, error) |
| OPENAI_API_KEY | No | - | OpenAI API key (enables AI reply generation) |
| OPENAI_MODEL | No | gpt-4o-mini | OpenAI model to use |
| OPENAI_PROMPT | No | Default prompt | System prompt for AI reply generation |

## How It Works

1. **RSS Fetching**: Fetches RSS feeds from Reddit for configured subreddits
2. **Time Filtering**: Only considers posts published within the last N minutes
3. **Duplicate Detection**: Tracks seen post IDs in memory to prevent re-sending
4. **AI Reply Generation** (Optional): Generates suggested replies using OpenAI for each new post
5. **Email Notification**: Batches all new posts (with AI replies if enabled) into a single email per check
6. **Memory Cleanup**: Automatically removes posts older than 1 hour from tracking

## Project Structure

```
musebox-rss-monitor/
├── src/
│   ├── index.js                  # Main application entry point
│   ├── config/
│   │   └── env.js               # Environment configuration
│   ├── services/
│   │   ├── rssService.js        # RSS feed fetching
│   │   ├── emailService.js      # Email sending
│   │   ├── postTracker.js       # Post tracking
│   │   └── openaiService.js     # OpenAI reply generation
│   └── utils/
│       ├── logger.js            # Logging
│       └── dateUtils.js         # Date utilities
├── .env                          # Your configuration (not in git)
├── .env.example                  # Configuration template
└── package.json                  # Dependencies
```

## Notes

- **No Database**: Post tracking is in-memory only. If the app restarts, state is lost and recent posts may be re-sent.
- **Reddit RSS Delays**: Reddit RSS feeds may have 1-2 minute delays. The 5-minute window provides buffer time.
- **Email Batching**: All new posts found in one check cycle are sent in a single email.
- **Memory Management**: Posts older than 1 hour are automatically removed from memory.

## Troubleshooting

### Email not sending
- Verify your MailerSend API token is correct
- Ensure FROM_EMAIL is from a verified domain in MailerSend
- Check the logs for error messages

### Not detecting new posts
- Increase POST_AGE_MINUTES to capture a wider time window
- Check LOG_LEVEL=debug to see detailed information
- Verify the subreddit names are correct (no "r/" prefix)

### Application crashes
- Check all required environment variables are set
- Verify email addresses are in valid format
- Review error logs for specific issues

## License

ISC
