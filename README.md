# SyncMaster

SyncMaster is a private SaaS for bi-directional synchronization between Google Calendar and Apple Calendar (iCloud).

## Project Structure

*   `backend/`: Node.js/Express + TypeScript API and Sync Worker.
*   `frontend/`: Next.js + Tailwind CSS Dashboard.
*   `docker-compose.yml`: Local development environment (Postgres, Redis).

## Getting Started

### Prerequisites

*   Docker & Docker Compose
*   Node.js (v18+)

### Setup

1.  **Start Infrastructure:**
    ```bash
    docker-compose up -d
    ```

2.  **Backend:**
    ```bash
    cd backend
    npm install
    npm run dev
    ```

3.  **Frontend:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## Features

*   Bi-directional sync (Google <-> Apple)
*   Real-time updates via Webhooks
*   Conflict resolution
*   Multi-user support
