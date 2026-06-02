// authentica.sms.js
import { AppError } from "../utils/AppError.js";

const AUTHENTICA_BASE_URL =
  process.env.AUTHENTICA_BASE_URL || "https://api.authentica.sa/api/v2";

function toAuthenticaPhone(phone) {
  const cleaned = String(phone).trim().replace(/\s+/g, "");

  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith("966")) return `+${cleaned}`;
  if (cleaned.startsWith("05")) return `+966${cleaned.slice(1)}`;
  if (cleaned.startsWith("5")) return `+966${cleaned}`;

  return cleaned;
}

export async function sendAuthenticaOtp({ phone }) {
  if (!phone) {
    throw new AppError("Phone number is required", 400);
  }

  if (process.env.DEV_OTP_BYPASS === "true") {
    console.log("DEV OTP BYPASS");
    console.log("Phone:", phone);

    return {
      success: true,
      devBypass: true,
    };
  }

  const formattedPhone = toAuthenticaPhone(phone);

  const response = await fetch(`${AUTHENTICA_BASE_URL}/send-otp`, {
    method: "POST",
    headers: {
      "X-Authorization": process.env.AUTHENTICA_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      method: "sms",
      phone: formattedPhone,
      template_id: Number(process.env.AUTHENTICA_TEMPLATE_ID || 5),
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.success === false) {
    console.error("Authentica send OTP error:", data);

    throw new AppError(data?.message || "Failed to send OTP SMS", 502);
  }

  return data;
}

export async function verifyAuthenticaOtp({ phone, otp }) {
  if (!phone) {
    throw new AppError("Phone number is required", 400);
  }

  if (!otp) {
    throw new AppError("OTP is required", 400);
  }

  if (process.env.DEV_OTP_BYPASS === "true") {
    return {
      success: otp === (process.env.DEV_OTP_CODE || "1234"),
      devBypass: true,
    };
  }

  const formattedPhone = toAuthenticaPhone(phone);

  const response = await fetch(`${AUTHENTICA_BASE_URL}/verify-otp`, {
    method: "POST",
    headers: {
      "X-Authorization": process.env.AUTHENTICA_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      phone: formattedPhone,
      otp,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.success === false) {
    console.error("Authentica verify OTP error:", data);

    return {
      success: false,
      data,
    };
  }

  return {
    success: true,
    data,
  };
}