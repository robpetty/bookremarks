try {
  importScripts("/scripts/indexeddb.js");

  console.log("/scripts/indexeddb.js imported.");
} catch (e) {
  console.log("Failed to load indexeddb script.");
  console.error(e);
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Reload all existing tabs
    //reloadAllTabs();
    // causes Google to think we are a bot as its happening constantly
    // so do manual refresh and evaluate activeTab later.
  }
});

// Reload all tabs
function reloadAllTabs() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.reload(tab.id);
    });
  });
}

console.log("background.js is loaded");

// capture bookmark creation (id is bookmark or folder)
// handle these differently then captured text
chrome.bookmarks.onCreated.addListener((id) => {
  console.log("chrome.bookmarks.onCreated");
  console.log(id);

  let data = null;

  chrome.bookmarks.get(id, (result) => {
    data = result;

    console.log("Getting bookmark by id: " + data);
    console.log(JSON.stringify(data));

    // Bad code, sometimes array, sometimes not
    try {
      data[0].type = "bookmark";
      console.log("Actual bookmark: " + JSON.stringify(data));
    } catch (e) {
      // moved into the result here to see if it fixes the race condition.
      console.warn(data);
      console.log("Not bookmark: " + JSON.stringify(data));
      data.type = "bookmark";
    }

    // send bookmark message to add to session timeline
    console.log(data);
    chrome.runtime.sendMessage({ action: "bookmarkCreated", data: data });
  });
});

// data layer interaction
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "saveSession") {
    sessionData = message.data;

    // for indexeddb
    save(sessionData);
  } else if (message.action === "getSessionById") {
    (async () => {
      id = message.data;
      let session = await getSessionById(id);

      sendResponse({ session: session });
    })();
  } else if (message.action === "deleteSession") {
    (async () => {
      id = message.id;
      let result = await deleteSession(id);

      sendResponse({ result: result });
    })();
  }

  // Indicate the asynchronous operation is being handled
  return true;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getAllSessions") {
    (async () => {
      let indexeddbSessions = await getAllSessions();

      sendResponse({ sessions: indexeddbSessions });
    })();
  }

  return true;
});
