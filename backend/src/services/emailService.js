import nodemailer from "nodemailer";

const buildTransporter = () => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendInvoiceEmail = async ({ to, subject, html }) => {
  const transporter = buildTransporter();
  if (!transporter) {
    return { skipped: true };
  }

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    html,
  });

  return { sent: true };
};
