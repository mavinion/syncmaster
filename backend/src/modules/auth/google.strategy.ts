import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';
import { encrypt } from '../../utils/encryption';

const prisma = new PrismaClient();

export const setupGoogleStrategy = () => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID || '',
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
                callbackURL: process.env.GOOGLE_CALLBACK_URL || (process.env.API_URL ? `${process.env.API_URL}/auth/google/callback` : 'http://localhost:3000/auth/google/callback'),
                passReqToCallback: true,
            },
            async (req, accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0].value;
                    if (!email) {
                        return done(new Error('No email found from Google'), undefined);
                    }

                    // Find or create user
                    let user = await prisma.user.findUnique({
                        where: { email },
                    });

                    if (!user) {
                        user = await prisma.user.create({
                            data: {
                                email,
                                name: profile.displayName,
                            },
                        });
                    }

                    // Update or create Google Account link
                    // Note: In a real app, we should encrypt tokens
                    const existingAccount = await prisma.account.findFirst({
                        where: {
                            userId: user.id,
                            provider: 'google',
                        },
                    });

                    if (existingAccount) {
                        await prisma.account.update({
                            where: { id: existingAccount.id },
                            data: {
                                accessToken: encrypt(accessToken),
                                refreshToken: refreshToken ? encrypt(refreshToken) : undefined, // Google only sends this on first auth or if access_type=offline
                                updatedAt: new Date(),
                            },
                        });
                    } else {
                        await prisma.account.create({
                            data: {
                                userId: user.id,
                                provider: 'google',
                                providerId: profile.id,
                                accessToken: encrypt(accessToken),
                                refreshToken: refreshToken ? encrypt(refreshToken) : undefined,
                            },
                        });
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error as Error, undefined);
                }
            }
        )
    );

    passport.serializeUser((user: any, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await prisma.user.findUnique({ where: { id } });
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};
