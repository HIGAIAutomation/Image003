import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EmailData {
  name: string;
  phone: string;
  email: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('excel') as File
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse Excel file
    const arrayBuffer = await file.arrayBuffer()
    const data = await parseExcelFile(arrayBuffer)
    
    if (data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid data found in Excel file. Please ensure columns A, B, C contain Name, Phone, Email.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Process each record
    const results = {
      total: data.length,
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    console.log(`🚀 Starting to process ${data.length} email records...`)

    for (const record of data) {
      try {
        // Generate personalized HTML card
        const htmlCard = generatePersonalizedHtmlCard(record)
        
        // Send email with HTML content using Resend
        await sendEmailWithResend(record, htmlCard)
        
        results.success++
        console.log(`✅ Successfully processed ${record.name} (${results.success}/${data.length})`)
      } catch (error) {
        results.failed++
        results.errors.push(`${record.name}: ${error.message}`)
        console.error(`❌ Error processing ${record.name}:`, error)
      }
    }

    console.log(`🎉 Processing complete! Success: ${results.success}, Failed: ${results.failed}`)

    return new Response(
      JSON.stringify(results),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Processing error:', error)
    return new Response(
      JSON.stringify({ error: `Processing failed: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function parseExcelFile(arrayBuffer: ArrayBuffer): Promise<EmailData[]> {
  try {
    // For demo purposes, using sample data
    // In production, you would parse the actual Excel file
    const sampleData = [
      { name: 'John Doe', phone: '9876543210', email: 'john@example.com' },
      { name: 'Jane Smith', phone: '9876543211', email: 'jane@example.com' },
      { name: 'Bob Johnson', phone: '9876543212', email: 'bob@example.com' },
      { name: 'Alice Brown', phone: '9876543213', email: 'alice@example.com' },
      { name: 'Charlie Davis', phone: '9876543214', email: 'charlie@example.com' }
    ]
    
    return sampleData
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error.message}`)
  }
}

function generatePersonalizedHtmlCard(data: EmailData): string {
  return `
    <div style="
      width: 600px;
      height: 400px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      padding: 40px;
      color: white;
      font-family: 'Arial', sans-serif;
      position: relative;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      margin: 20px auto;
      border: 4px solid #FFD700;
    ">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="
          font-size: 32px;
          font-weight: bold;
          margin: 0 0 10px 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          letter-spacing: 1px;
        ">SYSTEMATIC INVESTMENT PLAN</h1>
        <div style="
          width: 200px;
          height: 3px;
          background: #FFD700;
          margin: 0 auto;
          border-radius: 2px;
        "></div>
        <p style="
          font-size: 18px;
          margin: 10px 0 0 0;
          color: #E0E7FF;
          font-weight: 500;
        ">POWER OF 5 IN ONE</p>
      </div>

      <!-- Personalized Info -->
      <div style="
        background: rgba(255,255,255,0.1);
        border-radius: 15px;
        padding: 25px;
        margin-bottom: 25px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
      ">
        <h2 style="
          font-size: 28px;
          color: #FFD700;
          margin: 0 0 15px 0;
          text-align: center;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        ">${data.name}</h2>
        
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 24px; margin-bottom: 5px;">📞</div>
            <div style="font-size: 16px; font-weight: 500;">${data.phone}</div>
          </div>
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 24px; margin-bottom: 5px;">📧</div>
            <div style="font-size: 16px; font-weight: 500;">${data.email}</div>
          </div>
        </div>
      </div>

      <!-- Benefits -->
      <div style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 20px;
      ">
        <div style="display: flex; align-items: center; font-size: 14px;">
          <span style="color: #FFD700; margin-right: 8px; font-size: 16px;">✓</span>
          <span>Diversified Portfolio</span>
        </div>
        <div style="display: flex; align-items: center; font-size: 14px;">
          <span style="color: #FFD700; margin-right: 8px; font-size: 16px;">✓</span>
          <span>Professional Management</span>
        </div>
        <div style="display: flex; align-items: center; font-size: 14px;">
          <span style="color: #FFD700; margin-right: 8px; font-size: 16px;">✓</span>
          <span>Tax Benefits</span>
        </div>
        <div style="display: flex; align-items: center; font-size: 14px;">
          <span style="color: #FFD700; margin-right: 8px; font-size: 16px;">✓</span>
          <span>Flexible Investment</span>
        </div>
      </div>

      <!-- Call to Action -->
      <div style="
        text-align: center;
        background: rgba(255,68,68,0.9);
        padding: 15px;
        border-radius: 10px;
        margin-top: 20px;
      ">
        <p style="
          margin: 0;
          font-size: 18px;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        ">🚀 START YOUR SIP INVESTMENT TODAY!</p>
      </div>

      <!-- Decorative Elements -->
      <div style="
        position: absolute;
        top: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: rgba(255,215,0,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      ">💰</div>
      
      <div style="
        position: absolute;
        bottom: 20px;
        left: 20px;
        width: 60px;
        height: 60px;
        background: rgba(255,215,0,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      ">📈</div>
    </div>
  `
}

async function sendEmailWithResend(recipient: EmailData, htmlCard: string): Promise<void> {
  try {
    // Get Resend API key from environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set. Please add it in Supabase Edge Functions settings.')
    }

    const emailData = {
      from: 'Investment Team <onboarding@resend.dev>', // Use your verified domain
      to: [recipient.email],
      subject: `${recipient.name}, Your Personalized Investment Card is Ready!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #3B82F6; text-align: center; margin-bottom: 20px; font-size: 28px;">Your Personalized Investment Card</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">Dear <strong>${recipient.name}</strong>,</p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Thank you for your interest in our Systematic Investment Plan. We've created a personalized investment card just for you!
            </p>
            
            <!-- Personalized Card -->
            ${htmlCard}
            
            <div style="background: #dbeafe; padding: 25px; border-radius: 12px; margin: 30px 0;">
              <h3 style="color: #1e40af; margin-top: 0; font-size: 20px;">🎯 Why Choose Our SIP?</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; color: #374151;">
                <div style="display: flex; align-items: center;">
                  <span style="color: #10b981; margin-right: 10px; font-size: 18px;">✓</span>
                  <span><strong>Diversified Portfolio</strong> - Spread risk across multiple assets</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #10b981; margin-right: 10px; font-size: 18px;">✓</span>
                  <span><strong>Professional Management</strong> - Expert fund managers</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #10b981; margin-right: 10px; font-size: 18px;">✓</span>
                  <span><strong>Tax Benefits</strong> - Save on taxes under Section 80C</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #10b981; margin-right: 10px; font-size: 18px;">✓</span>
                  <span><strong>Flexible Investment</strong> - Start with as low as ₹500</span>
                </div>
              </div>
              <div style="margin-top: 15px; display: flex; align-items: center;">
                <span style="color: #10b981; margin-right: 10px; font-size: 18px;">✓</span>
                <span style="color: #374151;"><strong>Long-term Wealth Creation</strong> - Power of compounding</span>
              </div>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Your personalized card above demonstrates how we create customized investment solutions for each of our clients. 
              This visual representation includes your contact details and highlights the key benefits of our investment approach.
            </p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0; color: white;">
              <p style="margin: 0; font-size: 20px; font-weight: bold;">🚀 Ready to start your investment journey?</p>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Contact us at <strong>${recipient.phone}</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">or reply to this email: <strong>${recipient.email}</strong></p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: #10b981; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                📞 SCHEDULE A FREE CONSULTATION
              </div>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Best regards,<br>
              <strong>Investment Advisory Team</strong><br>
              <em>Your Partner in Wealth Creation</em>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 20px;">
            <p style="font-size: 12px; color: #6b7280; margin: 0;">
              This email was sent from your personalized bulk email system.
            </p>
          </div>
        </div>
      `
    }

    console.log(`📧 Sending email to ${recipient.email}...`)

    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Resend API error: ${errorData.message || response.statusText}`)
    }

    const result = await response.json()
    console.log(`✅ Email sent successfully to ${recipient.email}, ID: ${result.id}`)
    
  } catch (error) {
    console.error(`❌ Failed to send email to ${recipient.email}:`, error)
    throw new Error(`Email sending failed: ${error.message}`)
  }
}