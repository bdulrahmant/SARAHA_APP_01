import nodemailer from "nodemailer";
import {
  APPLICATION_NAME,
  EMAIL_PASS,
  EMAIL_USER,
} from "../../../../config/config.service.js";

export const sendEmail = async ({
  to,
  cc,
  bcc,
  subject,
  html,
  attachments = [],
}) => {
  // Create a transporter using Ethereal test credentials.
  // For production, replace with your actual SMTP server details.
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    to,
    cc,
    bcc,
    subject,
    html,
    attachments,
    
    from: `"${APPLICATION_NAME}" <${EMAIL_USER}>`,
  });

  console.log("Message sent:", info.messageId);
};
