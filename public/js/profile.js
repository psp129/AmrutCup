const firebaseConfig = {
    apiKey: "AIzaSyACxsbxzBQ_Wk6diSeU2ejMPZu2ajgQWaI",
  authDomain: "amrutcup-f7225.firebaseapp.com",
  databaseURL: "https://amrutcup-f7225-default-rtdb.firebaseio.com",
  projectId: "amrutcup-f7225",
  storageBucket: "amrutcup-f7225.firebasestorage.app",
  messagingSenderId: "540970777934",
  appId: "1:540970777934:web:19699b90ff40aa2fedf21f",
  measurementId: "G-DJPX5SH2EH"
  };


  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  
  async function create() {

  const bkmsid = document.getElementById('bkmsid').value.trim();
  const password = document.getElementById('password').value.trim();
  const name = document.getElementById('name').value.trim();
  const center = document.getElementById('center').value.trim();
  const group = document.getElementById('group').value.trim();

  if (!bkmsid || !name || !center || !password || !group) {
    alert('Please complete all fields and select at least one class.');
    return;
  }

  const profile = {
    name,
    bkmsid,
    password,
    center,
    group
  };

    // api POST to firebase database + testing using API to see if the route works
  try {
      //const newProfile = await fetch("http://localhost:3000/create-user", {
        const backend = 'https://amrutcup.onrender.com'
        const newProfile = await fetch(`${backend}/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });

      const result = await newProfile.json();

      if(newProfile.ok){
        console.log('Profile has been saved via API:', result);
        localStorage.setItem('bkmsid', bkmsid);
        alert('Profile completed via API');
        window.location.href = "dashboard.html";
      } else {
        throw new Error(result.error || 'UNKOWN ERROR');
      }
    } catch (error) {
      console.error('Error saving the profile:', error);
      alert('Failed to save profile via API');
    }
  }
