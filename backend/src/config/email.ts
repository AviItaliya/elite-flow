import "dotenv/config";
import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
  throw new Error("SMTP environment variables are not configured");
}

const port = Number(SMTP_PORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("SMTP_PORT must be a valid port number");
}

export const emailFrom = process.env.SMTP_FROM || SMTP_USER;

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure: port === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
});

export const verifyEmailConnection = async () => {
  await transporter.verify();
  console.log("SMTP connection verified");
};