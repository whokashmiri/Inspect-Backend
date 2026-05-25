import axios from "axios";
import { AppError } from "../../src/utils/AppError.js";

const TAQNYAT_BASE_URL =
  process.env.TAQNYAT_BASE_URL || "https://api.taqnyat.sa/v1/messages";

function toTaqnyatPhone(phone) {
  // Taqnyat expects international format without + or 00
  return phone.replace(/^\+/, "");
}

// export async function sendOtpSms({ phone, otp }) {
//   if (!process.env.TAQNYAT_API_KEY) {
//     throw new AppError("Taqnyat API key is missing", 500);
//   }

//   if (!process.env.TAQNYAT_SENDER) {
//     throw new AppError("Taqnyat sender name is missing", 500);
//   }

//   const recipient = toTaqnyatPhone(phone);

//   const body =
//     process.env.NODE_ENV === "production"
//       ? `Your verification code is ${otp}`
//       : `Your verification code is ${otp}`;

//   try {
//     const response = await axios.post(
//       TAQNYAT_BASE_URL,
//       {
//         recipients: [recipient],
//         body,
//         sender: process.env.TAQNYAT_SENDER,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.TAQNYAT_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//         timeout: 15000,
//       }
//     );

//     return response.data;
//   } catch (error) {
//     console.error("Taqnyat SMS error:", error.response?.data || error.message);
//     throw new AppError("Failed to send OTP SMS", 502);
//   }
// }

export async function sendOtpSms({ phone, otp }) {
  if (process.env.DEV_OTP_BYPASS === "true") {
    console.log("DEV OTP BYPASS");
    console.log("Phone:", phone);
    console.log("OTP:", process.env.DEV_OTP_CODE || otp);
    return {
      success: true,
      devBypass: true,
    };
  }

  const recipient = toTaqnyatPhone(phone);

  const response = await fetch(TAQNYAT_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TAQNYAT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipients: [recipient],
      body: `Your verification code is ${otp}`,
      sender: process.env.TAQNYAT_SENDER,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Taqnyat SMS error:", error);
    throw new AppError("Failed to send OTP SMS", 502);
  }

  return response.json();
}