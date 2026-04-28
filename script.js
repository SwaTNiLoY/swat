// Frontend script - all data fetched from server, never embedded in page source
let currentPage = 0;
const totalPages = 7;
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

// Display login counter on the last page
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

// Handle login
async function handleLogin() {
  const password = passwordInput.value.trim();
  
  if (!password) {
    showToast('Kiii 😐<br>Tomake ami ai name a daki?');
    return;
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

  showToast('Unable to complete login. Please open the app from a live web server or check that encoded_pages.json is available.');
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

// Update final page countdown timer
function updateCountdownFinal() {
  const startDate = new Date('April 11, 2026 13:06:00');
  const now = new Date();
  let diff = Math.max(0, now - startDate);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * 1000 * 60 * 60 * 24;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * 1000 * 60 * 60;
  const minutes = Math.floor(diff / (1000 * 60));
  diff -= minutes * 1000 * 60;
  const seconds = Math.floor(diff / 1000);
  const countdownText = `${days} day${days !== 1 ? 's' : ''} ${hours}h ${minutes}m ${seconds}s`;
  const countdownElement = document.getElementById('countdownFinal');
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
updateCountdownFinal();
setInterval(() => {
  updateCountdown();
  updateCountdownFinal();
}, 1000);
