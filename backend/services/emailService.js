const axios = require("axios");

const BREVO_API = "https://api.brevo.com/v3/smtp/email";

async function sendEmail({ to, subject, html }) {
  try {
    console.log("Calling Brevo API...");
    const response = await axios.post(
      BREVO_API,
      {
        sender: {
          name: "Triangle Creative Lab",
          email: process.env.EMAIL_FROM,
        },
        to: [
          {
            email: to,
          },
        ],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Brevo response:", response.data);

    return response.data;
  } catch (err) {
  console.error(
    "Brevo Email Error:",
    err.response?.data || err.message
  );

  throw err;
}
}

module.exports = {
  sendEmail,
};