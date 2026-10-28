
import {emailFrom, transporter} from "../config/email.js";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export const sendEmail = async ({
  to,
  subject,
  html,
}: SendEmailInput) => {
  if (!to || !subject || !html) {
    throw new Error("Recipient, subject, and email HTML are required");
  }

  return transporter.sendMail({
    from: emailFrom,
    to,
    subject,
    html,
  });
};