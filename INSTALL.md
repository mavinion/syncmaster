# Installation Guide

This guide provides detailed instructions for setting up Calmesh using either Docker (recommended) or a manual installation.

## Prerequisites

- **Node.js**: v18 or higher (for manual installation)
- **Docker & Docker Compose**: (for Docker installation)
- **Git**: To clone the repository
- **Google Cloud Console Account**: To get OAuth credentials
- **Apple ID**: To generate an App-Specific Password

---

## Configuration (Required for both methods)

Before running the application, you need to configure the environment variables.

### 1. Backend Environment Variables
Create a `.env` file in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
# OR create it manually
touch backend/.env
```

Add the following content to `backend/.env`:

```env
# Database (Default for Docker)
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/calmesh"
REDIS_HOST=redis
REDIS_PORT=6379

# Security (CRITICAL FOR PRODUCTION)
# Generate a key with: openssl rand -hex 16
ENCRYPTION_KEY=replace_with_your_secure_hex_key

# Google Calendar API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Server Port
# Server Port
PORT=3000

# URL Configuration (Required for Production)
# Defaults to localhost if not set
FRONTEND_URL=http://localhost:3001
API_URL=http://localhost:3000
```

### 2. Frontend Environment Variables
Create a `.env` file in the `frontend/` directory if needed, or rely on defaults.
For Docker, these are set in `docker-compose.yml`.

For production, verify `NEXT_PUBLIC_API_URL` corresponds to your backend URL.

### 3. Production Deployment (Remote Server)
When deploying to a non-localhost environment (e.g., VPS, Cloud):

1. **Set URL Variables**:
   In your root `.env` file (used by docker-compose) or your specific service `.env` files, ensure you set:
   ```env
   # Backend .env
   FRONTEND_URL=https://your-frontend-domain.com
   API_URL=https://your-backend-domain.com
   GOOGLE_CALLBACK_URL=https://your-backend-domain.com/auth/google/callback
   ```

   And in `docker-compose.yml` or frontend build args:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-domain.com
   ```

2. **Google Cloud Console**:
   - Update **Authorized JavaScript origins** to `https://your-frontend-domain.com`
   - Update **Authorized redirect URIs** to `https://your-backend-domain.com/auth/google/callback`

---

## Option 1: Docker Installation (Recommended)

This method runs the Database, Redis, Backend, and Frontend in isolated containers.

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd Calmesh
    ```

2.  **Start the application:**
    ```bash
    docker-compose up --build -d
    ```

3.  **Verify running containers:**
    ```bash
    docker-compose ps
    ```

4.  **Access the application:**
    - Frontend: [http://localhost:3001](http://localhost:3001)
    - Backend API: [http://localhost:3000](http://localhost:3000)

---

## Option 2: Manual Installation

Use this method if you want to run services natively on your machine (e.g., via Homebrew on macOS).

### 1. Install Dependencies
Install PostgreSQL and Redis. On macOS with Homebrew:
```bash
brew install postgresql redis
brew services start postgresql
brew services start redis
```

### 2. Setup Database
Create the database:
```bash
createdb calmesh
```

### 3. Configure Backend
Update `backend/.env` to point to localhost:
```env
DATABASE_URL="postgresql://$(whoami):@localhost:5432/calmesh"
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Run Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init  # Initialize database
npm run dev
```
The backend will start on `http://localhost:3000`.

### 5. Run Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
The frontend will start on `http://localhost:3001` (or 3000 if backend is not running, check console).

---

## Getting Credentials

### Google Calendar API
1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project.
3.  Enable **Google Calendar API**.
4.  Go to **Credentials** -> **Create Credentials** -> **OAuth client ID**.
5.  Application type: **Web application**.
6.  Authorized redirect URIs: `http://localhost:3000/auth/google/callback`.
7.  Copy `Client ID` and `Client Secret` to your `backend/.env`.

### Apple Calendar (iCloud)
1.  Go to [appleid.apple.com](https://appleid.apple.com/).
2.  Sign in and go to **App-Specific Passwords**.
3.  Generate a new password (e.g., "calmesh").
4.  You will use your **Apple ID email** and this **App-Specific Password** when adding an account in the Calmesh UI.

---

## Troubleshooting

- **Database Connection Error**: Ensure PostgreSQL is running and the `DATABASE_URL` is correct.
- **Redis Error**: Ensure Redis is running (`redis-cli ping` should return `PONG`).
- **Encryption Key Warning**: If you see a warning about the encryption key, set `ENCRYPTION_KEY` in `backend/.env`.
