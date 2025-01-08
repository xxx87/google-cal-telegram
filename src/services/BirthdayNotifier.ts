import { GoogleCalendarService } from "./GoogleCalendarService";
import { TelegramService } from "./TelegramService";

export class BirthdayNotifier {
  constructor(private googleCalendar: GoogleCalendarService, private telegram: TelegramService) {}

  async checkAndNotify(): Promise<void> {
    const birthdays = await this.googleCalendar.getTodaysBirthdays();

    if (birthdays.length > 0) {
      const message = this.formatBirthdayMessage(birthdays);
      await this.telegram.sendBirthdayNotification(message);
    }
  }

  private formatBirthdayMessage(birthdays: string[]): string {
    if (birthdays.length === 1) {
      return `🎉 Today is ${birthdays[0]}'s birthday! 🎂`;
    }

    const birthdaysList = birthdays.join("\n- ");
    return `🎉 Today is the birthday of:\n-${birthdaysList}\n\n🎂 Congratulations!`;
  }
}
