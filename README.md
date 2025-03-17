# Google Calendar & Telegram Bot

A project that sends notifications about events from Google Calendar and birthdays from Google Contacts to a Telegram channel or chat.

## Features

- Sending notifications about events from Google Calendar
- Sending notifications about birthdays from Google Contacts
- Customizable notification time
- Runs as a daemon on the server

## Requirements

- Node.js 14+ and Yarn
- Google account
- Telegram Bot Token

## Project Setup

### 1. Creating a project in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable APIs:
   - Google Calendar API
   - Google People API (for contacts access)
4. Configure OAuth 2.0:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Desktop app" application type
   - Enter a name and click "Create"
   - Download the JSON file with credentials
   - Save the file as `oauth-credentials.json` in the project root folder

### 2. Creating a Telegram bot

1. Open Telegram and find [@BotFather](https://t.me/BotFather)
2. Send the `/newbot` command and follow the instructions
3. Get the Bot Token
4. Create a channel or group and add the bot with administrator rights
5. Get the channel or group ID (you can use [@getidsbot](https://t.me/getidsbot))

### 3. Installation and configuration

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/google-cal-telegram.git
   cd google-cal-telegram
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Create a `.env` file in the project root folder:

   ```
   GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHANNEL_ID=your_telegram_channel_id
   NOTIFICATION_HOUR=9
   NOTIFICATION_MINUTE=0
   ```

4. Authorize with Google API:

   ```bash
   yarn auth-google
   ```

   - Open the URL that will be displayed in the console
   - Log in and grant access
   - Copy the code and paste it into the console

5. Check the setup:
   ```bash
   yarn check-setup
   ```

## Running the Project

### Development mode:

```bash
yarn dev
```

### Server deployment:

```bash
yarn build
yarn start
```

## Setting up cron for auto-start

To launch the application on server reboot, add the following line to crontab:

```
@reboot cd /path/to/project && yarn start
```

## Troubleshooting

### No access to contacts

- Make sure you have enabled the Google People API in Google Cloud Console
- In the OAuth consent screen settings in Google Cloud Console, add all necessary scopes:
  - https://www.googleapis.com/auth/calendar.readonly
  - https://www.googleapis.com/auth/contacts.readonly
  - https://www.googleapis.com/auth/userinfo.profile
  - https://www.googleapis.com/auth/userinfo.email

### Insufficient Permission error

- Go through the authorization process again: `yarn auth-google`
- Make sure you are logged in with the same account that owns the contacts

### Token expired

- Run `yarn auth-google` to refresh the token

## Project Structure

```
├── src/
│   ├── index.ts              # Main application file
│   ├── auth-google.ts        # OAuth authorization script
│   ├── check-setup.ts        # Setup verification script
│   ├── services/
│   │   ├── GoogleCalendarService.ts   # Service for working with Google Calendar
│   │   ├── GoogleContactsService.ts   # Service for working with Google Contacts
│   │   └── TelegramService.ts         # Service for sending messages to Telegram
│   └── utils/
│       └── logger.ts          # Logging module
├── .env                      # Environment settings
├── google-token.json         # Access token (will be created automatically)
├── oauth-credentials.json    # OAuth 2.0 credentials
└── oauth-credentials.example.json  # Example format for credentials
```

## License

MIT
