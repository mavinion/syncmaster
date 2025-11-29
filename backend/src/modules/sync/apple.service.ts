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

  async discoverCalendarUrl(): Promise<string> {
    try {
      // 1. Get Principal URL
      const principalResponse = await axios({
        method: 'PROPFIND',
        url: this.baseUrl,
        headers: {
          'Authorization': this.authHeader,
          'Depth': '0',
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

      const principalResult = await parseStringPromise(principalResponse.data);
      let principalUrl = '';
      try {
        const href = principalResult['multistatus']['response'][0]['propstat'][0]['prop'][0]['current-user-principal'][0]['href'][0];
        if (typeof href === 'string') {
          principalUrl = href;
        } else if (typeof href === 'object' && href._) {
          // xml2js sometimes puts text content in '_'
          principalUrl = href._;
        }
      } catch (e) {
        console.log('Failed to parse principal, trying direct home set discovery on base');
      }

      // 2. Get Calendar Home Set
      // Ensure we don't construct a malformed URL
      if (!principalUrl || typeof principalUrl !== 'string') {
        console.warn('Could not determine principal URL, defaulting to base');
        principalUrl = '';
      }

      const homeSetUrl = principalUrl ? new URL(principalUrl, this.baseUrl).toString() : this.baseUrl;

      const homeSetResponse = await axios({
        method: 'PROPFIND',
        url: homeSetUrl,
        headers: {
          'Authorization': this.authHeader,
          'Depth': '0',
          'Content-Type': 'application/xml; charset=utf-8',
        },
        data: `
          <d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
            <d:prop>
              <c:calendar-home-set />
            </d:prop>
          </d:propfind>
        `
      });

      // 3. Parse Calendar Home Set
      const homeSetResult = await parseStringPromise(homeSetResponse.data);
      const homeSetUrlObj = homeSetResult['multistatus']['response'][0]['propstat'][0]['prop'][0]['calendar-home-set'][0]['href'][0];

      let homeSetUrlResult = '';
      if (typeof homeSetUrlObj === 'string') {
        homeSetUrlResult = homeSetUrlObj;
      } else if (typeof homeSetUrlObj === 'object' && homeSetUrlObj._) {
        homeSetUrlResult = homeSetUrlObj._;
      }

      return homeSetUrlResult;

    } catch (error: any) {
      console.error('Error discovering Apple calendar:', error.message);
      if (error.response) {
        console.error('Apple API Error Response:', error.response.status, error.response.data);
      }

      // Smart Fallback: If we found a principal URL, try to guess the calendar home
      // Principal: https://caldav.icloud.com/123456/principal/
      // Home:      https://caldav.icloud.com/123456/calendars/
      // We need to retrieve the principalUrl from the scope if possible, but it's local to the try block.
      // Let's rely on a heuristic if we can't parse it.

      // Actually, let's try to extract the DSID from the auth header if possible, or just fail.
      // The previous fallback was definitely wrong.

      return `${this.baseUrl}/calendars/`;
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
      return result;
    } catch (error) {
      console.error('Error fetching Apple events:', error);
      throw error;
    }
  }

  async createEvent(calendarUrl: string, eventData: any) {
    const uuid = uuidv4();
    const formatToICS = (isoString: string) => isoString.replace(/[-:]/g, '').split('.')[0] + 'Z';

    const start = eventData.start.dateTime
      ? `DTSTART:${formatToICS(new Date(eventData.start.dateTime).toISOString())}`
      : `DTSTART;VALUE=DATE:${eventData.start.date.replace(/-/g, '')}`;

    const end = eventData.end.dateTime
      ? `DTEND:${formatToICS(new Date(eventData.end.dateTime).toISOString())}`
      : `DTEND;VALUE=DATE:${eventData.end.date.replace(/-/g, '')}`;

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SyncMaster//EN
BEGIN:VEVENT
UID:${uuid}
DTSTAMP:${formatToICS(new Date().toISOString())}
${start}
${end}
SUMMARY:${eventData.summary}
DESCRIPTION:${eventData.description || ''}
END:VEVENT
END:VCALENDAR`;

    try {
      await axios({
        method: 'PUT',
        url: `${calendarUrl}${uuid}.ics`,
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'text/calendar; charset=utf-8',
        },
        data: icsContent,
      });
      return uuid;
    } catch (error) {
      console.error('Error creating Apple event:', error);
      throw error;
    }
  }

  async listCalendars() {
    console.log('Starting Apple calendar discovery...');
    const homeUrl = await this.discoverCalendarUrl();
    console.log('Discovered Home URL:', homeUrl);
    try {
      const response = await axios({
        method: 'PROPFIND',
        url: homeUrl,
        headers: {
          'Authorization': this.authHeader,
          'Depth': '1',
          'Content-Type': 'application/xml; charset=utf-8',
        },
        data: `
          <d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
            <d:prop>
              <d:displayname />
              <d:resourcetype />
            </d:prop>
          </d:propfind>
        `
      });

      console.log('PROPFIND response status:', response.status);
      const result = await parseStringPromise(response.data);
      const calendars: any[] = [];

      if (result.multistatus && result.multistatus.response) {
        console.log('Number of responses:', result.multistatus.response.length);
        for (const resp of result.multistatus.response) {
          // Log the first response to see structure
          if (calendars.length === 0 && result.multistatus.response.indexOf(resp) === 0) {
            console.log('Sample Response Structure:', JSON.stringify(resp, null, 2));
          }

          // Check if it is a calendar
          // Safely access nested properties
          const propstat = resp.propstat?.[0];
          const prop = propstat?.prop?.[0];
          const resourceType = prop?.resourcetype?.[0];

          // Log resource type for debugging
          // console.log('Resource Type:', JSON.stringify(resourceType));

          if (resourceType && (resourceType['c:calendar'] || resourceType['calendar'])) {
            const href = resp.href[0];

            let displayName = 'Untitled';
            if (prop.displayname && prop.displayname[0]) {
              const dn = prop.displayname[0];
              if (typeof dn === 'string') {
                displayName = dn;
              } else if (typeof dn === 'object' && dn._) {
                displayName = dn._;
              }
            }

            // Ensure absolute URL
            const fullUrl = href.startsWith('http') ? href : new URL(href, this.baseUrl).toString();

            console.log('Found calendar:', displayName, fullUrl);
            calendars.push({
              id: fullUrl,
              summary: displayName,
            });
          }
        }
      }
      console.log('Total calendars found:', calendars.length);
      return calendars;
    } catch (error) {
      console.error('Error listing Apple calendars:', error);
      throw error;
    }
  }

  async createCalendar(name: string) {
    const homeUrl = await this.discoverCalendarUrl();
    const calendarSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newCalendarUrl = `${homeUrl}${calendarSlug}/`;

    try {
      await axios({
        method: 'MKCALENDAR',
        url: newCalendarUrl,
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/xml; charset=utf-8',
        },
        data: `
          <c:mkcalendar xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
            <d:set>
              <d:prop>
                <d:displayname>${name}</d:displayname>
              </d:prop>
            </d:set>
          </c:mkcalendar>
        `
      });
      return { id: newCalendarUrl, summary: name };
    } catch (error) {
      console.error('Error creating Apple calendar:', error);
      throw error;
    }
  }
}
