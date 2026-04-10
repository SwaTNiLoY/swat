// Frontend script - all data fetched from server, never embedded in page source
let currentPage = 0;
const totalPages = 6;
let messageData = {};
let isLoggedIn = false;

const book = document.getElementById('book');
const nextButtons = document.querySelectorAll('.page-next');
const prevButtons = document.querySelectorAll('.page-prev');
const loginOverlay = document.getElementById('loginOverlay');
const passwordInput = document.getElementById('passwordInput');
const loginButton = document.getElementById('loginButton');
const pageNoButton = document.getElementById('pageNoButton');
const loginToast = document.getElementById('loginToast');

// Update book view
function updateBook() {
  book.className = `book page-${currentPage}`;
}

// Inject fetched messages into the page
function injectMessages(messages) {
  const msgWelcome = document.getElementById('msg-welcome');
  const msgPage3 = document.getElementById('msg-page3');
  const msgPage4 = document.getElementById('msg-page4');
  const msgPage6 = document.getElementById('msg-page6');
  const loginTitle = document.getElementById('loginTitle');

  if (msgWelcome && messages.welcome) msgWelcome.textContent = messages.welcome;
  if (msgPage3 && messages.page3) msgPage3.innerHTML = messages.page3;
  if (msgPage4 && messages.page4) msgPage4.innerHTML = messages.page4;
  if (msgPage6 && messages.page6) msgPage6.innerHTML = messages.page6;
  if (loginTitle && messages.title) loginTitle.textContent = messages.title;
}

function decodeBase64(str) {
  try {
    return atob(str);
  } catch (e) {
    return str;
  }
}

function decodeMessages(messages) {
  const decoded = {};
  for (const [key, value] of Object.entries(messages)) {
    if (typeof value === 'string' && /^[A-Za-z0-9+/=]+$/.test(value)) {
      decoded[key] = decodeBase64(value);
    } else {
      decoded[key] = value;
    }
  }
  return decoded;
}

async function tryLocalLogin(password) {
  try {
    const response = await fetch('encoded_pages.json');
    if (!response.ok) return null;
    const localData = await response.json();
    const encodedPassword = btoa(password.toLowerCase());
    if (encodedPassword !== localData.password) {
      return { success: false, message: 'Kiii 😐\nTomake ami ai name a daki?' };
    }
    return { success: true, messages: decodeMessages(localData.messages) };
  } catch (err) {
    return null;
  }
}

// Show toast message
let toastTimeout;

function showToast(message = '') {
  if (!loginToast) return;
  if (message) {
    loginToast.innerHTML = message;
  }
  loginToast.style.visibility = 'visible';
  loginToast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    loginToast.classList.remove('show');
    loginToast.style.visibility = 'hidden';
  }, 2200);
}

// Show login overlay
function showLoginOverlay() {
  loginOverlay.style.display = 'grid';
  loginOverlay.classList.remove('fade-out');
  loginOverlay.classList.add('active');
  passwordInput.value = '';
  loginToast.classList.remove('show');
  currentPage = 0;
  updateBook();
}

// Hide login overlay
function completeLogin() {
  isLoggedIn = true;
  loginOverlay.classList.add('fade-out');
  setTimeout(() => {
    loginOverlay.classList.remove('active');
    loginOverlay.style.display = 'none';
  }, 500);
}

const BACKEND_ORIGIN = 'http://localhost:3000';
const API_BASE_URL = (() => {
  const isLocalFile = window.location.protocol === 'file:';
  const isGitHubPages = window.location.hostname.endsWith('github.io');
  const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const isLocalPort3000 = isLocalHost && window.location.port === '3000';
  const isNonBackendLocalPort = isLocalHost && window.location.port && window.location.port !== '3000';

  if (isGitHubPages || (!isLocalFile && !isLocalPort3000 && !isNonBackendLocalPort && !isLocalHost)) {
    return null;
  }

  if (isLocalFile || isNonBackendLocalPort || isLocalPort3000) {
    return BACKEND_ORIGIN;
  }

  return window.location.origin;
})();

// Handle login
async function handleLogin() {
  const password = passwordInput.value.trim();
  
  if (!password) {
    showToast('Kiii 😐<br>Tomake ami ai name a daki?');
    return;
  }

  const useBackend = Boolean(API_BASE_URL);
  console.log('API_BASE_URL:', API_BASE_URL);
  if (useBackend) {
    console.log('Making request to:', `${API_BASE_URL}/api/login`);
  } else {
    console.log('Skipping backend login; using local fallback on static host');
  }

  let response;
  let data = null;

  if (useBackend) {
    try {
      response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (err) {
        console.error('Failed to parse JSON:', err);
        data = null;
      }

      if (response.ok && data && data.success) {
        messageData = data.messages;
        injectMessages(messageData);
        completeLogin();
        return;
      }

      if (response.ok) {
        showToast((data && data.message) ? data.message.replace(/\n/g, '<br>') : 'Kiii 😐<br>Tomake ami ai name a daki?');
        return;
      }

      console.error('Login response error:', response.status, (data && data.message) ? data.message : 'Server login failed');
    } catch (error) {
      console.error('Backend request failed:', error);
    }
  }

  const fallback = await tryLocalLogin(password);
  if (fallback) {
    if (fallback.success) {
      messageData = fallback.messages;
      injectMessages(messageData);
      completeLogin();
      return;
    }
    showToast(fallback.message.replace(/\n/g, '<br>'));
    return;
  }

  const isLocalFile = window.location.protocol === 'file:' || window.location.origin === 'null';
  showToast(isLocalFile
    ? 'Server not reachable. Start the app with `npm start` and open http://localhost:3000, or host the page on a local web server.'
    : 'Unable to complete login. The backend API is unavailable on this host.');
}

// Update countdown timer
function updateCountdown() {
  const start = new Date('March 28, 2026 04:19:00');
  const now = new Date();
  let diff = Math.max(0, now - start);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * 1000 * 60 * 60 * 24;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * 1000 * 60 * 60;
  const minutes = Math.floor(diff / (1000 * 60));
  diff -= minutes * 1000 * 60;
  const seconds = Math.floor(diff / 1000);
  const countdownText = `${days} day${days !== 1 ? 's' : ''} ${hours}h ${minutes}m ${seconds}s`;
  const countdownElement = document.getElementById('countdown');
  if (countdownElement) {
    countdownElement.textContent = countdownText;
  }
}

// Event listeners for navigation
nextButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (isLoggedIn && currentPage < totalPages) {
      currentPage += 1;
      updateBook();
    }
  });
});

prevButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (currentPage > 0) {
      currentPage -= 1;
      updateBook();
    }
  });
});

// Event listeners for login
loginButton.addEventListener('click', handleLogin);
passwordInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    handleLogin();
  }
});

if (pageNoButton) {
  pageNoButton.addEventListener('click', showLoginOverlay);
}

// Initialize
showLoginOverlay();
updateCountdown();
setInterval(updateCountdown, 1000);
