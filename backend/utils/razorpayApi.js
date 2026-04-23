import https from "https";

const buildAuthHeader = () => {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new Error("Payment service unavailable");
  }

  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
};

export const createRazorpayOrder = async ({ amount, currency = "INR", receipt }) => {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Invalid amount");
  }

  return await new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      amount,
      currency,
      receipt,
    });

    const request = https.request(
      {
        hostname: "api.razorpay.com",
        path: "/v1/orders",
        method: "POST",
        headers: {
          Authorization: buildAuthHeader(),
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: 10000,
      },
      (response) => {
        const chunks = [];

        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");

          try {
            const parsed = raw ? JSON.parse(raw) : {};

            if (response.statusCode && response.statusCode >= 400) {
              const error = new Error(
                parsed?.error?.description || "Payment service unavailable",
              );
              error.statusCode = response.statusCode;
              error.details = parsed;
              return reject(error);
            }

            resolve(parsed);
          } catch (parseError) {
            reject(parseError);
          }
        });
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error("Payment request timed out"));
    });

    request.on("error", reject);
    request.write(payload);
    request.end();
  });
};
