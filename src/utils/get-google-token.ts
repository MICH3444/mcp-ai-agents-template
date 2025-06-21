import { google } from 'googleapis';
import fs from 'fs';
import readline from 'readline';

const credentials = JSON.parse(
  fs.readFileSync('./secrets/google-secret.json', 'utf8')
).web;

const oAuth2Client = new google.auth.OAuth2(
  credentials.client_id,
  credentials.client_secret,
  credentials.redirect_uris[0],
);

// GMAIL, CALENDAR, Forms
const SCOPES = ['https://www.googleapis.com/auth/gmail.compose', 'https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/forms.body'];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('Authorize this app by visiting this url:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', async (code) => {
  try {
    const { tokens } = await oAuth2Client.getToken(code.trim());
    console.log('Your tokens:', tokens);
    console.log('Paste the JSON contents in the secrets/google-secret.json file')
  } catch (err) {
    console.error('Error retrieving access token', err);
  }
  rl.close();
});