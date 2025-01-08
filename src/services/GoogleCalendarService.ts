import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";

export class GoogleCalendarService {
  private calendar;

  constructor() {
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"]
    });

    this.calendar = google.calendar({ version: "v3", auth });
  }

  async getTodaysBirthdays(): Promise<string[]> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    try {
      const response = await this.calendar.events.list({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: "startTime"
      });

      return (response.data.items || [])
        .filter((event) => event.summary?.toLowerCase().includes("birthday"))
        .map((event) => event.summary || "");
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      return [];
    }
  }
}
