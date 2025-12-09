# Privacy Policy

**Last Updated:** 2025-11-30

## 1. Introduction
This application ("calmesh") is a self-hosted synchronization tool designed to sync calendar events between Google Calendar and Apple Calendar. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how data is handled within the application.

## 2. Data We Collect and Store
This application stores the following data in your local PostgreSQL database:

*   **Authentication Tokens**: OAuth2 access and refresh tokens for Google Calendar, and app-specific passwords for Apple Calendar. These are stored encrypted in the database.
*   **Calendar Events**: Metadata about synchronized events (e.g., Event IDs, ETags, Sync Status) to facilitate the synchronization process.
*   **Sync Logs**: Logs of synchronization activities, including success/failure status and error messages. **Note:** We strive to minimize PII in logs, but some event identifiers may be present for debugging purposes.

## 3. How We Use Your Data
The data collected is used solely for the purpose of:
*   Authenticating with Google and Apple services on your behalf.
*   Synchronizing calendar events between your connected accounts.
*   Providing you with a history of synchronization activities.

## 4. Data Storage and Security
*   **Local Storage**: All data is stored locally on your server (or the server where you host this application) in a PostgreSQL database.
*   **Encryption**: Sensitive authentication tokens are encrypted at rest using AES-256-CBC encryption.
*   **No External Analytics**: This application does not send any data to third-party analytics services or telemetry servers.

## 5. Your Rights (GDPR)
As this is a self-hosted application, you are the data controller. You have full control over your data:
*   **Access**: You can view all stored data by inspecting the PostgreSQL database.
*   **Rectification**: You can update your account settings and credentials via the application interface.
*   **Erasure**: You can delete your account and all associated data from the database at any time.
*   **Portability**: You can export your data directly from the PostgreSQL database.

## 6. Third-Party Services
This application interacts with the following third-party services:
*   **Google Calendar API**: To read and write events to your Google Calendar. Please refer to [Google's Privacy Policy](https://policies.google.com/privacy).
*   **Apple iCloud (CalDAV)**: To read and write events to your Apple Calendar. Please refer to [Apple's Privacy Policy](https://www.apple.com/legal/privacy/).

## 7. Contact
If you have questions about this Privacy Policy or the application's data handling, please contact the repository maintainer.
