const fs = require('fs');
const path = require('path');

// Try to read from file if it exists
function getCounterFromFile() {
  try {
    const counterFile = path.join(__dirname, '..', 'login_counter.json');
    if (fs.existsSync(counterFile)) {
      const data = fs.readFileSync(counterFile, 'utf8');
      return JSON.parse(data).count || 0;
    }
  } catch (e) {
    console.error('Error reading counter file:', e);
  }
  return 0;
}

// Store counter in memory for this deployment
let currentCount = getCounterFromFile();

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

  res.status(200).json({ count: currentCount });
};

// Export for direct function calls
module.exports.getCurrentCount = () => currentCount;
module.exports.incrementCount = () => {
  currentCount += 1;
  return currentCount;
};
