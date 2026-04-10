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

// Admin: Delete a response
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
    const { name, willAttend } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    const htmlContent = generateInvitationHTML(name, willAttend);

    // Create SVG instead
    const svgContent = generateInvitationSVG(name, willAttend);
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
          <div class="greeting">
            <p>Уважаемый (ая) гость!</p>
            <p>С честью приглашаем Вас принять участие в праздновании торжественного события.</p>
          </div>
          
          <div class="event-details">
            <p>🎊 <strong>Праздник красоты и радости</strong></p>
            <p>📅 <strong>15 апреля 2026 года</strong></p>
            <p>📍 <a href="https://2gis.kz/astana/geo/70000001068734198" class="location-link">Посмотреть место проведения →</a></p>
            <p>⏰ Приготовьтесь к незабываемому вечеру!</p>
          </div>
          
          <div class="footer">
            <p>Спасибо, что приняли наше приглашение!</p>
            <p>Thank you for accepting our invitation!</p>
            <p style="margin-top: 15px;">С нетерпением ждем встречи с вами.</p>
            <p style="margin-top: 5px;">We look forward to celebrating with you! 🎉</p>
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
  const responseText = willAttend ? '🎉 ПРИДУ' : '😢 НЕ ПРИДУ';
  const responseColor = willAttend ? '#B4E7D1' : '#F4D4C8';
  const textColor = willAttend ? '#2d5a4e' : '#8B5A45';

  return `
    <svg width="800" height="1100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#F0E6D2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#E8D5C4;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="800" height="1000" fill="url(#bgGradient)"/>
      
      <!-- Card background -->
      <rect x="50" y="100" width="700" height="800" rx="20" fill="#FFFAF0" stroke="#D4A5A5" stroke-width="3"/>
      
      <!-- Decoration top -->
      <text x="400" y="180" font-size="40" text-anchor="middle" fill="#D4A5A5">🎊  💐  🎊</text>
      
      <!-- Title -->
      <text x="400" y="280" font-size="48" text-anchor="middle" fill="#8B7355" font-family="Georgia, serif" font-weight="bold" letter-spacing="4">Баян Сулу</text>
      <text x="400" y="320" font-size="18" text-anchor="middle" fill="#B399A3" font-family="Georgia, serif" font-style="italic">Bayan Sulu 2026</text>
      
      <!-- Name box -->
      <rect x="100" y="360" width="600" height="80" rx="10" fill="#F5E6E0" stroke="#D4A5A5" stroke-width="2"/>
      <text x="400" y="415" font-size="36" text-anchor="middle" fill="#5a4a4a" font-family="Arial, sans-serif" font-weight="bold">${name}</text>
      
      <!-- Response badge -->
      <rect x="150" y="500" width="500" height="80" rx="10" fill="${responseColor}" stroke="#D4A5A5" stroke-width="2"/>
      <text x="400" y="555" font-size="24" text-anchor="middle" fill="${textColor}" font-family="Arial, sans-serif" font-weight="bold">${responseText}</text>
      
      <!-- Event details -->
      <text x="400" y="620" font-size="16" text-anchor="middle" fill="#8B7355" font-family="Georgia, serif">🎊 Праздник красоты и радости</text>
      <text x="400" y="645" font-size="16" text-anchor="middle" fill="#8B7355" font-family="Georgia, serif">📅 15 апреля 2026 года</text>
      <text x="400" y="670" font-size="16" text-anchor="middle" fill="#8B7355" font-family="Georgia, serif">📍 Место проведения</text>
      <text x="400" y="695" font-size="16" text-anchor="middle" fill="#8B7355" font-family="Georgia, serif">✨ Приготовьтесь к незабываемому вечеру!</text>
      
      <!-- Decoration bottom -->
      <text x="400" y="740" font-size="36" text-anchor="middle" fill="#D4A5A5">🎉  🎈  🎉</text>
      
      <!-- Footer text -->
      <text x="400" y="830" font-size="14" text-anchor="middle" fill="#8B7355" font-family="Georgia, serif">Спасибо за ответ!</text>
      <text x="400" y="855" font-size="14" text-anchor="middle" fill="#8B7355" font-family="Georgia, serif">Thank you for your response!</text>
      <text x="400" y="890" font-size="12" text-anchor="middle" fill="#B399A3" font-family="Georgia, serif">Баян Сулу 2026</text>
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
