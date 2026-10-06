import nodemailer from "nodemailer";
import { mailConfig } from "../config/mail.js";

if (
  !mailConfig.host ||
  !mailConfig.user ||
  !mailConfig.password ||
  !mailConfig.from
) {
  throw new Error("SMTP configuration is incomplete");
}

const transporter = nodemailer.createTransport({
  host: mailConfig.host,
  port: mailConfig.port,
  secure: mailConfig.port === 465,
  auth: {
    user: mailConfig.user,
    pass: mailConfig.password,
  },
});

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  await transporter.sendMail({
    from: mailConfig.from,
    to,
    subject,
    html,
  });
};