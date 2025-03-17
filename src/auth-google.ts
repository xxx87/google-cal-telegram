import { OAuth2Client } from "google-auth-library";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import dotenv from "dotenv";

dotenv.config();

// OAuth2 constants
const TOKEN_PATH = "google-token.json";
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS || "oauth-credentials.json";

// Access scopes required for the application
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email"
];

/**
 * Start the OAuth 2.0 authorization process for Google API
 */
async function authorize() {
  try {
    console.log("🔐 Starting Google API authorization process via OAuth 2.0...");

    // Check if OAuth credentials file exists
    const credentialsPath = path.resolve(CREDENTIALS_PATH);
    console.log(`📁 Looking for OAuth credentials file: ${credentialsPath}`);

    if (!fs.existsSync(credentialsPath)) {
      console.error(`❌ OAuth credentials file not found: ${credentialsPath}`);
      console.error(`   Create ${CREDENTIALS_PATH} based on the oauth-credentials.example.json example`);
      console.error("   Instructions available in README.md");
      return;
    }

    // Read data from file
    const content = fs.readFileSync(credentialsPath, "utf8");
    const credentials = JSON.parse(content);

    // Get client identifiers from the file
    const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

    // Create OAuth2 client
    const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

    // Check for existing token
    const tokenPath = path.resolve(TOKEN_PATH);
    if (fs.existsSync(tokenPath)) {
      const tokenContent = fs.readFileSync(tokenPath, "utf8");
      const token = JSON.parse(tokenContent);

      // Check token expiration date
      if (token.expiry_date && token.expiry_date > Date.now()) {
        const expiryDate = new Date(token.expiry_date);
        console.log(`✅ Valid token found (valid until ${expiryDate.toLocaleString()})`);
        console.log("   Do you want to create a new token? (y/n)");

        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise<string>((resolve) => {
          rl.question(">> ", (ans) => {
            rl.close();
            resolve(ans.toLowerCase());
          });
        });

        if (answer !== "y") {
          console.log("⏹️ Authorization process canceled by user. Using existing token.");
          return;
        }
      } else if (token.refresh_token) {
        console.log("🔄 Token expired, attempting to refresh token...");
        oAuth2Client.setCredentials(token);

        try {
          const { credentials } = await oAuth2Client.refreshAccessToken();
          console.log("✅ Token successfully refreshed");
          saveToken(credentials);
          return;
        } catch (refreshError) {
          console.error("❌ Failed to refresh token, getting a new one...");
        }
      }
    }

    // Request a new token
    await getNewToken(oAuth2Client);
  } catch (error: any) {
    console.error(`❌ Error during authorization process: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

/**
 * Get a new token through interactive authorization process
 * @param oAuth2Client OAuth2 client
 */
async function getNewToken(oAuth2Client: OAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent" // To obtain refresh_token
  });

  console.log("🌐 To authorize, open the following URL in your browser:");
  console.log(authUrl);
  console.log("\n⌨️ Paste the authorization code you received:");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const code = await new Promise<string>((resolve) => {
    rl.question(">> ", (code) => {
      rl.close();
      resolve(code);
    });
  });

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    console.log("✅ Token successfully obtained");

    // Save the token
    saveToken(tokens);
  } catch (error: any) {
    console.error(`❌ Error obtaining token: ${error.message}`);
    if (error.response && error.response.data) {
      console.error("   Error details:", JSON.stringify(error.response.data));
    }
  }
}

/**
 * Saves the token to a file for future use
 * @param tokens Access tokens
 */
function saveToken(tokens: any) {
  const tokenPath = path.resolve(TOKEN_PATH);

  try {
    fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
    console.log(`✅ Token saved to file: ${tokenPath}`);

    // Display token expiration information
    if (tokens.expiry_date) {
      const expiryDate = new Date(tokens.expiry_date);
      console.log(`   Token valid until: ${expiryDate.toLocaleString()}`);
    }

    // Information about refresh_token
    if (tokens.refresh_token) {
      console.log("✅ Refresh_token obtained for automatic renewal");
    } else {
      console.warn("⚠️ Refresh token not received. If the token expires, re-authorization will be required");
    }
  } catch (err: any) {
    console.error(`❌ Error saving token: ${err.message}`);
  }
}

// Start the authorization process
authorize().catch(console.error);
