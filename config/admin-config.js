// admin config
import fbAdmin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('../service-account.json');

fbAdmin.initializeApp({
    credential: fbAdmin.credential.cert(serviceAccount),
    // storageBucket: "https://console.firebase.google.com/project/devsnap-d2441/storage/devsnap-d2441.firebasestorage.app/files",
    // databaseURL: process.env.DATABASE_URL, // for realtime database
});

const db = fbAdmin.firestore();
const auth = fbAdmin.auth();
// const bucket = fbAdmin.storage().bucket()

export { db, auth, fbAdmin };