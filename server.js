const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const crypto = require('crypto');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://amrutcup-f7225-default-rtdb.firebaseio.com'
});

const app = express();
const PORT = 3000;

app.use(express.json());
//app.use(cors());

app.use(cors({
  origin: '*',  // or use your actual frontend domain for more security
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

const db = admin.database();


// Create New User for User API
app.post('/create-user', async (req, res) => {
    const { bkmsid, name, password, center, group } = req.body;
  
    if (!bkmsid || !name || !password || !center || !group) {
      return res.status(400).json({ error: 'Missing a required field. Please fill out all parts of the profile.' });
    }
  
    try {
      const userRef = db.ref(`Users/${bkmsid}`);
      await userRef.set({
        name,
        password,
        bkmsid,
        center,
        group,
      });
  
      res.status(200).json({ message: 'Profile created successfully!' });
    } catch (err) {
      console.error('Error saving profile:', err);
      res.status(500).json({ error: 'Failed to save profile' });
    }
  });

  app.post('/save-game', async(req, res) => {
    const {courtNum, teamA, teamB, scoreA, scoreB} = req.body;
  
    if (!courtNum || !teamA || !teamB || !scoreA || !scoreB) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
  
    try {

      await db.ref(`Courts/Court${courtNum}`).update({
        team1: teamA,
        team2: teamB,
        score1: scoreA,
        score2: scoreB,
        finished: true 
      });
  
      res.status(200).json({message: 'Game saved!'});
    } catch (err) {
      console.error('Error saving game', err);
      res.status(500).json({error: 'Failed to save game'});
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });