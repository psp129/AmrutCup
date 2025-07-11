// ✅ Firebase configuration (your own project credentials)
const firebaseConfig = {
  apiKey: "AIzaSyACxsbxzBQ_Wk6diSeU2ejMPZu2ajgQWaI",
  authDomain: "amrutcup-f7225.firebaseapp.com",
  databaseURL: "https://amrutcup-f7225-default-rtdb.firebaseio.com",
  projectId: "amrutcup-f7225",
  storageBucket: "amrutcup-f7225.appspot.com",
  messagingSenderId: "540970777934",
  appId: "1:540970777934:web:19699b90ff40aa2fedf21f",
  measurementId: "G-DJPX5SH2EH"
};

// ✅ Must initialize Firebase before using it
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

async function login(){
    const bkmsid = document.getElementById('bkmsid').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!bkmsid || !password) {
      alert('Please enter both BKMS ID and password.');
      return;
    }

    try {
      const snapshot = await firebase.database().ref(`Bookkeepers/${bkmsid}`).once('value');

      if (!snapshot.exists()) {
        alert('No user found with this BKMS ID.');
        return;
      }

      const userData = snapshot.val();

      if (userData.password === password) {
        alert('Login successful!');
        // Store user info locally (optional)
        localStorage.setItem('bkmsid', bkmsid);
        // Redirect
        window.location.href = "bookkeeper.html"; // bookkeeper dashboard
      } else {
        alert('Incorrect password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred while logging in.');
    }
  }