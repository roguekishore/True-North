import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyAmGtdhbG0mPgb5hNTUqmb6dVAcz5T0MZg",
  authDomain: "truenorthjournal.firebaseapp.com",
  projectId: "truenorthjournal",
  storageBucket: "truenorthjournal.firebasestorage.app",
  messagingSenderId: "264825386926",
  appId: "1:264825386926:web:5785020ccb17407bb73a3f",
  measurementId: "G-TN2G2MT0ZK"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;

enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'unimplemented') {
      // console.log("Persistence is not available in this environment.");
    } else if (err.code === 'failed-precondition') {
      // console.log("Multiple tabs open. Persistence may not work.");
    } else {
      console.error("Error enabling persistence:", err);
    }
  });

  