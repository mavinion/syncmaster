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
      const events: any[] = [];

      if (result.multistatus && result.multistatus.response) {
        for (const resp of result.multistatus.response) {
          try {
            const propstat = resp.propstat?.[0];
            const prop = propstat?.prop?.[0];
            const calendarData = prop?.['c:calendar-data']?.[0] || prop?.['calendar-data']?.[0];

            if (calendarData) {
              let icsContent = '';
              if (typeof calendarData === 'string') {
                icsContent = calendarData;
              } else if (typeof calendarData === 'object' && calendarData._) {
                icsContent = calendarData._;
              }

              if (icsContent) {
                const event = this.parseICS(icsContent);
                if (event) {
                  // Capture the href (URL) of the event
                  if (resp.href && resp.href[0]) {
                    const rawHref = resp.href[0];
                    event.href = rawHref.startsWith('http') ? rawHref : new URL(rawHref, this.baseUrl).toString();
                  }
                  events.push(event);
                }
              }
            }
          } catch (e) {
            console.error('Error parsing individual event:', e);
          }
        }
      }
      return events;
    } catch (error) {
      console.error('Error fetching Apple events:', error);
      throw error;
    }
  }

  private parseICS(icsData: string) {
    try {
      // Very basic ICS parser
      const lines = icsData.split(/\r\n|\n|\r/);
      const event: any = {};
      let inEvent = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('BEGIN:VEVENT')) {
          inEvent = true;
          continue;
        }
        if (line.startsWith('END:VEVENT')) {
          inEvent = false;
          continue;
        }

        if (inEvent) {
          if (line.startsWith('UID:')) event.id = line.substring(4);
          if (line.startsWith('SUMMARY:')) event.summary = line.substring(8);
          if (line.startsWith('DESCRIPTION:')) event.description = line.substring(12);
          if (line.startsWith('LOCATION:')) event.location = line.substring(9);
          if (line.startsWith('RRULE:')) event.rrule = line;
          if (line.startsWith('LAST-MODIFIED:')) event.lastModified = this.parseICSDate(line.substring(14));

          // Handle DTSTART and DTEND (simplified)
          if (line.startsWith('DTSTART')) {
            const parts = line.split(':');
            event.start = this.parseICSDate(parts[parts.length - 1]);
          }
          if (line.startsWith('DTEND')) {
            const parts = line.split(':');
            event.end = this.parseICSDate(parts[parts.length - 1]);
          }

          // Basic VALARM detection (just checking if one exists and getting trigger)
          if (line.startsWith('BEGIN:VALARM')) {
            event.hasAlarm = true;
          }
          if (event.hasAlarm && line.startsWith('TRIGGER:')) {
            event.alarmTrigger = line.substring(8);
          }
        }
      }
      return event.id ? event : null;
    } catch (e) {
      console.error('Failed to parse ICS', e);
      return null;
    }
  }

  private parseICSDate(dateStr: string): Date {
    // 20230101T120000Z or 20230101
    if (!dateStr) return new Date();

    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));

    if (dateStr.length === 8) {
      return new Date(year, month, day);
    }

    const hour = parseInt(dateStr.substring(9, 11));
    const minute = parseInt(dateStr.substring(11, 13));
    const second = parseInt(dateStr.substring(13, 15));

    // Assume UTC if Z is present, otherwise local (simplified)
    if (dateStr.endsWith('Z')) {
      return new Date(Date.UTC(year, month, day, hour, minute, second));
    }

    return new Date(year, month, day, hour, minute, second);
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

    const location = eventData.location ? `LOCATION:${eventData.location}` : '';

    let alarm = '';
    if (eventData.reminders && eventData.reminders.overrides && eventData.reminders.overrides.length > 0) {
      // Use the first override for simplicity
      const minutes = eventData.reminders.overrides[0].minutes;
      alarm = `BEGIN:VALARM
TRIGGER:-PT${minutes}M
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM`;
    }

    let recurrenceRule = '';
    if (eventData.recurrence && eventData.recurrence.length > 0) {
      // Google sends recurrence as an array of strings, e.g. ["RRULE:FREQ=WEEKLY;BYDAY=MO"]
      // We take the first one that starts with RRULE
      const rrule = eventData.recurrence.find((r: string) => r.startsWith('RRULE:'));
      if (rrule) {
        recurrenceRule = rrule;
      }
    }

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
${location}
${recurrenceRule}
${alarm}
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

  async updateEvent(calendarUrl: string, eventId: string, eventData: any, eventHref?: string) {
    const formatToICS = (isoString: string) => isoString.replace(/[-:]/g, '').split('.')[0] + 'Z';

    const start = eventData.start.dateTime
      ? `DTSTART:${formatToICS(new Date(eventData.start.dateTime).toISOString())}`
      : `DTSTART;VALUE=DATE:${eventData.start.date.replace(/-/g, '')}`;

    const end = eventData.end.dateTime
      ? `DTEND:${formatToICS(new Date(eventData.end.dateTime).toISOString())}`
      : `DTEND;VALUE=DATE:${eventData.end.date.replace(/-/g, '')}`;

    const location = eventData.location ? `LOCATION:${eventData.location}` : '';

    let alarm = '';
    if (eventData.reminders && eventData.reminders.overrides && eventData.reminders.overrides.length > 0) {
      // Use the first override for simplicity
      const minutes = eventData.reminders.overrides[0].minutes;
      alarm = `BEGIN:VALARM
TRIGGER:-PT${minutes}M
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM`;
    }

    let recurrenceRule = '';
    if (eventData.recurrence && eventData.recurrence.length > 0) {
      // Google sends recurrence as an array of strings
      const rrule = eventData.recurrence.find((r: string) => r.startsWith('RRULE:'));
      if (rrule) {
        recurrenceRule = rrule;
      }
    }

    // We must reuse the existing UID (eventId)
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SyncMaster//EN
BEGIN:VEVENT
UID:${eventId}
DTSTAMP:${formatToICS(new Date().toISOString())}
${start}
${end}
SUMMARY:${eventData.summary}
DESCRIPTION:${eventData.description || ''}
${location}
${recurrenceRule}
${alarm}
END:VEVENT
END:VCALENDAR`;

    try {
      // Use provided href if available, otherwise fallback to constructing it
      let targetUrl = '';
      if (eventHref) {
        // Ensure it's a full URL
        targetUrl = eventHref.startsWith('http') ? eventHref : new URL(eventHref, this.baseUrl).toString();
      } else {
        targetUrl = `${calendarUrl}${eventId}.ics`;
      }

      await axios({
        method: 'PUT',
        url: targetUrl,
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'text/calendar; charset=utf-8',
        },
        data: icsContent,
      });
      return eventId;
    } catch (error) {
      console.error('Error updating Apple event:', error);
      throw error;
    }
  }

  async deleteEvent(calendarUrl: string, eventUrl: string) {
    try {
      await axios({
        method: 'DELETE',
        url: eventUrl,
        headers: {
          'Authorization': this.authHeader,
        },
      });
    } catch (e) {
      console.error('Failed to delete Apple event', e);
      throw e;
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
    const calendarUuid = uuidv4().toUpperCase(); // iCloud uses uppercase UUIDs typically
    const newCalendarUrl = `${homeUrl}${calendarUuid}/`;

    console.log(`Creating new Apple calendar at: ${newCalendarUrl}`);

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
                <c:supported-calendar-component-set>
                  <c:comp name="VEVENT"/>
                </c:supported-calendar-component-set>
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
