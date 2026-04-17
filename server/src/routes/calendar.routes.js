const express = require('express');
const requireAuth = require('../middleware/auth.middleware');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const Event = require('../models/Event');
const { createCalendarEvent, saveCredentials, hasCredentials } = require('../services/calendar.service');

const router = express.Router();
const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');

let oauth2Client = null;
try {
  const credentialsContent = fs.readFileSync(CREDENTIALS_PATH);
  const credentials = JSON.parse(credentialsContent);
  const { client_id, client_secret } = credentials.web || credentials.installed;
  oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:9120/api/calendar/auth/callback'
  );
  console.log('✅ Calendar OAuth client initialized');
} catch (err) {
  console.error('❌ Failed to load credentials.json:', err.message);
}

router.get('/auth', requireAuth, (req, res) => {
  if (!oauth2Client) {
    return res.status(500).json({ message: 'Calendar service not configured' });
  }
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent',
    state: req.user.id,
  });
  res.redirect(authUrl);
});

router.get('/auth/callback', async (req, res) => {
  const { code, state: userId } = req.query;
  if (!code) return res.status(400).send('Missing authorization code');
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    await saveCredentials(userId, oauth2Client, tokens);
    res.send(`
      <html><body>
        <h2>✅ Calendar Connected!</h2>
        <p>You can close this window and return to StudyDen.</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'CALENDAR_CONNECTED', success: true }, '*');
          }
          window.close();
        </script>
      </body></html>
    `);
  } catch (err) {
    console.error('Token exchange error:', err);
    res.status(500).send(`
      <html><body>
        <h2>❌ Connection Failed</h2>
        <p>${err.message}</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'CALENDAR_CONNECTED', success: false, error: '${err.message}' }, '*');
          }
          window.close();
        </script>
      </body></html>
    `);
  }
});

router.get('/status', requireAuth, async (req, res) => {
  try {
    const connected = await hasCredentials(req.user.id);
    res.json({ connected });
  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ connected: false, error: err.message }); //sdfdsf
  }
});

router.post('/sync/:eventId', requireAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const isHost = event.host.toString() === req.user.id;
    const isAttendee = event.attendees.some(id => id.toString() === req.user.id);
    if (!isHost && !isAttendee) {
      return res.status(403).json({ message: 'You must be host or attendee to sync this event' });
    }

    if (event.userCalendarEvents && event.userCalendarEvents.has(req.user.id)) {
      return res.json({ message: 'Already synced', link: event.userCalendarEvents.get(req.user.id) });
    }

    const result = await createCalendarEvent(req.user.id, {
      title: event.title,
      location: event.location,
      description: event.description,
      date: event.date.toISOString().split('T')[0],
      time: event.time,
    });

    if (result.success) {
      if (!event.userCalendarEvents) event.userCalendarEvents = new Map();
      event.userCalendarEvents.set(req.user.id, result.eventId);
      await event.save();
      res.json({ message: 'Event synced to Google Calendar', link: result.htmlLink });
    } else {
      if (result.error === 'User not authenticated with Google Calendar') {
        res.status(401).json({ authRequired: true });
      } else {
        console.error('Sync error:', result.error);
        res.status(500).json({ message: 'Failed to sync', error: result.error });
      }
    }
  } catch (err) {
    console.error('Sync endpoint error:', err);
    res.status(500).json({ message: 'Sync failed', error: err.message });
  }
});

module.exports = router;