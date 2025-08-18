# Bulk Email Server with Gmail SMTP

A complete Node.js + Express server for processing Excel files and sending personalized investment cards via Gmail SMTP.

## Features

- 📊 **Excel File Processing**: Upload and parse .xlsx files with Name, Phone, Email columns
- 🎨 **Personalized HTML Cards**: Generate beautiful investment cards for each recipient
- 📧 **Gmail SMTP Integration**: Send emails using Gmail with App Passwords
- 🛡️ **Full Error Handling**: Comprehensive error handling for all failure scenarios
- 🚀 **Production Ready**: Complete implementation with logging and cleanup

## Quick Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Gmail SMTP

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/security)
   - Select "2-Step Verification" → "App passwords"
   - Generate password for "Mail"
   - Copy the 16-character password

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file:
   ```env
   GMAIL_USER=your-gmail@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-app-password
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   ```

### 3. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### POST `/api/process-bulk-email`

Upload Excel file and send personalized emails.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Excel file with field name `excel`

**Response:**
```json
{
  "total": 5,
  "success": 4,
  "failed": 1,
  "errors": ["John Doe: Email sending failed: Invalid email address"]
}
```

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

## Excel File Format

Your Excel file should have these columns:

| Column A | Column B | Column C |
|----------|----------|----------|
| Name     | Phone    | Email    |
| John Doe | 9876543210 | john@example.com |
| Jane Smith | 9876543211 | jane@example.com |

- **Column A**: Full name of recipient
- **Column B**: Phone number (10+ digits)
- **Column C**: Valid email address

## Error Handling

The server handles these error scenarios:

### File Upload Errors
- No file uploaded
- Invalid file type (only .xlsx allowed)
- File size too large (10MB limit)

### Excel Parsing Errors
- Empty or corrupted Excel file
- Missing required columns
- Invalid data formats

### Gmail SMTP Errors
- Authentication failures
- Connection timeouts
- Invalid email addresses
- Message size limits

### Example Error Response
```json
{
  "error": "Gmail authentication failed. Please check your email and app password."
}
```

## Testing

### Test Gmail Connection
```bash
node -e "
import { testGmailConnection } from './utils/emailSender.js';
testGmailConnection().then(success => {
  console.log('Connection test:', success ? 'PASSED' : 'FAILED');
  process.exit(success ? 0 : 1);
});
"
```

### Send Test Email
```bash
node -e "
import { sendTestEmail } from './utils/emailSender.js';
sendTestEmail('your-test@email.com').then(() => {
  console.log('Test email sent successfully');
}).catch(error => {
  console.error('Test email failed:', error.message);
});
"
```

## Project Structure

```
server/
├── server.js              # Main Express server
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── utils/
│   ├── excelParser.js     # Excel file parsing logic
│   ├── cardGenerator.js   # HTML card generation
│   └── emailSender.js     # Gmail SMTP integration
├── uploads/               # Temporary file storage
├── sample-data/
│   └── sample.xlsx        # Sample Excel file
└── README.md             # This file
```

## Security Notes

- **App Passwords**: Use Gmail App Passwords, never regular passwords
- **Environment Variables**: Keep `.env` file secure and never commit it
- **File Cleanup**: Uploaded files are automatically deleted after processing
- **Input Validation**: All inputs are validated before processing

## Production Deployment

### Environment Variables
Set these in your production environment:
```env
GMAIL_USER=your-production-gmail@gmail.com
GMAIL_APP_PASSWORD=your-production-app-password
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

### Recommended Hosting
- **Railway**: Easy Node.js deployment
- **Heroku**: Classic PaaS platform
- **DigitalOcean App Platform**: Simple and scalable
- **AWS EC2**: Full control and customization

### Performance Considerations
- Add rate limiting for production use
- Implement email queue for large batches
- Add database logging for audit trails
- Monitor Gmail API quotas and limits

## Troubleshooting

### Common Issues

1. **"Gmail authentication failed"**
   - Verify 2FA is enabled on Gmail
   - Use App Password, not regular password
   - Check email address in .env file

2. **"Failed to connect to Gmail SMTP server"**
   - Check internet connection
   - Verify firewall settings
   - Try different network

3. **"No valid data found in Excel file"**
   - Ensure columns A, B, C contain Name, Phone, Email
   - Check for empty rows or invalid formats
   - Verify file is .xlsx format

4. **"File upload error"**
   - Check file size (max 10MB)
   - Ensure file is .xlsx format
   - Verify uploads directory permissions

## License

MIT License - Free to use and modify for your projects.