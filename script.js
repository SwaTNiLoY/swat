// Frontend script - all data fetched from server, never embedded in page source
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue, set } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAy-DSzOHaXuxXTRfP5D_mFkrQF74MbuVE",
  authDomain: "message-to-someone-special.firebaseapp.com",
  projectId: "message-to-someone-special",
  storageBucket: "message-to-someone-special.firebasestorage.app",
  messagingSenderId: "533652600769",
  appId: "1:533652600769:web:6350897e162100bfcee140",
  measurementId: "G-V1VQ5111C0",
  databaseURL: "https://message-to-someone-special-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    isLoggedIn = true;
    loginOverlay.classList.remove('active');
    console.log('User signed in:', user.email);
  } else {
    // User is signed out
    isLoggedIn = false;
    loginOverlay.classList.add('active');
    console.log('User signed out');
  }
});

let currentPage = 0;
const totalPages = 7;
let messageData = {};
let isLoggedIn = false;
let loginCount = 0;

const book = document.getElementById('book');
const nextButtons = document.querySelectorAll('.page-next');
const prevButtons = document.querySelectorAll('.page-prev');
const loginOverlay = document.getElementById('loginOverlay');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginButton = document.getElementById('loginButton');
const pageNoButton = document.getElementById('pageNoButton');
const loginToast = document.getElementById('loginToast');

// Update book view
function updateBook() {
  book.className = `book page-${currentPage}`;
}

// Display login counter on the last page
function updateLoginCounter() {
  const counterElement = document.getElementById('loginCounter');
  if (counterElement) {
    counterElement.textContent = loginCount;
  }
}

// Set up real-time listener for login counter from Firebase
function setupLoginCounterListener() {
  try {
    const counterRef = ref(database, 'loginCounter');
    onValue(counterRef, (snapshot) => {
      if (snapshot.exists()) {
        loginCount = snapshot.val();
        console.log('Login count updated:', loginCount);
        updateLoginCounter();
      } else {
        // Initialize counter if it doesn't exist
        loginCount = 0;
        updateLoginCounter();
      }
    }, (error) => {
      console.error('Failed to listen to login counter:', error);
    });
  } catch (error) {
    console.error('Error setting up counter listener:', error);
  }
}

// Fetch login counter from backend (fallback)
async function fetchLoginCounter() {
  const useBackend = Boolean(API_BASE_URL);
  if (!useBackend) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/login-counter`);
    if (response.ok) {
      const data = await response.json();
      loginCount = data.count;
      updateLoginCounter();
    }
  } catch (error) {
    console.error('Failed to fetch login counter:', error);
  }
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
  const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const isLocalPort3000 = isLocalHost && window.location.port === '3000';
  const isNonBackendLocalPort = isLocalHost && window.location.port && window.location.port !== '3000';

  // For localhost development
  if (isNonBackendLocalPort || isLocalPort3000) {
    return BACKEND_ORIGIN;
  }

  // For deployed versions (Vercel, GitHub Pages, etc.) use current origin
  if (!isLocalFile && !isLocalHost) {
    return window.location.origin;
  }

  // For local file protocol fallback
  if (isLocalFile) {
    return null;
  }

  return window.location.origin;
})();

// Handle login
async function handleLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!email || !password) {
    showToast('Kiii 😐<br>Enter both email and password!');
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('Logged in as:', user.email);
    
    // Increment counter in Firebase Realtime Database
    try {
      const counterRef = ref(database, 'loginCounter');
      onValue(counterRef, (snapshot) => {
        const currentCount = snapshot.val() || 0;
        set(counterRef, currentCount + 1).then(() => {
          console.log('Counter incremented to:', currentCount + 1);
        }).catch(err => {
          console.error('Failed to increment counter:', err);
        });
      }, { onlyOnce: true });
    } catch (err) {
      console.error('Failed to update counter:', err);
    }
    
    // Fetch messages from backend (assuming backend still serves them)
    const useBackend = Boolean(API_BASE_URL);
    if (useBackend) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.uid }) // Pass user ID instead of password
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            messageData = data.messages;
            injectMessages(messageData);
            completeLogin();
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch messages from backend:', err);
      }
    }
    
    // Fallback if no backend
    completeLogin();
    
  } catch (error) {
    console.error('Login failed:', error);
    showToast('Login failed: ' + error.message);
  }
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
setupLoginCounterListener();
showLoginOverlay();
updateCountdown();
updateCountdownFinal();
setInterval(() => {
  updateCountdown();
  updateCountdownFinal();
}, 1000);
