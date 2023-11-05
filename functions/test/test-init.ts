import { FeaturesList } from 'firebase-functions-test/lib/features';

process.env['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const firebaseTest: FeaturesList = require('firebase-functions-test')();
