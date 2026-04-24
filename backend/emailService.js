import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Helps in some local network environments
  }
});

export const sendOTPEmail = async (toEmail, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(`⚠️ Warning: EMAIL_USER or EMAIL_PASS not set in .env. Falling back to mock email. OTP is: ${otp}`);
    return true; // Pretend it succeeded
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Your Password Reset OTP - Digital Attendance System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e293b; text-align: center;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
          We received a request to reset your password for the Digital Attendance System. 
          Please use the following One-Time Password (OTP) to proceed. This OTP is valid for 15 minutes.
        </p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <h1 style="color: #6366f1; font-size: 36px; margin: 0; letter-spacing: 4px;">${otp}</h1>
        </div>
        <p style="color: #64748b; font-size: 14px; text-align: center;">
          If you did not request this password reset, please ignore this email or contact support.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send OTP email');
  }
};
