import { google, calendar_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import fs from "fs";
import path from "path";
import logger from "../utils/logger";

// Constants for OAUTH2
const TOKEN_PATH = "google-token.json";
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS || "oauth-credentials.json";

/**
 * Service for interacting with Google Calendar API
 */
class GoogleCalendarService {
  private calendarClient: calendar_v3.Calendar;
  private initialized: boolean = false;
  private calendarId: string;

  constructor() {
    this.calendarClient = {} as calendar_v3.Calendar;
    this.calendarId = "";
  }

  /**
   * Initialize the Google Calendar service with OAuth credentials
   */
  async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        return;
      }

      this.calendarId = process.env.GOOGLE_CALENDAR_ID || "";
      if (!this.calendarId) {
        throw new Error("GOOGLE_CALENDAR_ID environment variable is not set");
      }

      // Check if token file exists
      const tokenPath = path.resolve(TOKEN_PATH);
      if (!fs.existsSync(tokenPath)) {
        logger.error(`OAuth token file not found: ${tokenPath}`);
        logger.error(`Run "yarn auth-google" to authenticate first`);
        throw new Error(`OAuth token file not found. Run "yarn auth-google" to authenticate first.`);
      }

      // Load token from file
      const token = JSON.parse(fs.readFileSync(tokenPath, "utf8"));

      // Check if credentials file exists
      const credentialsPath = path.resolve(CREDENTIALS_PATH);
      if (!fs.existsSync(credentialsPath)) {
        logger.error(`OAuth credentials file not found: ${credentialsPath}`);
        throw new Error(`OAuth credentials file not found: ${credentialsPath}`);
      }

      // Load credentials from file
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
      const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

      // Create OAuth client
      const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
      oAuth2Client.setCredentials(token);

      // Create Calendar API client
      this.calendarClient = google.calendar({
        version: "v3",
        auth: oAuth2Client
      });

      this.initialized = true;
      logger.info("Google Calendar service initialized with OAuth");
    } catch (error: any) {
      logger.error(`Failed to initialize Google Calendar service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get events from Google Calendar for the specified date range
   * @param startTime - The start time of the period to fetch events for
   * @param endTime - The end time of the period to fetch events for
   * @returns Array of calendar events
   */
  async getEvents(startTime: Date, endTime: Date): Promise<calendar_v3.Schema$Event[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const response = await this.calendarClient.events.list({
        calendarId: this.calendarId,
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: true,
        orderBy: "startTime"
      });

      logger.info(`Retrieved ${response.data.items?.length || 0} events from calendar`);
      return response.data.items || [];
    } catch (error: any) {
      logger.error(`Error fetching calendar events: ${error.message}`);
      if (error.response) {
        logger.error(`Status: ${error.response.status}`);
        logger.error(`Data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Get today's events from Google Calendar
   * @returns Array of today's calendar events
   */
  async getTodaysEvents(): Promise<calendar_v3.Schema$Event[]> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return this.getEvents(startOfDay, endOfDay);
  }

  /**
   * Get tomorrow's events from Google Calendar
   * @returns Array of tomorrow's calendar events
   */
  async getTomorrowsEvents(): Promise<calendar_v3.Schema$Event[]> {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfDay = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfDay = new Date(tomorrow.setHours(23, 59, 59, 999));

    return this.getEvents(startOfDay, endOfDay);
  }
}

export default new GoogleCalendarService();
