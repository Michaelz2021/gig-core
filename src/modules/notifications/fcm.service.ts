import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private firebaseApp: admin.app.App | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeFirebase();
  }

  private async initializeFirebase() {
    try {
      const projectId = this.configService.get('FIREBASE_PROJECT_ID');
      const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY');
      const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn('Firebase credentials not found. Push notifications will be disabled.');
        return;
      }

      // Format private key
      let formattedPrivateKey = privateKey;
      formattedPrivateKey = formattedPrivateKey.trim();
      if (formattedPrivateKey.startsWith('"') && formattedPrivateKey.endsWith('"')) {
        formattedPrivateKey = formattedPrivateKey.slice(1, -1);
      }
      if (formattedPrivateKey.startsWith("'") && formattedPrivateKey.endsWith("'")) {
        formattedPrivateKey = formattedPrivateKey.slice(1, -1);
      }
      formattedPrivateKey = formattedPrivateKey.replace(/\\\\n/g, '\n');
      formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
      formattedPrivateKey = formattedPrivateKey.replace(/\\\r?\n/g, '\n');

      if (admin.apps.length === 0) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey: formattedPrivateKey,
            clientEmail,
          }),
        });
        this.logger.log('Firebase Admin SDK initialized successfully');
      } else {
        this.firebaseApp = admin.app();
        this.logger.log('Using existing Firebase app instance');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }

  async sendPushNotification(
    deviceTokens: string[],
    notification: {
      title: string;
      body: string;
      data?: Record<string, any>;
      imageUrl?: string;
    },
  ): Promise<{
    success: number;
    failure: number;
    errors: any[];
  }> {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Skipping push notification.');
      return { success: 0, failure: deviceTokens.length, errors: [] };
    }

    if (!deviceTokens || deviceTokens.length === 0) {
      this.logger.warn('No device tokens provided');
      return { success: 0, failure: 0, errors: [] };
    }

    const validTokens = deviceTokens.filter((token) => token && token.trim().length > 0);
    if (validTokens.length === 0) {
      this.logger.warn('No valid device tokens found');
      return { success: 0, failure: deviceTokens.length, errors: [] };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: notification.data
          ? Object.keys(notification.data).reduce((acc, key) => {
              acc[key] = String(notification.data![key]);
              return acc;
            }, {} as Record<string, string>)
          : undefined,
        tokens: validTokens,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      const successCount = response.successCount;
      const failureCount = response.failureCount;
      const errors: any[] = [];

      if (response.responses) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            errors.push({
              token: validTokens[idx],
              error: resp.error,
            });
            if (
              resp.error?.code === 'messaging/invalid-registration-token' ||
              resp.error?.code === 'messaging/registration-token-not-registered'
            ) {
              this.logger.warn(`Invalid or unregistered token: ${validTokens[idx]}`);
            }
          }
        });
      }

      this.logger.log(`Push notification sent: ${successCount} success, ${failureCount} failure`);
      return {
        success: successCount,
        failure: failureCount,
        errors,
      };
    } catch (error: any) {
      this.logger.error('Error sending push notification:', error);
      return {
        success: 0,
        failure: validTokens.length,
        errors: [{ error: error.message }],
      };
    }
  }

  async sendToDevice(
    deviceToken: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, any>;
      imageUrl?: string;
    },
  ): Promise<boolean> {
    const result = await this.sendPushNotification([deviceToken], notification);
    return result.success > 0;
  }

  getFirebaseApp(): admin.app.App | null {
    return this.firebaseApp || null;
  }
}
