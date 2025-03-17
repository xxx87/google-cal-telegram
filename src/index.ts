import dotenv from "dotenv";
import cron from "node-cron";
import googleCalendarService from "./services/GoogleCalendarService";
import googleContactsService from "./services/GoogleContactsService";
import telegramService from "./services/TelegramService";
import logger from "./utils/logger";
import { BirthdayNotifier } from "./services/BirthdayNotifier";
import { CalendarEventNotifier } from "./services/CalendarEventNotifier";

// Load environment variables
dotenv.config();

// Get notification time from .env or use default values
const NOTIFICATION_HOUR = process.env.NOTIFICATION_HOUR || "9";
const NOTIFICATION_MINUTE = process.env.NOTIFICATION_MINUTE || "0";

// Create notifier instances
const birthdayNotifier = new BirthdayNotifier(googleCalendarService, googleContactsService, telegramService);

const calendarEventNotifier = new CalendarEventNotifier(googleCalendarService, telegramService);

/**
 * Initialize services and start the task scheduler
 */
async function initialize() {
  try {
    logger.info("Initializing application...");

    // Initialize Telegram service
    telegramService.initialize();

    // Schedule notifications
    logger.info(`Scheduling notifications at ${NOTIFICATION_HOUR}:${NOTIFICATION_MINUTE} daily`);
    cron.schedule(`${NOTIFICATION_MINUTE} ${NOTIFICATION_HOUR} * * *`, () => {
      birthdayNotifier.checkAndNotify().catch((error) => logger.error(`Error checking birthdays: ${error}`));

      calendarEventNotifier.checkAndNotify().catch((error) => logger.error(`Error checking calendar events: ${error}`));
    });

    logger.info("Running immediate check...");
    // Run check immediately after startup for testing
    await birthdayNotifier.checkAndNotify();
    await calendarEventNotifier.checkAndNotify();

    logger.info("Application successfully started and running");
    logger.info(`Next check scheduled for ${NOTIFICATION_HOUR}:${NOTIFICATION_MINUTE}`);
  } catch (error: any) {
    logger.error(`Error initializing application: ${error.message}`);
    if (error.stack) {
      logger.error(error.stack);
    }
    process.exit(1);
  }
}

// Launch the application
initialize().catch((error) => {
  logger.error("Critical error during application startup:", error);
  process.exit(1);
});
