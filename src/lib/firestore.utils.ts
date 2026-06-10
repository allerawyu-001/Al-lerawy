import { 
  collection, 
  getDocs, 
  query, 
  QueryConstraint, 
  limit, 
  startAfter, 
  getCountFromServer,
  DocumentSnapshot,
  Firestore
} from "firebase/firestore";

interface PaginatedRequest {
  db: Firestore;
  collectionName: string;
  constraints: QueryConstraint[];
  pageSize: number;
  page: number;
  pageCursors: DocumentSnapshot[];
}

export async function fetchPaginatedData<T = any>({
  db,
  collectionName,
  constraints,
  pageSize,
  page,
  pageCursors
}: PaginatedRequest) {
  const colRef = collection(db, collectionName);
  
  // Get total count
  const countSnap = await getCountFromServer(query(colRef, ...constraints));
  const totalCount = countSnap.data().count;

  // Build paginated query
  const paginatedConstraints = [...constraints, limit(pageSize)];
  if (page > 1 && pageCursors[page - 2]) {
    paginatedConstraints.push(startAfter(pageCursors[page - 2]));
  }

  const queryRef = query(colRef, ...paginatedConstraints);
  const snap = await getDocs(queryRef);
  
  const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
  
  return {
    docs,
    totalCount,
    lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
    empty: snap.empty
  };
}
