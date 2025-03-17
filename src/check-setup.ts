import dotenv from "dotenv";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import fs from "fs";
import path from "path";

dotenv.config();

// OAuth2 constants
const TOKEN_PATH = "google-token.json";
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS || "oauth-credentials.json";

/**
 * Script for checking Google API connection
 * Run: yarn ts-node src/check-setup.ts
 */
async function checkGoogleAPIs() {
  console.log("🔍 Running diagnostics for Google API connections...");

  try {
    // Check if OAuth credentials file exists
    const credentialsPath = path.resolve(CREDENTIALS_PATH);
    console.log(`📁 Checking OAuth credentials file: ${credentialsPath}`);

    if (!fs.existsSync(credentialsPath)) {
      console.error(`❌ OAuth credentials file not found: ${credentialsPath}`);
      console.error("   Create it by following the instructions in README.md");
      return;
    }

    console.log("✅ OAuth credentials file found");

    // Load credentials
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
    const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;
    console.log(`📧 OAuth Client ID: ${client_id}`);

    // Check for OAuth token file
    const tokenPath = path.resolve(TOKEN_PATH);
    if (!fs.existsSync(tokenPath)) {
      console.error(`❌ OAuth token file not found: ${tokenPath}`);
      console.error('   Run "yarn auth-google" to obtain a token');
      return;
    }

    console.log("✅ OAuth token file found");
    const token = JSON.parse(fs.readFileSync(tokenPath, "utf8"));

    // Check token expiration time
    if (token.expiry_date) {
      const expiryDate = new Date(token.expiry_date);
      const currentTime = Date.now();
      if (token.expiry_date < currentTime) {
        console.error(`❌ Access token expired on ${expiryDate.toLocaleString()}`);
        console.error('   Run "yarn auth-google" to refresh the token');
      } else {
        console.log(`✅ Token valid until ${expiryDate.toLocaleString()}`);
      }
    }

    // Check environment variables
    console.log("\n🔐 Checking environment variables:");
    const requiredEnvVars = ["GOOGLE_CALENDAR_ID", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHANNEL_ID"];

    let missingVars = false;
    for (const varName of requiredEnvVars) {
      if (!process.env[varName]) {
        console.error(`❌ Required environment variable missing: ${varName}`);
        missingVars = true;
      } else {
        console.log(`✅ ${varName} is configured`);
      }
    }

    if (missingVars) {
      console.error("❌ Fix the missing environment variables in the .env file");
      return;
    }

    // Create OAuth client
    const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    // Check connection to Calendar API
    console.log("\n📅 Checking connection to Google Calendar API...");
    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    try {
      const calResponse = await calendar.calendarList.list();
      console.log(
        `✅ Successfully connected to Calendar API, ${calResponse.data.items?.length || 0} calendars available`
      );

      // List all available calendars
      if (calResponse.data.items && calResponse.data.items.length > 0) {
        console.log("📋 Available calendars:");
        calResponse.data.items.forEach((cal, index) => {
          console.log(`   ${index + 1}. "${cal.summary}" (ID: ${cal.id})`);
        });
      }

      if (process.env.GOOGLE_CALENDAR_ID) {
        try {
          const calendarInfo = await calendar.calendars.get({
            calendarId: process.env.GOOGLE_CALENDAR_ID
          });
          console.log(`✅ Calendar '${calendarInfo.data.summary}' found and accessible`);

          // Get today's events for testing
          const today = new Date();
          const startOfDay = new Date(today.setHours(0, 0, 0, 0));
          const endOfDay = new Date(today.setHours(23, 59, 59, 999));

          const eventsResponse = await calendar.events.list({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: "startTime"
          });

          console.log(`📊 Found ${eventsResponse.data.items?.length || 0} events for today`);
        } catch (calErr: any) {
          console.error(`❌ Failed to access the specified calendar: ${process.env.GOOGLE_CALENDAR_ID}`);
          console.error(`   Error: ${calErr.message}`);

          if (calErr.response) {
            console.error(`   Error code: ${calErr.response.status}`);
            console.error(`   Message: ${JSON.stringify(calErr.response.data)}`);
          }
        }
      }
    } catch (calError: any) {
      console.error(`❌ Error connecting to Calendar API: ${calError.message}`);
      if (calError.response) {
        console.error(`   Error code: ${calError.response.status}`);
        console.error(`   Message: ${JSON.stringify(calError.response.data)}`);
      }
    }

    // Check connection to People API
    console.log("\n👥 Checking connection to Google People API...");
    const people = google.people({ version: "v1", auth: oAuth2Client });

    // Test different People API methods
    try {
      // 1. Get your own profile
      try {
        console.log("\n👤 Checking access to your profile (people/me)...");
        const profileResponse = await people.people.get({
          resourceName: "people/me",
          personFields: "names,emailAddresses"
        });

        if (profileResponse.data.names && profileResponse.data.names.length > 0) {
          console.log(`✅ Successfully retrieved profile: ${profileResponse.data.names[0].displayName || "No name"}`);
        } else {
          console.log("⚠️ Profile retrieved, but name not found");
        }

        if (profileResponse.data.emailAddresses && profileResponse.data.emailAddresses.length > 0) {
          console.log(`✅ Email: ${profileResponse.data.emailAddresses[0].value}`);
        }
      } catch (profileError: any) {
        console.error("❌ Error retrieving profile:", profileError.message);

        if (profileError.response) {
          console.error(`   Error code: ${profileError.response.status}`);
          console.error(`   Message: ${JSON.stringify(profileError.response.data)}`);
        }
      }

      // 2. Try connections.list - get contacts
      try {
        console.log("\n👥 Checking access to connections (main contacts)...");
        const connectionsResponse = await people.people.connections.list({
          resourceName: "people/me",
          personFields: "names",
          pageSize: 10
        });

        if (connectionsResponse.data.connections && connectionsResponse.data.connections.length > 0) {
          console.log(
            `✅ Successfully retrieved contacts. Total: ${connectionsResponse.data.totalPeople || "unknown"}`
          );
          console.log(`✅ In current request: ${connectionsResponse.data.connections.length}`);

          // Display first few contacts
          console.log("📋 Contact examples:");
          connectionsResponse.data.connections.slice(0, 3).forEach((person, index) => {
            const name = person.names && person.names.length > 0 ? person.names[0].displayName || "No name" : "No name";
            console.log(`   ${index + 1}. ${name}`);
          });
        } else {
          console.log("⚠️ Contacts retrieved, but the list is empty");
        }
      } catch (connError: any) {
        console.error("❌ Error accessing connections:", connError.message);

        if (connError.response) {
          console.error(`   Error code: ${connError.response.status}`);
          console.error(`   Message: ${JSON.stringify(connError.response.data)}`);
        }
      }

      console.log("\n💡 Troubleshooting recommendations:");
      console.log("1. If the token has expired, run 'yarn auth-google' to refresh it");
      console.log("2. Check that you have added all necessary scopes in the OAuth consent screen");
      console.log("3. Make sure that Google Calendar and People API are enabled in Google Cloud Console");
      console.log("4. For calendar issues, verify that you specified the correct GOOGLE_CALENDAR_ID in .env");
    } catch (peopleError: any) {
      console.error(`❌ Error connecting to People API: ${peopleError.message}`);

      if (peopleError.response) {
        console.error(`   Error code: ${peopleError.response.status}`);
        console.error(`   Message: ${JSON.stringify(peopleError.response.data)}`);
      }
    }
  } catch (error: any) {
    console.error(`❌ A critical error occurred: ${error.message}`);
  }
}

// Run the check
checkGoogleAPIs().catch((error) => {
  console.error("Critical error while performing the check:", error);
});
