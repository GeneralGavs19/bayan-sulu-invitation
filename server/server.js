import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Serve static files from client/dist
app.use(express.static(path.join(__dirname, '../client/dist')));

// Admin credentials (hardcoded for now)
const ADMIN_EMAIL = 'kaz070318@gmail.com';
const ADMIN_PASSWORD = 'ALISHER';

// MongoDB setup
const MONGODB_URI = process.env.MONGODB_URI;
const client = new MongoClient(MONGODB_URI);
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('invitation_db');
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Helper function to send email via Resend
async function sendEmailViaResend(to, subject, html, text) {
  try {
    console.log('📧 Attempting to send email...');
    console.log('   To:', to);
    console.log('   Subject:', subject);
    console.log('   API Key:', process.env.RESEND_API_KEY ? '✓ Present' : '✗ Missing');
    console.log('   From:', process.env.EMAIL_FROM || 'noreply@resend.dev');

    const payload = {
      from: process.env.EMAIL_FROM || 'noreply@resend.dev',
      to: to,
      subject: subject,
      text: text,
      html: html,
      reply_to: process.env.EMAIL_FROM || 'noreply@resend.dev'
    };

    console.log('📤 Sending POST to Resend API...');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('   Response Status:', response.status);
    console.log('   Response Data:', JSON.stringify(data));

    if (!response.ok) {
      console.error('❌ Email send failed with status', response.status);
      console.error('   Error details:', data);
      throw new Error(`Email failed: ${data.message || response.statusText}`);
    }

    console.log('✅ Email sent successfully. ID:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    throw error;
  }
}

// Routes

app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Admin login
app.post('/admin/login', (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    console.log('✓ Admin login successful');
    res.json({
      success: true,
      token: 'admin-token-' + Date.now(),
      message: 'Login successful'
    });
  } else {
    console.log('✗ Admin login failed - wrong credentials');
    res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }
});

// Submit invitation response
app.post('/invitations/submit', async (req, res) => {
  try {
    const { name, willAttend, email, eventKey } = req.body;

    if (!name || !email || willAttend === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const collection = db.collection('responses');
    
    const response = {
      name,
      email,
      willAttend,
      eventKey: eventKey || 'bayanSulu2026',
      createdAt: new Date(),
      invitationSent: false
    };

    const result = await collection.insertOne(response);
    console.log('✓ Response saved to DB:', result.insertedId);

    // Send invitation email ONLY if attending
    if (willAttend === true) {
      try {
        const htmlContent = generateInvitationHTML(name, willAttend);
        const textContent = generateInvitationText(name, willAttend);
        await sendEmailViaResend(
          email,
          'Приглашение на Баян Сулу 2026 | Bayan Sulu Invitation',
          htmlContent,
          textContent
        );

        // Update with sent status
        await collection.updateOne(
          { _id: result.insertedId },
          { $set: { invitationSent: true } }
        );
        console.log('✓ Email sent to:', email);
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Continue even if email fails
      }
    } else {
      console.log('✓ Response from', name, '(Not attending) - Email NOT sent, but recorded');
    }

    res.json({
      success: true,
      message: 'Invitation submitted successfully',
      id: result.insertedId,
      invitationHTML: generateInvitationHTML(name, willAttend)
    });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: 'Failed to submit invitation' });
  }
});

