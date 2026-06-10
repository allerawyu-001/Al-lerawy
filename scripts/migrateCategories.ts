import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";
import * as dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const categoryMapping: Record<string, string> = {
  "Snapback": "Kindai",
  "Dad Hat": "Bama",
  "Fitted": "Bangwal",
  "Trucker": "Yerwa",
  "Beret": "Yerwa"
};

async function migrate() {
  console.log("Starting category migration (Client SDK)...");
  
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  const snapshot = await getDocs(collection(db, "products"));
  
  if (snapshot.empty) {
    console.log("No products found.");
    return;
  }

  let count = 0;
  const batch = writeBatch(db);
  
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.category && categoryMapping[data.category]) {
      const newCategory = categoryMapping[data.category];
      batch.update(docSnap.ref, { category: newCategory });
      console.log(`Migrating product ${docSnap.id} from ${data.category} to ${newCategory}`);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Migration complete. Updated ${count} products.`);
  } else {
    console.log("No products needed migration. All categories standard.");
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(console.error);
