import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { v4 as uuidv4 } from 'uuid';

export class AppleCalendarService {
    private authHeader: string;
    private baseUrl: string;

    constructor(appleId: string, appSpecificPassword: string, serverUrl: string = 'https://caldav.icloud.com') {
        const credentials = Buffer.from(`${appleId}:${appSpecificPassword}`).toString('base64');
        this.authHeader = `Basic ${credentials}`;
        this.baseUrl = serverUrl;
    }

    async listCalendars() {
        // Discovery phase usually needed, but for iCloud we often start with a PROPFIND on the root
        // This is a simplified example. Real iCloud discovery involves querying the principal URL first.
        // For MVP, we might assume a known calendar URL or implement discovery.
        // Implementing basic discovery:

        try {
            const response = await axios({
                method: 'PROPFIND',
                url: this.baseUrl,
                headers: {
                    'Authorization': this.authHeader,
                    'Depth': '1',
                    'Content-Type': 'application/xml; charset=utf-8',
                },
                data: `
          <d:propfind xmlns:d="DAV:">
            <d:prop>
              <d:current-user-principal />
            </d:prop>
          </d:propfind>
        `
            });

            // Parsing logic would go here to find the principal and then the calendar-home-set
            // For now, returning raw data to show connection success
            return response.data;
        } catch (error) {
            console.error('Error fetching Apple calendars:', error);
            throw error;
        }
    }

    async listEvents(calendarUrl: string, start: Date, end: Date) {
        const timeRange = `<c:time-range start="${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z" end="${end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z"/>`;

        try {
            const response = await axios({
                method: 'REPORT',
                url: calendarUrl,
                headers: {
                    'Authorization': this.authHeader,
                    'Depth': '1',
                    'Content-Type': 'application/xml; charset=utf-8',
                },
                data: `
          <c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
            <d:prop>
              <d:getetag />
              <c:calendar-data />
            </d:prop>
            <c:filter>
              <c:comp-filter name="VCALENDAR">
                <c:comp-filter name="VEVENT">
                  ${timeRange}
                </c:comp-filter>
              </c:comp-filter>
            </c:filter>
          </c:calendar-query>
        `
            });

            const result = await parseStringPromise(response.data);
            // Transform XML result to easier format
            return result;
        } catch (error) {
            console.error('Error fetching Apple events:', error);
            throw error;
        }
    }
}
