let admin; // ❗ lazy load

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

// 🔥 Lazy load firebase-admin
const getAdmin = async () => {
  if (!admin) {
    admin = (await import("firebase-admin")).default;
  }
  return admin;
};

export const getFirebaseAdminApp = async () => {
  const adminInstance = await getAdmin();

  if (adminInstance.apps.length > 0) {
    return adminInstance.app();
  }

  const credentialPayload = getFirebaseCredentials();

  if (!credentialPayload) {
    return null;
  }

  return adminInstance.initializeApp({
    credential: adminInstance.credential.cert(credentialPayload),
  });
};

export const verifyFirebaseToken = async (idToken) => {
  const credentialPayload = getFirebaseCredentials();

  if (!credentialPayload) {
    throw new Error("Firebase admin credentials are missing");
  }

  const adminInstance = await getAdmin();
  const app = await getFirebaseAdminApp();

  if (!app) {
    throw new Error("Firebase admin credentials are missing");
  }

  return adminInstance.auth(app).verifyIdToken(idToken, true);
};
