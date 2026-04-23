const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;

const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');
const TOKEN_PATH = path.join(__dirname, '../../token.json');
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

async function loadSavedCredentialsIfExist(userId) {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const allTokens = JSON.parse(content);
    const userTokens = allTokens[userId];
    if (userTokens) {
      const auth = new google.auth.OAuth2(
        userTokens.client_id,
        userTokens.client_secret
      );
      auth.setCredentials({ refresh_token: userTokens.refresh_token });
<<<<<<< HEAD
      return auth;
=======
      // Test if credentials are still valid by attempting to refresh token
      try {
        await auth.getAccessToken();
        return auth;
      } catch (err) {
        console.error(`Token refresh failed for user ${userId}:`, err.message);
        // If invalid_grant, remove the invalid token
        if (err.message.includes('invalid_grant')) {
          await removeUserCredentials(userId);
        }
        return null;
      }
>>>>>>> main
    }
    return null;
  } catch (err) {
    return null;
  }
}

<<<<<<< HEAD
=======
async function removeUserCredentials(userId) {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const allTokens = JSON.parse(content);
    if (allTokens[userId]) {
      delete allTokens[userId];
      await fs.writeFile(TOKEN_PATH, JSON.stringify(allTokens, null, 2));
      console.log(`Removed invalid credentials for user ${userId}`);
    }
  } catch (err) {
    console.error('Error removing user credentials:', err);
  }
}

>>>>>>> main
async function saveCredentials(userId, client, tokens) {
  const keysContent = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(keysContent);
  const key = keys.web || keys.installed;
  
  let allTokens = {};
  try {
    const existing = await fs.readFile(TOKEN_PATH);
    allTokens = JSON.parse(existing);
  } catch (err) { /* file doesn't exist yet */ }
  
  allTokens[userId] = {
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: tokens.refresh_token,
  };
  
  await fs.writeFile(TOKEN_PATH, JSON.stringify(allTokens, null, 2));
<<<<<<< HEAD
=======
  console.log(`Saved credentials for user ${userId}`);
>>>>>>> main
}

async function authorize(userId) {
  const client = await loadSavedCredentialsIfExist(userId);
  if (client) return client;
  return null;
}

async function createCalendarEvent(userId, eventData) {
  try {
    const auth = await authorize(userId);
    if (!auth) {
      return { success: false, error: 'User not authenticated with Google Calendar' };
    }
    
    const calendar = google.calendar({ version: 'v3', auth });
    
    const dateTime = new Date(`${eventData.date}T${eventData.time}:00`);
    const endDateTime = new Date(dateTime.getTime() + 2 * 60 * 60 * 1000);
    
    const event = {
      summary: eventData.title,
      location: eventData.location,
      description: eventData.description || '',
      start: {
        dateTime: dateTime.toISOString(),
        timeZone: 'Asia/Dhaka',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Asia/Dhaka',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };
    
    const result = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all',
    });
    
    return {
      success: true,
      eventId: result.data.id,
      htmlLink: result.data.htmlLink,
    };
  } catch (err) {
    console.error('Create calendar event error:', err.message);
<<<<<<< HEAD
=======
    // If invalid_grant, remove credentials and return auth required
    if (err.message.includes('invalid_grant')) {
      await removeUserCredentials(userId);
      return { success: false, error: 'User not authenticated with Google Calendar' };
    }
>>>>>>> main
    return { success: false, error: err.message };
  }
}

async function deleteCalendarEvent(userId, calendarEventId) {
  try {
    const auth = await authorize(userId);
    if (!auth) {
      return { success: false, error: 'User not authenticated' };
    }
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: calendarEventId,
      sendUpdates: 'all',
    });
    return { success: true };
  } catch (err) {
    console.error('Delete calendar event error:', err.message);
<<<<<<< HEAD
=======
    if (err.message.includes('invalid_grant')) {
      await removeUserCredentials(userId);
    }
>>>>>>> main
    return { success: false, error: err.message };
  }
}

<<<<<<< HEAD
module.exports = { createCalendarEvent, saveCredentials, authorize, deleteCalendarEvent };
=======
async function hasCredentials(userId) {
  const auth = await authorize(userId);
  return !!auth;
}

module.exports = { 
  createCalendarEvent, 
  saveCredentials, 
  authorize, 
  deleteCalendarEvent,
  hasCredentials
};
>>>>>>> main
