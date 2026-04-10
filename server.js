const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.static(path.join(__dirname)));

// Load encoded data
const encodedData = require('./encoded_pages.json');

// Helper function to decode Base64
function decodeBase64(str) {
  try {
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch (e) {
    return str;
  }
}

console.log('Server __dirname:', __dirname);
console.log('Loaded page6 length:', encodedData.messages.page6.length);

// Login endpoint
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password required' });
  }

  // Encode the provided password with Base64
  const encodedPassword = Buffer.from(password.toLowerCase()).toString('base64');
  const correctPassword = encodedData.password;

  if (encodedPassword === correctPassword) {
    // Password correct - return decoded messages
    const decodedMessages = {};
    
    for (const [key, value] of Object.entries(encodedData.messages)) {
      if (typeof value === 'string' && value.match(/^[A-Za-z0-9+/=]+$/)) {
        // Looks like Base64, try to decode
        try {
          decodedMessages[key] = decodeBase64(value);
        } catch (e) {
          decodedMessages[key] = value;
        }
      } else {
        decodedMessages[key] = value;
      }
    }

    return res.json({ success: true, messages: decodedMessages });
  } else {
    return res.status(401).json({ success: false, message: 'Kiii 😐\nTomake ami ai name a daki?' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
