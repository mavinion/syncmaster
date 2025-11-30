# Features

## Core Synchronization
- **Bidirectional Sync**: Seamlessly sync events between Google Calendar and Apple Calendar (iCloud) in both directions.
- **One-Way Sync**: Configure sync direction per calendar:
    - **Google to Apple**: Changes in Google propagate to Apple.
    - **Apple to Google**: Changes in Apple propagate to Google.
- **Conflict Resolution**: Intelligent handling of simultaneous edits using ETags and timestamps to prevent data loss.
- **Automatic Synchronization**: Background job runs every 15 minutes to keep calendars in sync.
- **Manual Synchronization**: Trigger an immediate sync from the dashboard.

## Account Management
- **Google Integration**: Secure OAuth 2.0 authentication for Google accounts.
- **Apple Integration**: Secure connection using Apple ID and App-Specific Passwords (CalDAV).
- **Multi-User Support**: Platform supports multiple users, each with their own linked accounts.

## Calendar Management
- **Calendar Mapping**: Select specifically which calendars to sync.
- **Auto-Creation**: Automatically creates missing calendars on the target platform to match the source.
- **Sync Preferences**:
    - Enable/Disable sync per calendar.
    - Set sync direction per calendar.
    - Global auto-sync toggle.

## Event Features
- **Full Event Fidelity**: Syncs all major event details:
    - Title and Description
    - Start and End times (including Time Zones)
    - Location
    - Recurrence Rules (Daily, Weekly, etc.)
    - Reminders / Alarms
- **Deletions**: Propagates event cancellations and deletions across platforms.

## Privacy & Security
- **Self-Hosted**: Designed to be hosted on your own infrastructure (Docker support).
- **Data Privacy**: All data is stored locally in your PostgreSQL database. No external analytics.
- **Encryption**: Sensitive credentials (access tokens, refresh tokens, app passwords) are encrypted at rest using AES-256-CBC.
- **Secure Configuration**: Enforces use of strong encryption keys via environment variables.

## Monitoring & Administration
- **User Dashboard**:
    - View connection status of Google and Apple accounts.
    - Configure sync rules.
    - View recent sync history and status.
- **Sync Logs**: Detailed logs of every sync action (Create, Update, Delete, Link) with success/error status.
- **Admin Tools**:
    - **Log Viewer**: Inspect system-wide logs with filtering.
    - **Database Inspector**: View raw database tables and content.
    - **Basic Authentication**: Secures admin routes.
