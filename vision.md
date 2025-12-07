# Vision: SyncMaster - Google & Apple Calendar Synchronization SaaS

## 1. Executive Summary
**SyncMaster** is a Software-as-a-Service (SaaS) platform designed to seamlessly synchronize calendar events between Google Calendar and Apple Calendar (iCloud) in real-time. It solves the fragmentation problem for users who operate across both ecosystems, ensuring that their schedules are always up-to-date on all devices without manual intervention.

## 2. The Problem
Many professionals and individuals use a mix of devices and services:
- **Corporate environments** often rely on Google Workspace (Google Calendar).
- **Personal devices** (iPhone, Mac, iPad) often default to Apple Calendar.
- **Existing solutions** are often clunky, require installing apps on every device, or rely on "subscribing" to calendars which updates slowly (sometimes taking up to 24 hours) and is often read-only.
- **Manual entry** leads to errors and double-booking.

## 3. The Solution
A cloud-based, "set it and forget it" service that performs **true bi-directional synchronization**.

### Core Functionality:
*   **Bi-Directional & One-Way Sync:** Supports true bi-directional sync, as well as one-way sync (Google → Apple or Apple → Google). Changes are propagated according to the user's preference.
*   **Real-Time Updates:** Webhooks and push notifications ensure changes are propagated almost instantly.
*   **Cloud-Based:** No app installation required on the user's phone or computer. The sync happens server-to-server.
*   **Conflict Resolution:** Intelligent handling of edits made to the same event on both platforms.
*   **Privacy First:** Minimal data retention. We only store what is necessary to map the events.

## 4. Key Features (MVP)
1.  **OAuth Integration:** Secure login with Google and Apple ID (App-specific passwords or iCloud API).
2.  **Dashboard:** Simple web interface to link accounts and view sync status.
3.  **Customizable Sync Rules:**
    *   Select specific calendars to sync.
    *   One-way (Google → Apple or Apple → Google) vs. Two-way sync options.
4.  **History & Logs:** View a log of synced items to verify activity.

## 5. Target Audience
*   **Freelancers & Consultants:** Who manage personal schedules on Apple devices but collaborate with clients on Google Calendar.
*   **Mixed-Ecosystem Households:** Families sharing events across Android/Google and iOS/Apple devices.
*   **Professionals:** Using Mac/iPhone for personal productivity but forced to use Google Calendar for work.

## 6. Technical Architecture High-Level
*   **Backend:** Node.js/TypeScript or Go for high-concurrency handling of sync jobs.
*   **Database:** PostgreSQL for user data and sync mapping (storing IDs of linked events).
*   **Queue System:** Redis/BullMQ for managing sync jobs and retries.
*   **Frontend:** React/Next.js for the user dashboard.

## 7. Mobile App Extension
To provide a native experience on mobile devices, a companion app is planned:
*   **Tech Stack:** Compose Multiplatform & Kotlin Multiplatform (KMP) for maximizing code sharing between Android and iOS.
*   **Functionality:** Serves as an alternative frontend dashboard, allowing users to configure syncs, view logs, and manage subscriptions on the go.
*   **Open Source & Security:** Like the core platform, the app will be open source and hosted on a public GitHub repository. To ensure security, no sensitive credentials or configuration keys will be committed to version control. Configuration will be read from local files (e.g., secure properties files) that are excluded from git.
