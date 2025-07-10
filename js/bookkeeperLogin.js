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