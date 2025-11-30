# SyncMaster

SyncMaster is a private SaaS for bi-directional synchronization between Google Calendar and Apple Calendar (iCloud).

## Project Structure

*   `backend/`: Node.js/Express + TypeScript API and Sync Worker.
*   `frontend/`: Next.js + Tailwind CSS Dashboard.
*   `docker-compose.yml`: Local development environment (Postgres, Redis).

## Getting Started

For detailed installation instructions (Docker and Manual), please refer to the [Installation Guide](INSTALL.md).

### Quick Start (Docker)

1.  **Clone the repository.**
2.  **Create `backend/.env`** (see [INSTALL.md](INSTALL.md#configuration-required-for-both-methods)).
3.  **Run:**
    ```bash
    docker-compose up --build -d
    ```
4.  **Access:**
    - Frontend: `http://localhost:3001`
    - Backend: `http://localhost:3000`

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
