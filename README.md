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

### Setup (Option 1: Full Docker - Recommended)

This will run the entire stack (Database, Redis, Backend, Frontend) in containers.

1.  **Install Docker Desktop:**
    [Download for Mac](https://docs.docker.com/desktop/install/mac-install/)

2.  **Configure Environment:**
    Create a `.env` file in the root directory (or rely on `docker-compose.yml` defaults for dev).
    *Note: You still need to set Google/Apple credentials in `backend/.env` or pass them as env vars.*

3.  **Start App:**
    ```bash
    docker-compose up --build -d
    ```

4.  **Access:**
    *   Frontend: `http://localhost:3001`
    *   Backend: `http://localhost:3000`

### Setup (Option 2: Native / Homebrew)
*Use this if you cannot install Docker Desktop.*

1.  **Install Services:**
    ```bash
    brew install postgresql redis
    ```

2.  **Start Services:**
    ```bash
    brew services start postgresql
    brew services start redis
    ```

3.  **Create Database:**
    ```bash
    createdb syncmaster
    ```

4.  **Update .env:**
    Ensure your `backend/.env` points to localhost:
    ```
    DATABASE_URL="postgresql://$(whoami):@localhost:5432/syncmaster"
    REDIS_HOST=localhost
    REDIS_PORT=6379
    ```

5.  **Run Backend:**
    ```bash
    cd backend
    npm install
    npx prisma migrate dev --name init
    npm run dev
    ```

6.  **Run Frontend:**
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

## Data Privacy & Security

### Privacy
This application is designed to be self-hosted and respects your data privacy. It does not send data to any external analytics services. All data is stored locally in your PostgreSQL database.
For more details, please read our [Privacy Policy](PRIVACY.md).

### Security
> [!IMPORTANT]
> **Encryption Key**: For production use, you **MUST** set the `ENCRYPTION_KEY` environment variable in `backend/.env`. This key is used to encrypt your Google and Apple credentials. If not set, a default (insecure) key is used, which is **NOT SAFE** for production.

To generate a secure key:
```bash
openssl rand -hex 16
```
Add this to your `backend/.env` file:
```
ENCRYPTION_KEY=your_generated_key_here
```

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
