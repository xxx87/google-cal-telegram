import GoogleCalendarService from "./GoogleCalendarService";
import TelegramService from "./TelegramService";
import GoogleContactsService from "./GoogleContactsService";
import logger from "../utils/logger";

export class BirthdayNotifier {
  constructor(
    private googleCalendar: typeof GoogleCalendarService,
    private googleContacts: typeof GoogleContactsService,
    private telegram: typeof TelegramService
  ) {}

  /**
   * Checks for birthdays from both Google Calendar and Google Contacts and sends notifications
   */
  async checkAndNotify(): Promise<void> {
    try {
      logger.info("Starting birthday check...");

      // Get all calendar events for today
      const calendarEvents = await this.googleCalendar.getTodaysEvents();

      // Filter calendar events to find birthdays
      const birthdayEvents = calendarEvents.filter(
        (event) =>
          event.summary?.toLowerCase().includes("день рождения") || event.summary?.toLowerCase().includes("birthday")
      );

      // Extract names from birthday events
      const calendarBirthdays = birthdayEvents.map((event) => event.summary || "Unknown Contact");
      logger.info(`Found ${calendarBirthdays.length} birthdays in calendar`);

      // Get birthdays from contacts
      const contactsBirthdays = await this.googleContacts.getTodaysBirthdays();
      logger.info(`Found ${contactsBirthdays.length} birthdays in contacts`);

      // Combine birthdays from both sources, removing duplicates
      const allBirthdays = Array.from(new Set([...calendarBirthdays, ...contactsBirthdays]));

      if (allBirthdays.length > 0) {
        // Send notification to Telegram
        await this.telegram.sendBirthdayNotification(allBirthdays);
        logger.info("Birthday notifications sent");
      } else {
        logger.info("No birthdays today");
      }
    } catch (error: any) {
      logger.error(`Error checking birthdays: ${error.message}`);
      if (error.stack) {
        logger.error(error.stack);
      }
    }
  }

  /**
   * Formats birthday message based on the number of birthdays
   */
  private formatBirthdayMessage(birthdays: string[]): string {
    if (birthdays.length === 1) {
      return `🎉 Today is ${birthdays[0]}'s birthday! 🎂`;
    }

    const birthdaysList = birthdays.join("\n- ");
    return `🎉 Today's birthdays:\n- ${birthdaysList}\n\n🎂 Congratulations!`;
  }
}
