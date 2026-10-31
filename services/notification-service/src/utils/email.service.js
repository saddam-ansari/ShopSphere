
import nodemailer from "nodemailer";

const createTransporter = () => {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host) {
        throw new Error(
            "SMTP_HOST is missing from environment variables"
        );
    }

    if (!user || !pass) {
        throw new Error(
            "SMTP_USER or SMTP_PASS is missing"
        );
    }

    return nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user,
            pass,
        },
    });
};

export const verifyEmailConnection = async () => {
    const transporter = createTransporter();

    await transporter.verify();

    console.log(
        "Email SMTP connection verified successfully"
    );
};

export const sendEmail = async ({
    to,
    subject,
    text,
    html,
}) => {
    if (!to || !subject || (!text && !html)) {
        throw new Error(
            "Recipient, subject, and email content are required"
        );
    }

    const transporter = createTransporter();

    const result = await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    });

    const deliveryDetails = {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
        response: result.response,
        attemptedAt: new Date(),
    };

    console.log(
        "Email sent successfully:",
        deliveryDetails.messageId
    );

    return deliveryDetails;
};
