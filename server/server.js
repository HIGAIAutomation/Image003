require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const XLSX = require('xlsx');
const path = require('path');

const { saveToExcel, getMembersByDesignation } = require('./utils/excel');
const { processCircularImage, generateFooterSVG, createFinalPoster } = require('./utils/image');

const app = express();
const upload = multer({ dest: 'uploads/' });

const OUTPUT_DIR = path.join(__dirname, 'output');
const EXCEL_PATH = path.join(OUTPUT_DIR, 'members.xlsx');
const LOGO_PATH = path.join(__dirname, 'assets/logo.png');

app.use(cors());
app.use(express.static('uploads'));

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

app.post('/register', upload.single('photo'), async (req, res) => {
  const { name, phone, email, designation } = req.body;
  if (!name || !phone || !email || !designation || !req.file)
    return res.status(400).send('All fields are required');

  const filenameSafe = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const finalPhotoPath = `uploads/${filenameSafe}_${Date.now()}.jpeg`;

  try {
    await processCircularImage(req.file.path, finalPhotoPath, 200);
    fs.unlinkSync(req.file.path);
  } catch (err) {
    console.error('🛑 Sharp processing failed:', err);
    fs.renameSync(req.file.path, finalPhotoPath);
  }

  saveToExcel({ name, phone, email, designation, photo: finalPhotoPath });
  res.send('✅ Member registered successfully');
});

app.post('/send-posters', upload.single('template'), async (req, res) => {
  const { designation } = req.body;
  if (!req.file || !designation) return res.status(400).send('Missing template or designation');

  const templatePath = req.file.path;
  const recipients = getMembersByDesignation(designation, EXCEL_PATH);
  if (!recipients.length) return res.send('No recipients with that designation');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  for (const person of recipients) {
    const finalImagePath = `uploads/final_${Date.now()}.jpeg`;

    await createFinalPoster({
      templatePath,
      person,
      logoPath: LOGO_PATH,
      outputPath: finalImagePath,
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: person.email,
      subject: 'Your Personalized Poster',
      html: `<p>Dear ${person.name},<br/>Here is your customized poster.</p>`,
      attachments: [{ filename: 'poster.jpeg', path: finalImagePath }],
    });

    try { fs.unlinkSync(finalImagePath); } catch (e) {}
  }

  try { fs.unlinkSync(templatePath); } catch (e) {}
  res.send('✅ Posters sent successfully');
});

app.listen(3000, () => {
  console.log('✅ Server running on http://localhost:3000');
});
