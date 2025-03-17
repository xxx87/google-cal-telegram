import GoogleCalendarService from "./GoogleCalendarService";
import TelegramService from "./TelegramService";
import logger from "../utils/logger";

/**
 * Service for processing and notifying about Google Calendar events
 */
export class CalendarEventNotifier {
  constructor(
    private googleCalendar: typeof GoogleCalendarService,
    private telegram: typeof TelegramService
  ) {}

  /**
   * Checks for calendar events and sends notifications
   */
  async checkAndNotify(): Promise<void> {
    try {
      logger.info("Starting calendar events check...");

      // Get all calendar events for today
      const todayEvents = await this.googleCalendar.getTodaysEvents();

      // Filter regular events (exclude birthdays)
      const regularEvents = todayEvents.filter(
        (event) =>
          !event.summary?.toLowerCase().includes("день рождения") && !event.summary?.toLowerCase().includes("birthday")
      );

      logger.info(`Found ${regularEvents.length} regular events in calendar for today`);

      // Send notifications about events if there are any
      if (regularEvents.length > 0) {
        await this.telegram.sendCalendarEventsNotification(regularEvents, "Events for today");
        logger.info("Calendar event notifications sent");
      } else {
        logger.info("No calendar events today");
      }

      // Check events for tomorrow
      const tomorrowEvents = await this.googleCalendar.getTomorrowsEvents();

      // Filter regular events (exclude birthdays)
      const regularTomorrowEvents = tomorrowEvents.filter(
        (event) =>
          !event.summary?.toLowerCase().includes("день рождения") && !event.summary?.toLowerCase().includes("birthday")
      );

      logger.info(`Found ${regularTomorrowEvents.length} events in calendar for tomorrow`);

      // Send notifications about tomorrow's events if there are any
      if (regularTomorrowEvents.length > 0) {
        await this.telegram.sendCalendarEventsNotification(regularTomorrowEvents, "Events for tomorrow");
        logger.info("Calendar event notifications for tomorrow sent");
      } else {
        logger.info("No calendar events for tomorrow");
      }
    } catch (error: any) {
      logger.error(`Error checking calendar events: ${error.message}`);
      if (error.stack) {
        logger.error(error.stack);
      }
    }
  }
}
