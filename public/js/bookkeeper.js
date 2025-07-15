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
  
  async function record(event){

  event.preventDefault();
  
  const courtNum = document.getElementById('Court').value.trim();
  const teamA = document.getElementById('teamA').value.trim();
  const teamB = document.getElementById('teamB').value.trim();
  const scoreA = document.getElementById('scoreA').value;
  const scoreB = document.getElementById('scoreB').value;

  if (!courtNum || !teamA || !teamB || !scoreA || !scoreB) {
    alert('Please complete all fields and select at least one class.');
    return;
  }

  const courtPath = `Courts/Courts${courtNum}`;

  const game = {
    courtNum,
    teamA,
    teamB,
    scoreA,
    scoreB
  };

  try {
      const backend = 'https://amrutcup.onrender.com'
      //const newGame = await fetch("http://localhost:3000/save-game", {
        const newGame = await fetch(`${backend}/save-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(game)
      });

      const result = await newGame.json();

      if(newGame.ok){
        console.log('Game has been saved via API:', result);
        alert('Game recorded via API');
      } else {
        throw new Error(result.error || 'UNKOWN ERROR');
      }
    } catch (error) {
      console.error('Error saving the game:', error);
      alert('Failed to save game via API');
    }
}