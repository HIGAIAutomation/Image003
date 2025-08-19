require('dotenv').config(); // Ensure this is at the top
const nodemailer = require('nodemailer');
const fs = require('fs');

const createTransporter = () => {
  const email = process.env.GMAIL_USER;
  const appPassword = process.env.GMAIL_PASS;

  if (!email || !appPassword) {
    throw new Error('Email credentials not configured. Please set EMAIL and APP_PASSWORD in .env file');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
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
  }
}

async function testEmailConfiguration() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (err) {
    console.error('❌ Email config error:', err.message);
    return false;
  }
}

module.exports = {
  sendEmail,
  testEmailConfiguration,
};