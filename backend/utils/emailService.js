import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { formatIndianRupee } from '../../Quick-Cart-main/src/utils/currency.js';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Fallback for test account
const createTestAccount = async () => {
  const testAccount = await nodemailer.createTestAccount();
  return {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  };
};

// Transporter config
const configureTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('✅ Using SMTP credentials');
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  console.log('⚠️ Using Ethereal for testing (not for production)');
  const config = await createTestAccount();
  return nodemailer.createTransport(config);
};

/**
 * Send Password Reset Email
 */
export const sendPasswordResetEmail = async (to, resetToken) => {
  try {
    const transporter = await configureTransporter();
    const resetUrl = `http://localhost:8080/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: '"Quick Cart" <noreply@quickcart.com>',
      to,
      subject: 'Password Reset Instructions',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Reset Your Password</h2>
          <p>You requested a password reset for your Quick Cart account.</p>
          <p>Click below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block; background-color:#3b82f6; color:white; padding:10px 20px; border-radius:4px;">Reset Password</a>
          <p>If you didn’t request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset email sent to: ${to}`);
    return {
      success: true,
      messageId: info.messageId,
      ...(info.envelope.from.includes('ethereal.email') ? { previewUrl: nodemailer.getTestMessageUrl(info) } : {}),
    };
  } catch (error) {
    console.error('❌ Email sending error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Order Confirmation Email
 */
export const sendOrderConfirmationEmail = async (to, orderDetails) => {
  try {
    const transporter = await configureTransporter();

    const formatAddress = (info) => {
      if (!info) return 'Shipping info missing';
      const { fullName, phone, email, address, city, state, zipCode } = info;

      if (!fullName || !phone || !email || !address || !city || !state || !zipCode) {
        return 'Incomplete shipping details';
      }

      return `
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Address:</strong> ${address}, ${city}, ${state} - ${zipCode}</p>
      `;
    };

    const mailOptions = {
      from: '"Quick Cart" <noreply@quickcart.com>',
      to,
      subject: `Order Confirmed - Order #${orderDetails.orderId}`,
      html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb; color: #111827;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 28px; margin: 0;">Order Confirmed</h1>
          <p style="font-size: 16px; margin-top: 10px;">Thank you for shopping with Quick Cart</p>
        </div>
    
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h2 style="font-size: 20px; margin: 0 0 15px 0;">Order #${orderDetails.orderId}</h2>
    
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #d1d5db;">
                <th style="text-align: left; padding: 10px;">Item</th>
                <th style="text-align: center; padding: 10px;">Qty</th>
                <th style="text-align: right; padding: 10px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${orderDetails.items.map(item => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px;">${item.name}</td>
                  <td style="text-align: center; padding: 10px;">${item.quantity}</td>
                  <td style="text-align: right; padding: 10px;">${formatIndianRupee(item.price)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="text-align: right; padding: 15px; font-weight: 600;">Total:</td>
                <td style="text-align: right; padding: 15px; font-weight: 600;">${formatIndianRupee(orderDetails.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
    
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 10px; margin-top: 20px;">
          <h2 style="font-size: 20px; margin: 0 0 15px 0;">Shipping Details</h2>
          ${formatAddress(orderDetails.shippingInfo)}
        </div>
    
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="margin-bottom: 10px;">We’ll let you know once your order is on its way.</p>
          <p style="font-weight: 600;">Visit Quick Cart for more great deals!</p>
        </div>
      </div>
    `
    
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📦 Order confirmation email sent to: ${to}`);
    return {
      success: true,
      messageId: info.messageId,
      ...(info.envelope.from.includes('ethereal.email') ? { previewUrl: nodemailer.getTestMessageUrl(info) } : {}),
    };
  } catch (error) {
    console.error('❌ Order confirmation email error:', error);
    return { success: false, error: error.message };
  }
};
