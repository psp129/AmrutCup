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
 
  function create() {
  const team = document.getElementById('team-name').value;
  const bracket = document.getElementById('bracket').value;

  if (!team || !bracket) {
    alert("Please select a team or ensure you're logged in.");
    return;
  }

  firebase.database().ref('Teams/' + bracket).push({
    name: team
  })
  .then(() => {
    alert("Team saved successfully!");
  })
  .catch((error) => {
    console.error("Error updating team:", error);
    alert("Failed to save team.");
  });
}

async function regenerateCourt(courtNumber) {
  const courtKey = `Court${courtNumber}`;
  const group = courtNumber <= 4 ? "K1" : "K2";
  const queueRef = firebase.database().ref(`ScheduledMatches/${group}`);
  const courtRef = firebase.database().ref(`Courts/${courtKey}`);

  const queueSnapshot = await queueRef.once("value");
  const queue = queueSnapshot.val();

  if (queue && queue.length > 0) {
    const nextMatch = queue.shift();

    await courtRef.set({
      team1: nextMatch.team1,
      team2: nextMatch.team2,
      score1: 0,
      score2: 0
    });

    await queueRef.set(queue);
    alert(`Court ${courtNumber} match updated!`);
  } else {
    alert(`No more matches left in ${group}'s queue.`);
  }
}

async function generateScheduledMatches(group) {
  const teamsRef = firebase.database().ref(`Teams/${group}`);
  const snapshot = await teamsRef.once("value");

  const teams = [];
  snapshot.forEach(child => {
    teams.push(child.val().name);
  });

  if (teams.length < 2) {
    alert(`Not enough teams in ${group} to generate matchups.`);
    return;
  }

  // Shuffle teams
  teams.sort(() => Math.random() - 0.5);

  // Pair them
  const matches = [];
  for (let i = 0; i < teams.length; i += 2) {
    const match = {
      team1: teams[i],
      team2: teams[i + 1] || "BYE" // handle odd number of teams
    };
    matches.push(match);
  }

  // Save to ScheduledMatches/group
  const scheduledRef = firebase.database().ref(`ScheduledMatches/${group}`);
  await scheduledRef.set(matches);

  alert(`Scheduled matches generated for ${group}`);
}