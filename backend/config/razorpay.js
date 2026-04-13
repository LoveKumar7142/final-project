let razorpayInstance = null;

export const getRazorpay = async () => {
  if (razorpayInstance) {
    return razorpayInstance;
  }

  try {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!keyId || !keySecret || keyId.length < 10 || keySecret.length < 10) {
      throw new Error("Payment service unavailable");
    }

    const { default: Razorpay } = await import("razorpay");

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    return razorpayInstance;
  } catch (error) {
    console.error("RAZORPAY INIT ERROR:", error);
    throw new Error("Payment service unavailable");
  }
};
