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

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
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
app.post('/api/invitations/submit', async (req, res) => {
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
app.get('/api/invitations/stats', async (req, res) => {
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
app.get('/api/admin/responses', async (req, res) => {
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
app.delete('/api/admin/responses/:id', async (req, res) => {
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
app.post('/api/invitations/generate-image', async (req, res) => {
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
  const responseText = willAttend ? '🎉 ПРИДУ / I WILL COME' : '😢 НЕ ПРИДУ / I CANNOT COME';
  const responseColor = willAttend ? '#B4E7D1' : '#F4D4C8'; // Pastel green or pastel peach
  const textColor = willAttend ? '#2d5a4e' : '#8B5A45'; // Dark green or brown

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
          border-radius: 20px;
          padding: 50px;
          max-width: 600px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          text-align: center;
          border: 3px solid #D4A5A5;
          position: relative;
          overflow: hidden;
        }
        .invitation::before {
          content: '✨ ✨ ✨ ✨ ✨';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(90deg, transparent, #D4A5A5, transparent);
          padding: 5px;
          font-size: 14px;
          color: #D4A5A5;
        }
        .invitation::after {
          content: '✨ ✨ ✨ ✨ ✨';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(90deg, transparent, #D4A5A5, transparent);
          padding: 5px;
          font-size: 14px;
          color: #D4A5A5;
        }
        .content {
          position: relative;
          z-index: 1;
          padding-top: 30px;
        }
        h1 {
          color: #8B7355;
          font-size: 42px;
          margin: 0 0 10px 0;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.05);
          font-weight: normal;
          letter-spacing: 2px;
        }
        .subtitle {
          color: #B399A3;
          font-size: 16px;
          margin-bottom: 30px;
          font-style: italic;
          font-weight: light;
        }
        .name {
          color: #5a4a4a;
          font-size: 32px;
          font-weight: bold;
          margin: 30px 0;
          padding: 20px;
          background: #F5E6E0;
          border-radius: 10px;
          border-left: 5px solid #D4A5A5;
        }
        .response {
          color: ${textColor};
          background: ${responseColor};
          padding: 15px 30px;
          border-radius: 10px;
          font-size: 20px;
          font-weight: bold;
          margin: 30px 0;
          display: inline-block;
        }
        .details {
          color: #8B7355;
          font-size: 14px;
          margin-top: 30px;
          border-top: 2px dashed #E8D5C4;
          padding-top: 20px;
          line-height: 1.6;
        }
        .decorative {
          font-size: 24px;
          margin: 20px 0;
          letter-spacing: 8px;
          color: #D4A5A5;
        }
      </style>
    </head>
    <body>
      <div class="invitation">
        <div class="content">
          <div class="decorative">🎊 💐 🎊</div>
          <h1>Баян Сулу</h1>
          <p class="subtitle">Bayan Sulu 2026</p>
          
          <div class="name">${name}</div>
          
          <div class="response">${responseText}</div>
          
          <div class="decorative">🎉 🎈 🎉</div>
          
          <div class="details">
            <p>🎊 Праздник красоты и радости</p>
            <p>📅 15 апреля 2026 года</p>
            <p>📍 <a href="https://2gis.kz/astana/geo/70000001068734198" style="color: #8B7355; text-decoration: underline;">Место проведения</a></p>
            <p>✨ Приготовьтесь к незабываемому вечеру!</p>
            <p>Спасибо за ответ! / Thank you for your response!</p>
            <p>Мы ждем вас на нашем празднике!</p>
            <p>We look forward to celebrating with you!</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function to generate invitation SVG for image export
function generateInvitationText(name, willAttend) {
  const attendanceMessage = willAttend
    ? 'Спасибо за ответ! Мы ждем вас на нашем празднике.'
    : 'Ваш ответ принят. Спасибо, что сообщили.';

  return `Приглашаем Вас на Баян Сулу 2026

${name}

${attendanceMessage}

Bayan Sulu 2026
`; 
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
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
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
