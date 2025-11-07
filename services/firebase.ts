import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAUnCQFmL0PHhVPOpkUj9YUGc3RHBmWBpg",
  authDomain: "ideas-a9dea.firebaseapp.com",
  projectId: "ideas-a9dea",
  storageBucket: "ideas-a9dea.firebasestorage.app",
  messagingSenderId: "126723826835",
  appId: "1:126723826835:web:4c411b5a172a8c4f331966",
  measurementId: "G-BEJR2TGRWJ"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const auth = firebase.auth();
export default firebase;
