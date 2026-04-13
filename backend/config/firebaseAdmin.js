let admin; // 🔥 lazy load

// ✅ format private key safely
const formatPrivateKey = (value) => {
  if (!value || typeof value !== "string") return null;
  return value.replace(/\\n/g, "\n");
};

// ✅ get credentials from env
const getFirebaseCredentials = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = formatPrivateKey(
    process.env.FIREBASE_PRIVATE_KEY?.trim()
  );

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

// ✅ Initialize Firebase App (Singleton)
export const getFirebaseAdminApp = async () => {
  const adminInstance = await getAdmin();

  // ✅ already initialized
  if (adminInstance.apps.length > 0) {
    return adminInstance.app();
  }

  const credentialPayload = getFirebaseCredentials();

  if (!credentialPayload) {
    return null;
  }

  return adminInstance.initializeApp(
    {
      credential: adminInstance.credential.cert(credentialPayload),
    },
    "default"
  );
};

// 🔐 VERIFY TOKEN (FULLY SECURE)
export const verifyFirebaseToken = async (idToken) => {
  // ✅ basic validation
  if (!idToken || typeof idToken !== "string" || idToken.length < 10) {
    throw new Error("Invalid token");
  }

  try {
    const credentialPayload = getFirebaseCredentials();

    if (!credentialPayload) {
      throw new Error("Authentication service unavailable");
    }

    const adminInstance = await getAdmin();
    const app = await getFirebaseAdminApp();

    if (!app) {
      throw new Error("Authentication service unavailable");
    }

    // ✅ verify token + check revocation
    return await adminInstance.auth(app).verifyIdToken(idToken, true);

  } catch (error) {
    console.error("FIREBASE AUTH ERROR:", error);
    throw new Error("Invalid or expired token");
  }
};