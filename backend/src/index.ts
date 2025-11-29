import express from 'express';
import dotenv from 'dotenv';
import passport from 'passport';
import { setupGoogleStrategy } from './modules/auth/google.strategy';
import authRoutes from './modules/auth/auth.routes';
import syncRoutes from './modules/sync/sync.routes';
import { setupSyncWorker, setupScheduler } from './modules/sync/sync.worker';

import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

setupGoogleStrategy();
setupSyncWorker();
setupScheduler();

import calendarRoutes from './modules/sync/calendars.routes';

app.use('/auth', authRoutes);
import logsRouter from './modules/sync/logs.routes';

app.use('/sync', syncRoutes);
app.use('/calendars', calendarRoutes);
app.use('/sync/logs', logsRouter);

import adminRoutes from './routes/admin.routes';
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('SyncMaster API is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
