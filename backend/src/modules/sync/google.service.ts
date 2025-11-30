import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export class GoogleCalendarService {
    private oauth2Client: OAuth2Client;

    constructor(accessToken: string, refreshToken: string, onTokenUpdate?: (tokens: any) => void) {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_CALLBACK_URL
        );

        this.oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
        });

        this.oauth2Client.on('tokens', (tokens) => {
            if (onTokenUpdate) {
                onTokenUpdate(tokens);
            }
        });
    }

    async listEvents(calendarId: string = 'primary', timeMin?: Date, showDeleted: boolean = false) {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

        try {
            const response = await calendar.events.list({
                calendarId,
                timeMin: timeMin ? timeMin.toISOString() : new Date().toISOString(),
                maxResults: 2500,
                singleEvents: false,
                showDeleted: showDeleted,
            });

            return response.data.items || [];
        } catch (error) {
            console.error('Error fetching Google events:', error);
            throw error;
        }
    }

    async createEvent(calendarId: string = 'primary', event: any) {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

        try {
            const response = await calendar.events.insert({
                calendarId,
                requestBody: event,
            });
            return response.data;
        } catch (error) {
            console.error('Error creating Google event:', error);
            throw error;
        }
    }

    async updateEvent(calendarId: string, eventId: string, event: any) {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

        try {
            const response = await calendar.events.update({
                calendarId,
                eventId,
                requestBody: event,
            });
            return response.data;
        } catch (error) {
            console.error('Error updating Google event:', error);
            throw error;
        }
    }

    async listCalendars() {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
        try {
            const response = await calendar.calendarList.list();
            return response.data.items || [];
        } catch (error) {
            console.error('Error fetching Google calendars:', error);
            throw error;
        }
    }

    async createCalendar(summary: string) {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
        try {
            const response = await calendar.calendars.insert({
                requestBody: {
                    summary,
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error creating Google calendar:', error);
            throw error;
        }
    }
}