// Get responses count
app.get('/invitations/stats', async (req, res) => {
  try {
    const collection = db.collection('responses');
    const total = await collection.countDocuments();
    const attending = await collection.countDocuments({ willAttend: true });
    const notAttending = await collection.countDocuments({ willAttend: false });

    res.json({
      total,
      attending,
      notAttending,
      percentAttending: total > 0 ? Math.round((attending / total) * 100) : 0
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Admin: Get all responses
app.get('/admin/responses', async (req, res) => {
  try {
    const collection = db.collection('responses');
    const responses = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      total: responses.length,
      responses: responses
    });
  } catch (error) {
    console.error('Admin responses error:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// Admin: Delete ALL responses (must be BEFORE /:id route)
app.delete('/admin/responses/all', async (req, res) => {
  try {
    console.log('🗑️ Delete all requested');
    
    if (!db) {
      console.error('❌ DB not connected');
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const collection = db.collection('responses');
    console.log('📊 Collection accessed');
    
    const countBefore = await collection.countDocuments();
    console.log(`📋 Documents before: ${countBefore}`);
    
    const result = await collection.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} documents`);
    
    res.json({ 
      success: true, 
      message: `All responses deleted`,
      deletedCount: result.deletedCount,
      totalBefore: countBefore
    });
  } catch (error) {
    console.error('❌ Delete all error:', error);
    res.status(500).json({ error: 'Failed to delete all responses', details: error.message });
  }
});

// Admin: Delete a single response (must be AFTER /all route)
app.delete('/admin/responses/:id', async (req, res) => {
  try {
    const collection = db.collection('responses');
    const result = await collection.deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Response not found' });
    }

    res.json({ success: true, message: 'Response deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete response' });
  }
});

// Generate invitation image (PNG)
app.post('/invitations/generate-image', async (req, res) => {
  try {
    console.log('🎨 Generate image requested');
    const { name, willAttend } = req.body;
    console.log(`   Name: ${name}, willAttend: ${willAttend}`);

    if (!name) {
      console.log('❌ Missing name');
      return res.status(400).json({ error: 'Missing name' });
    }

    // Create SVG
    console.log('📝 Generating SVG...');
    const svgContent = generateInvitationSVG(name, willAttend);
    console.log(`✅ SVG generated, length: ${svgContent.length}`);
    
    const buffer = Buffer.from(svgContent);

    // Try to convert to PNG using sharp, fallback to SVG
    let sharp;
    try {
      const sharpModule = await import('sharp');
      sharp = sharpModule.default;
    } catch (e) {
      // Sharp not available, will fallback to SVG
    }
    
    if (sharp) {
      try {
        const pngBuffer = await sharp(buffer).png().toBuffer();
        res.type('image/png');
        res.send(pngBuffer);
        return;
      } catch (err) {
        console.log('⚠️ PNG conversion failed, returning SVG:', err.message);
      }
    }
    
    // Fallback: return SVG
    res.type('image/svg+xml');
    res.send(svgContent);
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// Helper function to generate invitation HTML with pastel colors
function generateInvitationHTML(name, willAttend) {
  const attendingContent = `
          <div style="background: linear-gradient(135deg, #FFF5F0 0%, #F5E6E0 100%); border: 2px dashed #D4A5A5; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="color: #8B7355; font-size: 16px; margin: 0 0 15px 0; font-weight: bold;">✨ ОФИЦИАЛЬНОЕ ПРИГЛАШЕНИЕ ✨</p>
            <p style="color: #8B7355; font-size: 14px; margin: 0;">Уважаемый (ая) гость!</p>
            <p style="color: #8B7355; font-size: 14px; margin: 10px 0 0 0;">С честью приглашаем Вас на торжественное событие.</p>
          </div>
          
          <div class="event-details" style="background: #FFFAF0; border: 2px solid #D4A5A5; position: relative;">
            <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #FFFAF0; padding: 0 15px; color: #D4A5A5; font-size: 12px;">❦ ДЕТАЛИ МЕРОПРИЯТИЯ ❦</div>
            <p style="margin-top: 15px;">🎊 <strong style="color: #D4A5A5;">Праздник красоты и радости</strong></p>
            <p>📅 <strong style="color: #8B5A45;">15 апреля 2026 года</strong></p>
            <p>📍 <a href="https://2gis.kz/astana/geo/70000001068734198" class="location-link">Место проведения на 2GIS →</a></p>
            <p style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #E8D5C4;">⏰ <em>Приготовьтесь к незабываемому вечеру!</em></p>
          </div>
          
          <div style="background: #B4E7D1; border-radius: 25px; padding: 15px 30px; margin: 25px auto; display: inline-block; border: 2px solid #8B7355;">
            <p style="color: #2d5a4e; font-weight: bold; margin: 0; font-size: 16px;">✓ ВЫ ПОДТВЕРДИЛИ УЧАСТИЕ</p>
          </div>
          
          <div class="footer">
            <p style="color: #D4A5A5; font-size: 14px; margin-bottom: 10px;">🎉 Спасибо, что приняли приглашение! 🎉</p>
            <p>Thank you for accepting our invitation!</p>
            <p style="margin-top: 15px; color: #8B7355;">С нетерпением ждем встречи с вами!</p>
            <p style="margin-top: 5px;">We look forward to celebrating with you! 💐</p>
          </div>`;

  const notAttendingContent = `
          <div class="greeting" style="background: #F4D4C8; padding: 20px; border-radius: 10px; margin: 25px 0;">
            <p style="color: #8B5A45; font-weight: bold; font-size: 16px;">😔 К сожалению, Вы не сможете присутствовать</p>
            <p style="color: #8B7355; margin-top: 15px;">Мы будем скучать по Вам!</p>
          </div>
          
          <div class="event-details" style="background: #FFF5F0; border: 2px dashed #D4A5A5;">
            <p style="color: #8B5A45; font-weight: bold; margin-bottom: 15px;">Пожалуйста, сообщите нам:</p>
            <p>📝 Причину, по которой не сможете приехать</p>
            <p>📅 Предложите удобную для Вас альтернативную дату</p>
            <p>💌 Мы будем рады встретиться с Вами в другое время!</p>
            <p style="margin-top: 15px; font-size: 13px; color: #B399A3;">
              Свяжитесь с нами: <a href="mailto:kaz070318@gmail.com" style="color: #8B7355;">kaz070318@gmail.com</a>
            </p>
          </div>
          
          <div class="footer">
            <p>Спасибо за ответ!</p>
            <p>Thank you for your response!</p>
            <p style="margin-top: 15px;">Надеемся на встречу в другой раз.</p>
            <p style="margin-top: 5px;">Hope to see you another time. 🌸</p>
          </div>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: 'Georgia', serif;
          background: linear-gradient(135deg, #F0E6D2 0%, #E8D5C4 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .invitation {
          background: #FFFAF0;
          border-radius: 15px;
          padding: 40px;
          max-width: 600px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          text-align: center;
          border: 2px solid #D4A5A5;
        }
        .content {
          padding: 20px 0;
        }
        h1 {
          color: #8B7355;
          font-size: 36px;
          margin: 0 0 10px 0;
          font-weight: normal;
          letter-spacing: 2px;
        }
        .subtitle {
          color: #B399A3;
          font-size: 14px;
          margin-bottom: 30px;
          font-style: italic;
        }
        .guest-name {
          color: #5a4a4a;
          font-size: 28px;
          font-weight: bold;
          margin: 30px 0;
          padding: 20px;
          background: #F5E6E0;
          border-radius: 10px;
          border-left: 4px solid #D4A5A5;
        }
        .greeting {
          color: #8B7355;
          font-size: 15px;
          line-height: 1.8;
          margin: 25px 0;
          padding: 0 20px;
        }
        .event-details {
          background: #F5E6E0;
          padding: 20px;
          border-radius: 10px;
          margin: 25px 0;
          color: #8B7355;
          font-size: 14px;
          line-height: 1.8;
        }
        .event-details p {
          margin: 8px 0;
        }
        .location-link {
          color: #8B7355;
          text-decoration: none;
          font-weight: bold;
          border-bottom: 2px solid #D4A5A5;
        }
        .location-link:hover {
          color: #B399A3;
        }
        .footer {
          color: #B399A3;
          font-size: 13px;
          margin-top: 25px;
          padding-top: 20px;
          border-top: 2px dashed #E8D5C4;
          line-height: 1.6;
        }
        .decorative {
          font-size: 20px;
          margin: 15px 0;
          letter-spacing: 8px;
          color: #D4A5A5;
        }
      </style>
    </head>
    <body>
      <div class="invitation">
        <div class="content">
          <div class="decorative">✨ 🎊 ✨</div>
          <h1>Баян Сулу</h1>
          <p class="subtitle">Bayan Sulu 2026</p>
          
          <div class="guest-name">${name}</div>
          
          ${willAttend ? attendingContent : notAttendingContent}
          
          <div class="decorative">🎊 💐 🎊</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function to generate invitation text for email (avoid spam filters)
function generateInvitationText(name, willAttend) {
  if (willAttend) {
    return `Баян Сулу 2026
Приглашение / Invitation

Уважаемый (ая) ${name}!

С честью приглашаем Вас принять участие в праздновании торжественного события.

ДЕТАЛИ МЕРОПРИЯТИЯ / EVENT DETAILS:
- Название / Event: Баян Сулу 2026 - Праздник красоты и радости
- Дата / Date: 15 апреля 2026 года (April 15, 2026)
- Место / Location: https://2gis.kz/astana/geo/70000001068734198

Спасибо за то, что приняли наше приглашение!
Thank you for accepting our invitation!

С нетерпением ждем встречи с вами.
We look forward to celebrating with you!

---
Баян Сулу 2026
Bayan Sulu 2026`;
  } else {
    return `Баян Сулу 2026
Ответ на приглашение / Response

Уважаемый (ая) ${name}!

К сожалению, Вы сообщили, что не сможете присутствовать на нашем мероприятии.
Мы будем скучать по Вам!

ПОЖАЛУЙСТА, СВЯЖИТЕСЬ С НАМИ / PLEASE CONTACT US:
- Сообщите причину, по которой не сможете приехать
- Предложите удобную для Вас альтернативную дату встречи

Email: kaz070318@gmail.com

Мы будем рады встретиться с Вами в другое время!
We would love to meet you another time!

Спасибо за ответ!
Thank you for your response!

---
Баян Сулу 2026
Bayan Sulu 2026`;
  }
}

function generateInvitationSVG(name, willAttend) {
  const responseText = willAttend ? '[+] ATTENDING' : '[-] NOT ATTENDING';
  const responseColor = willAttend ? '#B4E7D1' : '#F4D4C8';
  const textColor = willAttend ? '#2d5a4e' : '#8B5A45';
  
  // Ticket dimensions - portrait for phone
  const width = 500;
  const height = 850;
  const centerX = width / 2;
  
  // Event details based on attendance
  const attendingDetails = `
      <text x="${centerX}" y="425" font-size="16" text-anchor="middle" fill="#8B7355">Celebration of Beauty and Joy</text>
      <text x="${centerX}" y="455" font-size="15" text-anchor="middle" fill="#D4A5A5">April 15, 2026</text>
      <text x="${centerX}" y="485" font-size="12" text-anchor="middle" fill="#8B7355">2GIS: astana/geo/70000001068734198</text>
      <text x="${centerX}" y="515" font-size="13" text-anchor="middle" fill="#8B7355">Get ready for an unforgettable evening!</text>`;
  
  const notAttendingDetails = `
      <text x="${centerX}" y="425" font-size="14" text-anchor="middle" fill="#8B5A45">Unfortunately, you cannot attend</text>
      <text x="${centerX}" y="455" font-size="12" text-anchor="middle" fill="#8B7355">Please share the reason and suggest a date</text>
      <text x="${centerX}" y="485" font-size="12" text-anchor="middle" fill="#B399A3">kaz070318@gmail.com</text>`;
  
  const detailsContent = willAttend ? attendingDetails : notAttendingDetails;
  
  // Generate barcode-like pattern for ticket authenticity (centered, smaller)
  const barcodeStartX = 100;
  const barcodePattern = Array.from({length: 25}, (_, i) => 
    `<rect x="${barcodeStartX + i * 12}" y="720" width="${Math.random() > 0.5 ? 5 : 3}" height="35" fill="#8B7355"/>`
  ).join('');

  return `
    <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#F0E6D2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#E8D5C4;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="ticketGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#FFFAF0;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FFF5F0;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#D4A5A5" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
      
      <!-- Ticket Card with notches -->
      <g filter="url(#shadow)">
        <!-- Main ticket body -->
        <path d="M 40 30 L ${width-40} 30 L ${width-40} ${height-70} Q ${width-40} ${height-50} ${width-60} ${height-50} L 60 ${height-50} Q 40 ${height-50} 40 ${height-70} Z" 
              fill="url(#ticketGradient)" stroke="#D4A5A5" stroke-width="2"/>
        
        <!-- Top decorative line -->
        <line x1="60" y1="70" x2="${width-60}" y2="70" stroke="#D4A5A5" stroke-width="2" stroke-dasharray="8,4"/>
        
        <!-- Side decorative borders -->
        <rect x="50" y="80" width="8" height="${height-160}" rx="2" fill="#F5E6E0"/>
        <rect x="${width-58}" y="80" width="8" height="${height-160}" rx="2" fill="#F5E6E0"/>
      </g>
      
      <!-- Corner decorations -->
      <text x="70" y="60" font-size="20" fill="#D4A5A5">*</text>
      <text x="${width-85}" y="60" font-size="20" fill="#D4A5A5">*</text>
      <text x="70" y="${height-80}" font-size="20" fill="#D4A5A5">*</text>
      <text x="${width-85}" y="${height-80}" font-size="20" fill="#D4A5A5">*</text>
      
      <!-- Official Ticket Header -->
      <text x="${centerX}" y="100" font-size="14" text-anchor="middle" fill="#8B7355">OFFICIAL INVITATION</text>
      <text x="${centerX}" y="120" font-size="11" text-anchor="middle" fill="#B399A3">Bayan Sulu 2026</text>
      
      <!-- Event Title Box -->
      <rect x="70" y="140" width="${width-140}" height="85" rx="8" fill="#F5E6E0" stroke="#D4A5A5" stroke-width="1"/>
      <text x="${centerX}" y="170" font-size="16" text-anchor="middle" fill="#8B7355">We invite you to</text>
      <text x="${centerX}" y="200" font-size="32" text-anchor="middle" fill="#D4A5A5">Bayan Sulu</text>
      <text x="${centerX}" y="220" font-size="12" text-anchor="middle" fill="#B399A3">April 15, 2026</text>
      
      <!-- Guest Name Section -->
      <rect x="70" y="245" width="${width-140}" height="70" rx="6" fill="#FFFAF0" stroke="#D4A5A5" stroke-width="2"/>
      <text x="${centerX}" y="265" font-size="11" text-anchor="middle" fill="#8B7355">GUEST</text>
      <text x="${centerX}" y="295" font-size="26" text-anchor="middle" fill="#5a4a4a">${name}</text>
      
      <!-- Status Badge -->
      <rect x="100" y="330" width="${width-200}" height="45" rx="20" fill="${responseColor}" stroke="#D4A5A5" stroke-width="2"/>
      <text x="${centerX}" y="360" font-size="18" text-anchor="middle" fill="${textColor}">${responseText}</text>
      
      ${detailsContent}
      
      <!-- Decorative divider -->
      <line x1="100" y1="545" x2="${width-100}" y2="545" stroke="#D4A5A5" stroke-width="1" stroke-dasharray="6,3"/>
      <text x="${centerX}" y="565" font-size="20" text-anchor="middle" fill="#D4A5A5">~ ~ ~</text>
      
      <text x="${centerX}" y="595" font-size="12" text-anchor="middle" fill="#8B7355">Please present this at the entrance</text>
      <text x="${centerX}" y="615" font-size="11" text-anchor="middle" fill="#B399A3">Thank you for your response!</text>
      
      <!-- Barcode Section -->
      <text x="${centerX}" y="670" font-size="10" text-anchor="middle" fill="#8B7355">NO. ${Math.random().toString(36).substr(2, 9).toUpperCase()}</text>
      ${barcodePattern}
      
      <!-- Bottom text -->
      <text x="${centerX}" y="${height-65}" font-size="10" text-anchor="middle" fill="#B399A3">Bayan Sulu 2026</text>
    </svg>
  `;
}

// SPA Fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/health') && !req.path.startsWith('/admin') && !req.path.startsWith('/invitations')) {
    return res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  }
  res.status(404).json({ error: 'Not found' });
});

// Start server
async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await client.close();
  process.exit(0);
});

start();
