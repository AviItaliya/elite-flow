import "dotenv/config";
import {cert, getApps, initializeApp} from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Firebase credentials are missing from environment variables");
}

const firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp({
        credential: cert({projectId, clientEmail, privateKey}), projectId});

export const firebaseMessaging = getMessaging(firebaseApp);