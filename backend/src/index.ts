import express from 'express';
import dotenv from 'dotenv';
import passport from 'passport';
import { setupGoogleStrategy } from './modules/auth/google.strategy';
import authRoutes from './modules/auth/auth.routes';
import { setupSyncWorker } from './modules/sync/sync.worker';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(passport.initialize());

setupGoogleStrategy();
setupSyncWorker();

app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('SyncMaster API is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
