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
    const courtRef = db.ref(`Courts/Court${i}`);

    courtRef.on("child_changed", async (snapshot) => {
      if (snapshot.key === "finished" && snapshot.val() === true) {
        const courtNum = i;
        const courtDataSnapshot = await courtRef.once("value");
        const finishedMatch = courtDataSnapshot.val();

        // ✅ Archive the finished match
        const historyRef = db.ref(`MatchHistory/Court${courtNum}`).push();
        await historyRef.set({
          team1: finishedMatch.team1,
          team2: finishedMatch.team2,
          score1: finishedMatch.score1,
          score2: finishedMatch.score2,
          timestamp: Date.now()
        });

        // 🔄 Load next match
        let group = courtNum <= 4 ? "K1" : "K2";
        const queueRef = db.ref(`ScheduledMatches/${group}`);
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

async function loadGames() {
  const courtsRef = db.ref("Courts");
  const snapshot = await courtsRef.once("value");
  const games = snapshot.val();

  Object.entries(games).forEach(([courtKey, game], index) => {
    const courtNum = courtKey.replace("Court", "");

    const card = document.createElement('div');
    card.classList.add('game-card');
    card.dataset.court = courtNum;

    card.innerHTML = `
      <h3>${courtKey}: ${game.team1 || "TBD"} vs ${game.team2 || "TBD"}</h3>
      <p>Likes: <span class="like-count">${game.likes || 0}</span></p>
      <button class="like-button">❤️ Like</button>
    `;

    document.body.appendChild(card);

    const chatBox = createChatForCourt(courtNum);
    card.appendChild(chatBox);

    // Setup chat listeners and handlers
    listenToChat(courtNum);
    setupSendHandler(courtNum);
  });

  // Re-bind like button handler after rendering
  bindLikeButtons();
}


function createChatForCourt(courtNum) {
  const chatBox = document.createElement('div');
  chatBox.classList.add('chat-box');

  chatBox.innerHTML = `
    <div class="messages" id="messages-${courtNum}"></div>
    <input type="text" id="input-${courtNum}" placeholder="Show your samp, suhradhbhav, and ekta..."/>
    <button id="send-${courtNum}">Send</button>
  `;

  return chatBox;
}

function listenToChat(courtNum) {
  const messagesDiv = document.querySelector(`#Court${courtNum} .messages`);
  const messagesRef = db.ref(`Courts/Court${courtNum}/messages`);

  if (!messagesDiv) {
    console.warn(`No messages div found for Court${courtNum}`);
    return;
  }

  messagesRef.on('value', snapshot => {
    messagesDiv.innerHTML = ''; // clear old messages
    const messages = snapshot.val();
    if (messages) {
      Object.values(messages).forEach(msg => {
        const p = document.createElement('p');
        p.textContent = `${msg.user || 'Anon'}: ${msg.text}`;
        messagesDiv.appendChild(p);
      });
    }
  });
}


function setupSendHandler(courtNum) {
  const input = document.querySelector(`#Court${courtNum} .chat-input`);
  const sendBtn = document.querySelector(`#Court${courtNum} .send-btn`);

  sendBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) return;

    const messageRef = db.ref(`Courts/Court${courtNum}/messages`);
    messageRef.push({
      user: 'Anonymous',
      text,
      timestamp: Date.now()
    }).then(() => {
      console.log(`Message sent to Court${courtNum}:`, text);
      input.value = '';
    }).catch(err => {
      console.error("Failed to send message:", err);
    });
  });
}

function bindLikeButtons() {
  document.querySelectorAll('.court-box').forEach(box => {
    const button = box.querySelector('.like-button');
    const likeCountSpan = box.querySelector('.like-count');
    const heading = box.querySelector('h2');
    const match = heading.textContent.match(/Court (\d+)/);
    if (!match) return;

    const courtNum = match[1];

    button.addEventListener('click', async () => {
      const courtRef = db.ref(`Courts/Court${courtNum}`);

      courtRef.transaction(currentData => {
        if (currentData) {
          currentData.likes = (currentData.likes || 0) + 1;
        }
        return currentData;
      }, (error, committed, snapshot) => {
        if (error) {
          console.error(`Like failed for Court${courtNum}:`, error);
        } else if (!committed) {
          console.warn(`Like not committed for Court${courtNum}`);
        } else {
          console.log(`Liked Court${courtNum}`);
          likeCountSpan.textContent = parseInt(likeCountSpan.textContent) + 1;
        }
      });
    });
  });
}
 
// assignInitialMatchesToCourts();
// setupCourtRotation();
// listenToCourts();
// leaderboard("K1", "leaderboard-k1");
// leaderboard("K2", "leaderboard-k2");
//loadGames();

window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");

  assignInitialMatchesToCourts()
    .then(() => {
      console.log("Matches assigned");
      setupCourtRotation();
      listenToCourts();
      leaderboard("K1", "leaderboard-k1");
      leaderboard("K2", "leaderboard-k2");
      bindLikeButtons();

      for (let i = 1; i <= 6; i++) {
        listenToChat(i);
        setupSendHandler(i);
      }
    })
    .catch(err => console.error("Setup failed:", err));
});
