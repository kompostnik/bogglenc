import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
// import * as functions from 'firebase-functions';

admin.initializeApp();

export const db = admin.firestore();


if(!process.env['FIRESTORE_EMULATOR_HOST']) {
// This setup needs to be here for email authentication to work. If this is removed then each time
// user tries to login with email, an account creation form is presented instead of login.
// https://cloud.google.com/identity-platform/docs/admin/email-enumeration-protection#disable
  getAuth()
    .projectConfigManager()
    .updateProjectConfig({
      emailPrivacyConfig: {
        enableImprovedEmailPrivacy: false
      }
    });
}
// ^^^^

