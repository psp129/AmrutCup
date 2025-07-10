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
  
  async function generateMatchSchedule() {
  const snapshot = await firebase.database().ref("Teams").once("value");
  const groupedTeams = { K1: [], K2: [] };

  snapshot.forEach(groupSnap => {
    const groupKey = groupSnap.key; // should be 'K1' or 'K2'
    groupSnap.forEach(teamSnap => {
      const teamData = teamSnap.val();
      if (teamData.name && groupedTeams[groupKey]) {
        groupedTeams[groupKey].push(teamData.name);
      }
    });
  });

  function generateMatches(teams, maxMatches = 4) {
    const matches = [];
    const matchCount = {};

    teams.forEach(t => matchCount[t] = 0);

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const t1 = teams[i];
        const t2 = teams[j];

        if (matchCount[t1] < maxMatches && matchCount[t2] < maxMatches) {
          matches.push({ team1: t1, team2: t2 });
          matchCount[t1]++;
          matchCount[t2]++;
        }
      }
    }

    return matches;
  }

  return {
    K1: generateMatches(groupedTeams.K1),
    K2: generateMatches(groupedTeams.K2)
  };

  console.log("generateMatchSchedule triggered");

}


async function assignInitialMatchesToCourts() {
  const matchesByGroup = await generateMatchSchedule();
  const k1Matches = matchesByGroup.K1;
  const k2Matches = matchesByGroup.K2;

  const scheduledTeams = new Set();

  async function assignMatches(matches, courtStartIndex, courtEndIndex) {
    let courtIndex = courtStartIndex;

    for (let i = 0; i < matches.length && courtIndex <= courtEndIndex; i++) {
      const match = matches[i];
      const { team1, team2 } = match;

      if (scheduledTeams.has(team1) || scheduledTeams.has(team2)) continue;

      const courtRef = firebase.database().ref(`Courts/Court${courtIndex}`);
      await courtRef.set({
        team1,
        team2,
        score1: 0,
        score2: 0
      });

      scheduledTeams.add(team1);
      scheduledTeams.add(team2);
      courtIndex++;
    }

    return matches.filter(
      match => !(scheduledTeams.has(match.team1) || scheduledTeams.has(match.team2))
    );
  }

  const remainingK1 = await assignMatches(k1Matches, 1, 4);
  const remainingK2 = await assignMatches(k2Matches, 5, 6);

  await firebase.database().ref("ScheduledMatches/K1").set(remainingK1);
  await firebase.database().ref("ScheduledMatches/K2").set(remainingK2);

  console.log("assignInitialMatchesToCourts triggered");

}




function setupCourtRotation() {
  for (let i = 1; i <= 6; i++) {
    const courtRef = firebase.database().ref(`Courts/Court${i}`);

    courtRef.on("child_changed", async (snapshot) => {
      if (snapshot.key === "finished" && snapshot.val() === true) {
        let group = i <= 4 ? "K1" : "K2";
        const queueRef = firebase.database().ref(`ScheduledMatches/${group}`);
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
        }
      }
    });
  }
}


function listenToCourts() {
  const courtsRef = db.ref("Courts");

  courtsRef.on("value", (snapshot) => {
    const data = snapshot.val();

    for (const court in data) {
      const match = data[court];

      const t1El = document.getElementById(`${court}-team1`);
      const t2El = document.getElementById(`${court}-team2`);

      if (t1El) t1El.textContent = match.team1 || "TBD";
      if (t2El) t2El.textContent = match.team2 || "TBD";
    }
  });
}

async function leaderboard(group, leaderboardElementId){
  const courtsRef = db.ref("Courts");
  const snapshot = await courtsRef.once("value");

  const teamDiffs = {};

  snapshot.forEach(child => {
    const match = child.val();
    if (!match.team1 || !match.team2) return;

    // Only process matches for the given group (K1 or K2)
    if (!match.team1.startsWith(group) && !match.team2.startsWith(group)) return;

    const t1 = match.team1;
    const t2 = match.team2;
    const s1 = match.score1 || 0;
    const s2 = match.score2 || 0;

    // Initialize differential totals
    if (!(t1 in teamDiffs)) teamDiffs[t1] = 0;
    if (!(t2 in teamDiffs)) teamDiffs[t2] = 0;

    // Update point differentials
    teamDiffs[t1] += s1 - s2;
    teamDiffs[t2] += s2 - s1;
  });
  const sorted = Object.entries(teamDiffs).sort((a, b) => b[1] - a[1]);

  const ul = document.getElementById(leaderboardElementId);
  ul.innerHTML = '';
  sorted.forEach(([team, diff], index) => {
    const li = document.createElement('li');
    li.textContent = `${index + 1}. ${team} (Diff: ${diff})`;
    ul.appendChild(li);
  });
  
}

 
assignInitialMatchesToCourts();
setupCourtRotation();
listenToCourts();
leaderboard("K1", "leaderboard-k1");
leaderboard("K2", "leaderboard-k2");