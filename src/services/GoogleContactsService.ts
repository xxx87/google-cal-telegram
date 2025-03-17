import { google, people_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import fs from "fs";
import path from "path";
import logger from "../utils/logger";

// Constants for OAuth2
const TOKEN_PATH = "google-token.json";
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS || "oauth-credentials.json";

/**
 * Service for interacting with Google Contacts API
 */
class GoogleContactsService {
  private peopleServiceClient: people_v1.People;
  private initialized: boolean = false;

  constructor() {
    this.peopleServiceClient = {} as people_v1.People;
  }

  /**
   * Initialize the Google Contacts service with OAuth credentials
   */
  async initialize(): Promise<void> {
    try {
      // Check if token file exists
      const tokenPath = path.resolve(TOKEN_PATH);
      if (!fs.existsSync(tokenPath)) {
        logger.error(`OAuth token file not found: ${tokenPath}`);
        logger.error("Run 'yarn auth-google' to authenticate first");
        throw new Error("OAuth token file not found. Run 'yarn auth-google' to authenticate first.");
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

      // Create People API client
      this.peopleServiceClient = google.people({
        version: "v1",
        auth: oAuth2Client
      });

      this.initialized = true;
      logger.info("Google Contacts service initialized with OAuth");
    } catch (error: any) {
      logger.error(`Failed to initialize Google Contacts service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get connections (contacts) with birthdays
   */
  async getContactsWithBirthdays(): Promise<people_v1.Schema$Person[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      logger.info("Fetching contacts with birthdays...");

      // Use connections.list to get user's contacts with birthday info
      const response = await this.peopleServiceClient.people.connections.list({
        resourceName: "people/me",
        personFields: "names,birthdays",
        pageSize: 1000
      });

      // Check if we have contacts and if they have birthday information
      const contacts = response.data.connections || [];
      logger.info(`Retrieved ${contacts.length} contacts`);

      console.log(JSON.stringify(contacts, null, 2));
      // Filter contacts to those with birthdays
      const contactsWithBirthdays = contacts.filter((contact) => contact.birthdays && contact.birthdays.length > 0);

      logger.info(`Found ${contactsWithBirthdays.length} contacts with birthdays`);
      return contactsWithBirthdays;
    } catch (error: any) {
      logger.error(`Error fetching contacts with birthdays: ${error.message}`);
      if (error.response) {
        logger.error(`Status: ${error.response.status}`);
        logger.error(`Data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Gets today's birthdays from Google Contacts
   * @returns Array of contact names with birthdays today
   */
  async getTodaysBirthdays(): Promise<string[]> {
    try {
      const contacts = await this.getContactsWithBirthdays();
      const today = new Date();
      const todayMonth = today.getMonth() + 1; // getMonth() returns 0-11
      const todayDay = today.getDate();

      // Filter contacts for birthdays matching today's month and day
      return contacts
        .filter((contact) => {
          if (!contact.birthdays || contact.birthdays.length === 0) return false;

          // Check if any birthday date matches today's month and day
          return contact.birthdays.some((birthday) => {
            const date = birthday.date;
            if (!date) return false;

            // Match month and day, ignore year
            return date.month === todayMonth && date.day && date.day > todayDay;
          });
        })
        .map((contact) => {
          // Get display name or construct from parts
          if (contact.names && contact.names.length > 0) {
            return contact.names[0].displayName || "Unnamed Contact";
          }
          return "Unnamed Contact";
        });
    } catch (error: any) {
      logger.error(`Error getting today's birthdays: ${error.message}`);
      throw error;
    }
  }
}

export default new GoogleContactsService();
