<<<<<<< HEAD
require('dotenv').config(); // Ensure this is at the top
const nodemailer = require('nodemailer');
const fs = require('fs');

const createTransporter = () => {
  const email = process.env.GMAIL_USER;
  const appPassword = process.env.GMAIL_PASS;

  if (!email || !appPassword) {
=======
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Create transporter
const createTransporter = () => {
  if (!process.env.EMAIL || !process.env.APP_PASSWORD) {
>>>>>>> 53d274ac712e0de6fbb84405e2bad1fcb664a5e5
    throw new Error('Email credentials not configured. Please set EMAIL and APP_PASSWORD in .env file');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
<<<<<<< HEAD
      user: email,
      pass: appPassword,
    },
  });
};

function generateSubject(designation) {
  const lower = designation.toLowerCase();
  if (lower.includes("health")) {
    return "Reach More Families – Build Trust in Health Planning 💡";
  } else if (lower.includes("wealth")) {
    return "This Simple Step Can Boost Your Wealth Advisory Reach 📈";
  } else {
    return "Your Clients Trust You – Here’s a Way to Grow That Trust 🤝";
  }
}

function generateEmailContent(data) {
  const { Name, Email, Phone, Designation } = data;

  const isHealth = Designation.toLowerCase().includes('health');
  const isWealth = Designation.toLowerCase().includes('wealth');

  const introLine = isHealth
    ? "Your expertise in protecting families is more valuable than ever."
    : isWealth
      ? "Financial confidence begins with trust — and you’re the bridge to that confidence."
      : "You help your clients build both security and prosperity — now it's time to amplify your impact.";

  const benefit = isHealth
    ? "This message reminds families of the power of proactive health planning. When shared consistently, it builds confidence and connections."
    : isWealth
      ? "This message highlights smart monthly income and long-term growth — a perfect conversation starter with new and existing clients."
      : "This message touches both financial growth and health security — a tool that opens doors for deeper client relationships.";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background-color: #ffffff; padding: 24px; border-radius: 10px; border: 1px solid #e0e0e0;">
      <h2 style="color: #2b2b2b; text-align: center;">Hello ${Name},</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #444;">${introLine}</p>
      <p style="font-size: 16px; line-height: 1.6; color: #444;">
        We've created a professional visual tool personalized just for you — not just for display, but to <strong>spark client conversations and drive trust</strong>.
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: #444;">${benefit}</p>
      <p style="font-size: 16px; line-height: 1.6; color: #444;">
        You can forward this to your customers, share it on WhatsApp, or even use it during client meetings — the possibilities are endless when trust is visual.
      </p>
      <div style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 20px;">
        <strong>Your Info:</strong><br/>
        Name: ${Name}<br/>
        Designation: ${Designation}<br/>
        Phone: ${Phone}<br/>
        Email: ${Email}<br/>
        Company: <strong>Wealth Plus</strong>
      </div>
      <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
        Stay consistent. Share with confidence. Build stronger relationships.<br/>
        <strong>Wealth Plus Team</strong>
      </p>
    </div>
  `;
}

async function sendEmail(data, imagePath) {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    const subject = generateSubject(data.Designation);
    const htmlContent = generateEmailContent(data);

    const mailOptions = {
      from: process.env.EMAIL,
      to: data.Email,
      subject,
      html: htmlContent,
      attachments: [
        {
          filename: 'poster.png',
          path: imagePath,
          // Removed 'cid: personalizedCard' so it's not embedded inline
          contentType: 'image/png'
        }
      ],
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${data.Email}`);
    return result;
  } catch (err) {
    console.error(`❌ Failed to send email to ${data.Email}:`, err.message);
    throw new Error(`Email failed: ${err.message}`);
=======
      user: process.env.EMAIL,
      pass: process.env.APP_PASSWORD
    }
  });
};

async function sendEmail(data, imagePath) {
  try {
    const transporter = createTransporter();
    
    // Verify transporter configuration
    await transporter.verify();
    
    const mailOptions = {
      from: process.env.EMAIL,
      to: data.Email,
      subject: `Personalized Card for ${data.Name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Hello ${data.Name}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            We've created a personalized card just for you. Please find it attached to this email.
          </p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Your Details:</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${data.Name}</p>
            ${data.Phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${data.Phone}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Email:</strong> ${data.Email}</p>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
            Thank you for being part of our community!
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `personalized-card-${data.Name.replace(/\s+/g, '-').toLowerCase()}.png`,
          path: imagePath,
          cid: 'personalizedCard'
        }
      ]
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${data.Email}`);
    return result;
    
  } catch (error) {
    console.error(`Error sending email to ${data.Email}:`, error);
    throw new Error(`Failed to send email: ${error.message}`);
>>>>>>> 53d274ac712e0de6fbb84405e2bad1fcb664a5e5
  }
}

async function testEmailConfiguration() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
<<<<<<< HEAD
    console.log('✅ Email configuration is valid');
    return true;
  } catch (err) {
    console.error('❌ Email config error:', err.message);
=======
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
>>>>>>> 53d274ac712e0de6fbb84405e2bad1fcb664a5e5
    return false;
  }
}

module.exports = {
  sendEmail,
<<<<<<< HEAD
  testEmailConfiguration,
=======
  testEmailConfiguration
>>>>>>> 53d274ac712e0de6fbb84405e2bad1fcb664a5e5
};