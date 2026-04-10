import admin from "firebase-admin";

const formatPrivateKey = (value) => value?.replace(/\\n/g, "\n");

const getFirebaseCredentials = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY?.trim());

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
};

export const getFirebaseAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const credentialPayload = getFirebaseCredentials();

  if (!credentialPayload) {
    return null;
  }

  return admin.initializeApp({
    credential: admin.credential.cert(credentialPayload),
  });
};

export const verifyFirebaseToken = async (idToken) => {
  const app = getFirebaseAdminApp();

  if (!app) {
    throw new Error("Firebase admin credentials are missing");
  }

  return admin.auth(app).verifyIdToken(idToken, true);
};
