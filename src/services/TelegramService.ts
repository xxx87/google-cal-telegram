import TelegramBot from "node-telegram-bot-api";

export class TelegramService {
  private bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false });
  }

  async sendBirthdayNotification(message: string): Promise<void> {
    try {
      await this.bot.sendMessage(process.env.TELEGRAM_CHANNEL_ID!, message);
    } catch (error) {
      console.error("Error sending telegram message:", error);
    }
  }
}
