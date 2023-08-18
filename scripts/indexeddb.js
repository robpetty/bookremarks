// IndexedDB
let db;

// db and object store properties
const dbName = "BookRemarks";
const objectStoreName = "sessions";
const sessionKeyPath = "id";

async function initDb() {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (event) => {
      console.log("idb onupgradeneeded");

      // onsuccess will fire when onupgradeneeded completes
      // so no need to resolve with db here.
      let db = event.target.result;

      let objectStore = db.createObjectStore(objectStoreName, {
        keyPath: sessionKeyPath,
        autoIncrement: true,
      });

      objectStore.createIndex("currentSessionIndex", "currentSession");
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      alert("Error Event, check console");
      console.error(event);
    };
  });
}

// initialize database and session
(async () => {
  console.log("Initializing DB.");
  db = await initDb();
  console.log("DB initialized.");

  // stand up BookRemarks
  getActiveSession();
})();

// getAll sessions
async function getAllSessions() {
  return new Promise((resolve, reject) => {
    let transaction = db.transaction(objectStoreName, "readonly");
    let store = transaction.objectStore(objectStoreName);

    store.getAll().onsuccess = (event) => {
      resolve(event.target.result);
    };

    transaction.onerror = (event) => {
      reject(event);
    };
  });
}

// put session in database
async function save(sessionData) {
  return new Promise((resolve, reject) => {
    let transaction = db.transaction(objectStoreName, "readwrite");
    let store = transaction.objectStore(objectStoreName);

    store.put(sessionData);

    transaction.oncomplete = (event) => {
      resolve();
    };

    transaction.onerror = (event) => {
      reject(event);
    };
  });
}

// find the active session if it exists at all
// if so, load it
async function getActiveSession() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(objectStoreName, "readonly");
    const objectStore = transaction.objectStore(objectStoreName);
    //const index = objectStore.index("currentSessionIndex");

    // IDBKeyRange.only only does not allow boolean as an index so using integers
    // 0=false, 1=true
    //const query = index.openCursor(IDBKeyRange.only(1));
    const query = objectStore.openCursor();

    query.onsuccess = (event) => {
      const cursor = event.target.result;

      if (cursor) {
        const session = cursor.value;

        if (session.currentSession === 1) {
          //console.log(session);

          activeSession = session;

          console.log("Loading the most recent active session");

          chrome.runtime.sendMessage({
            action: "setActiveSession",
            data: activeSession,
          });

          resolve(session);

          return true;
        }

        cursor.continue();
      } else {
        console.log("No active session found in IndexedDB.");
        resolve(null);
      }
    };

    query.onerror = (err) => {
      console.error(`Unable to retrieve session: ${err}`);
      reject(err);
    };
  });
}

function saveDummyObject(active = 0) {
  const event = Date.now();

  // IDBKeyRange.only only does not allow boolean as an index so using integers
  var session = {
    id: event,
    currentSession: active,
    sessionName: `Sample Session Name - ${event.toString()}`,
    startDate: new Date(),
    bookmarkData: [{ url: "http://www.uky.edu" }],
    contentData: [
      {
        url: "http://www.google.com",
        selectedText: "lorem ipsem yo",
        fullBodyText:
          "bunch of text here to show lorem ipsem yo in the middle of it",
      },
    ],
  };

  if (db != undefined) {
    const transaction = db.transaction(objectStoreName, "readwrite");

    const objectStore = transaction.objectStore(objectStoreName);

    // Add new session
    const request = objectStore.add(session);

    transaction.oncomplete = function (event) {
      console.log(event);
    };

    transaction.onerror = function (event) {
      console.error(event);
    };

    request.onsuccess = () => {
      // request.result contains key of the added object
      console.log(`New session added, id: ${request.result}`);
    };

    request.onerror = (err) => {
      console.error(`Error saving session: ${err}`);
    };
  }
}

// get a single session by id
async function getSessionById(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(objectStoreName, "readonly");
    const objectStore = transaction.objectStore(objectStoreName);

    const getRequest = objectStore.get(id);

    getRequest.onsuccess = (event) => {
      const session = event.target.result;

      if (session) {
        console.log("Retrieved session by ID:", session);
      } else {
        console.log("Session not found");
      }

      resolve(session);
    };

    getRequest.onerror = (err) => {
      console.error("Error retrieving session");

      reject(err);
    };
  });
}

// delete session by id
async function deleteSession(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(objectStoreName, "readwrite");
    const objectStore = transaction.objectStore(objectStoreName);

    const deleteRequest = objectStore.delete(id);

    transaction.oncomplete = (event) => {
      resolve(true);
    };

    transaction.onerror = (event) => {
      reject(event);
    };
  });
}
