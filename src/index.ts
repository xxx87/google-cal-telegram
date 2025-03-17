import dotenv from "dotenv";
import nodeSchedule from "node-schedule";
import { BirthdayNotifier } from "./services/BirthdayNotifier";
import { GoogleCalendarService } from "./services/GoogleCalendarService";
import { TelegramService } from "./services/TelegramService";
import { GoogleContactsService } from "./services/GoogleContactsService";

dotenv.config();

async function main() {
  const googleCalendar = new GoogleCalendarService();
  const telegram = new TelegramService();
  const birthdayNotifier = new BirthdayNotifier(googleCalendar, telegram);

  // We start checking every day at 9:00
  // nodeSchedule.scheduleJob("0 9 * * *", async () => {
  //   try {
  //     await birthdayNotifier.checkAndNotify();
  //   } catch (error) {
  //     console.error("Error checking birthdays:", error);
  //   }
  // });

  const googleContacts = new GoogleContactsService();
  const birthdays = await googleContacts.getTodaysBirthdays();
  console.log("birthdays", birthdays);

  console.log("Birthday notification service started");
}

main().catch(console.error);
