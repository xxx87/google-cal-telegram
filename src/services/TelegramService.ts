import TelegramBot from "node-telegram-bot-api";
import { calendar_v3 } from "googleapis";
import logger from "../utils/logger";

/**
 * Service for sending messages to Telegram
 */
class TelegramService {
  private bot: TelegramBot;
  private channelId: string;
  private initialized: boolean = false;

  constructor() {
    this.bot = {} as TelegramBot;
    this.channelId = "";
  }

  /**
   * Initialize the Telegram bot
   */
  initialize(): void {
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (!token) {
        throw new Error("TELEGRAM_BOT_TOKEN is not defined in .env file");
      }

      this.channelId = process.env.TELEGRAM_CHANNEL_ID || "";
      if (!this.channelId) {
        throw new Error("TELEGRAM_CHANNEL_ID is not defined in .env file");
      }

      // Use webhook in production, polling in development
      this.bot = new TelegramBot(token, {
        polling: process.env.NODE_ENV !== "production"
      });

      this.initialized = true;
      logger.info("Telegram service initialized");
    } catch (error: any) {
      logger.error(`Failed to initialize Telegram service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send a message to the configured Telegram channel
   * @param message - Message text to send
   * @returns Promise that resolves when message is sent
   */
  async sendMessage(message: string): Promise<void> {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      await this.bot.sendMessage(this.channelId, message, {
        parse_mode: "HTML"
      });
      logger.info(`Message sent to Telegram channel ${this.channelId}`);
    } catch (error: any) {
      logger.error(`Failed to send message to Telegram: ${error.message}`);
      throw error;
    }
  }

  /**
   * Format and send notification about birthdays
   * @param birthdays - Array of names with birthdays today
   */
  async sendBirthdayNotification(birthdays: string[]): Promise<void> {
    if (birthdays.length === 0) {
      logger.info("No birthdays today, skipping notification");
      return;
    }

    const message = `🎂 <b>Birthdays today:</b>\n\n${birthdays.map((name) => `• ${name}`).join("\n")}`;

    await this.sendMessage(message);
  }

  /**
   * Format and send calendar events notification
   * @param events - Array of calendar events
   * @param title - Title for the notification group
   */
  async sendCalendarEventsNotification(
    events: calendar_v3.Schema$Event[],
    title: string = "Events for today"
  ): Promise<void> {
    if (events.length === 0) {
      logger.info(`No events for "${title}", skipping notification`);
      return;
    }

    // Format the events list
    const formattedEvents = events.map((event) => {
      const startTime = event.start?.dateTime
        ? new Date(event.start.dateTime).toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit"
          })
        : "All day";

      const location = event.location ? `📍 ${event.location}` : "";

      return `• <b>${event.summary}</b>\n  ⏰ ${startTime}${location ? `\n  ${location}` : ""}`;
    });

    const message = `📅 <b>${title}:</b>\n\n${formattedEvents.join("\n\n")}`;
    await this.sendMessage(message);
  }
}

export default new TelegramService();
