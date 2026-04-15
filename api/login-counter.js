const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  // Try to read counter from file (won't work on Vercel, but good for testing)
  let count = 0;
  try {
    const counterFile = path.join(__dirname, '..', 'login_counter.json');
    if (fs.existsSync(counterFile)) {
      const data = JSON.parse(fs.readFileSync(counterFile, 'utf8'));
      count = data.count || 0;
    }
  } catch (e) {
    console.log('Could not read counter file (normal on Vercel)');
  }

  res.status(200).json({ count: count });
};

