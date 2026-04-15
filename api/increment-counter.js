const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  let count = 0;
  const counterFile = path.join(__dirname, '..', 'login_counter.json');

  // Read current count
  try {
    if (fs.existsSync(counterFile)) {
      const data = JSON.parse(fs.readFileSync(counterFile, 'utf8'));
      count = data.count || 0;
    }
  } catch (e) {
    console.log('Could not read counter file, starting from 0');
  }

  // Increment
  count += 1;

  // Try to save (will fail silently on Vercel read-only filesystem)
  try {
    fs.writeFileSync(counterFile, JSON.stringify({ count: count }, null, 2), 'utf8');
  } catch (e) {
    console.log('Could not write to counter file (normal on Vercel read-only filesystem)');
  }

  res.status(200).json({ success: true, count: count });
};

