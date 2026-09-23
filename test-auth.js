import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);

signInWithEmailAndPassword(auth, "admin@grandhannan.com", "admin99")
  .then(() => console.log("SUCCESS"))
  .catch(e => {
    console.log("ERROR CODE:", e.code);
    console.log("ERROR MESSAGE:", e.message);
    process.exit(0);
  });
