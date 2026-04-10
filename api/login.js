const path = require('path');
const encodedData = require(path.join(__dirname, '..', 'encoded_pages.json'));

function decodeBase64(str) {
  try {
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch (e) {
    return str;
  }
}

function decodeMessages(messages) {
  const decoded = {};
  for (const [key, value] of Object.entries(messages)) {
    if (typeof value === 'string' && /^[A-Za-z0-9+/=]+$/.test(value)) {
      try {
        decoded[key] = decodeBase64(value);
      } catch (e) {
        decoded[key] = value;
      }
    } else {
      decoded[key] = value;
    }
  }
  return decoded;
}

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const { password } = req.body || {};
  if (!password) {
    res.status(400).json({ success: false, message: 'Password required' });
    return;
  }

  const encodedPassword = Buffer.from(password.toLowerCase()).toString('base64');
  if (encodedPassword !== encodedData.password) {
    res.status(401).json({ success: false, message: 'Kiii 😐\nTomake ami ai name a daki?' });
    return;
  }

  res.status(200).json({ success: true, messages: decodeMessages(encodedData.messages) });
};
