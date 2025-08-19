const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Create transporter
const createTransporter = () => {
  if (!process.env.EMAIL || !process.env.APP_PASSWORD) {
    throw new Error('Email credentials not configured. Please set EMAIL and APP_PASSWORD in .env file');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
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
  }
}

async function testEmailConfiguration() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}

module.exports = {
  sendEmail,
  testEmailConfiguration
};