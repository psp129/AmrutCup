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

  const bkmsid = localStorage.getItem('bkmsid');

// register your team
  function saveTeam() {
  const team = document.getElementById('team-name').value;
  const bkmsid = localStorage.getItem('bkmsid');

  if (!team || !bkmsid) {
    alert("Please select a team or ensure you're logged in.");
    return;
  }

  firebase.database().ref('Users/' + bkmsid).update({
    team: team
  })
  .then(() => {
    alert("Team saved successfully!");
  })
  .catch((error) => {
    console.error("Error updating team:", error);
    alert("Failed to save team.");
  });

  firebase.database().ref('Teams/' + center).update({
    team: team
  })
  .then(() => {
    alert("Team saved successfully!");
  })
  .catch((error) => {
    console.error("Error updating team:", error);
    alert("Failed to save team");
  });
}

  //const bkmsid = localStorage.getItem('bkmsid');

if (!bkmsid) {
  document.getElementById('greeting').textContent = "Hi!";
} else {
  db.ref(`Users/${bkmsid}`).once('value')
    .then(snapshot => {
      const user = snapshot.val();
      if (user && user.name) {
        document.getElementById('greeting').textContent = `Hi, ${user.name}!`;
      } else {
        document.getElementById('greeting').textContent = "Hi!";
      }
    })
    .catch(err => {
      console.error("Error fetching user:", err);
      document.getElementById('greeting').textContent = "Hi!";
    });
}

// load the teams
db.ref('Users/' + bkmsid).once('value')
      .then(snapshot => {
        const user = snapshot.val();
        if (user && user.team) {
          loadTeamMembers(user.team);
        } else {
          document.getElementById('team-members').textContent = "You are not part of a team yet.";
        }
      });

    function loadTeamMembers(teamName) {
      const teamSection = document.getElementById('team-members');
      teamSection.innerHTML = '';

      db.ref('Users').once('value')
        .then(snapshot => {
          let found = false;
          snapshot.forEach(child => {
            const member = child.val();
            if (member.team === teamName) {
              const div = document.createElement('div');
              div.textContent = member.name;
              teamSection.appendChild(div);
              found = true;
            }
          });
          if (!found) {
            teamSection.textContent = "No team members found.";
          }
        });
    }

    function logout() {
      firebase.auth().signOut().then(() => {
      window.location.href = "login.html";
      });
    }
