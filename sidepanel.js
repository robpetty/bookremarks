console.log("sidepanel.js is loaded");

// the current active session
let activeSession = undefined;

let dropdown = undefined;

const defaultSessionSchema = {
  id: Date.now(),
  sessionName: "",
  currentSession: 1,
  startDate: new Date(),
  savedDate: new Date(),
  bookmarkData: [],
  contentData: [],
};

// start new session
document.addEventListener("DOMContentLoaded", function onDOMContentLoaded() {
  console.log("onDOMContentLoaded");

  dropdown = document.getElementById("sessionDropdown");

  dropdown.addEventListener("change", function () {
    const selectedSessionId = parseInt(this.value); // Get the selected value from the dropdown

    updateSessionView(selectedSessionId);
  });

  updateSessionName();
  reloadSessionDropDown();
  newSession();
});

function newSession() {
  // reset active Session
  const loadedNewSessionAt = new Date();

  activeSession = {
    id: Date.now(),
    sessionName: "",
    currentSession: 1,
    startDate: loadedNewSessionAt,
    savedDate: loadedNewSessionAt,
    bookmarkData: [],
    contentData: [],
  };

  // parse date and time
  const dateOptions = { year: "2-digit", month: "2-digit", day: "2-digit" };
  const timeOptions = { hour: "2-digit", minute: "2-digit", second: "2-digit" };
  const formattedDate = loadedNewSessionAt.toLocaleDateString(
    undefined,
    dateOptions
  );
  const formattedTime = loadedNewSessionAt.toLocaleTimeString(
    undefined,
    timeOptions
  );

  const sessionNameDiv = document.getElementById("sessionName");
  sessionNameDiv.innerText = `Session Name ${formattedDate} - ${formattedTime}`;

  const startDateDiv = document.getElementById("startDate");
  startDateDiv.innerHTML = `Session started at ${formattedDate} - ${formattedTime}.`;

  // clear timeline
  const timelineDiv = document.getElementById("timeline");
  timelineDiv.innerHTML = "";
}

function renderBottomToolbar(render = true) {
  bottom.innerHTML = "";

  if (render === true) {
    // add last saved div
    const saveDateDiv = document.createElement("div");
    saveDateDiv.setAttribute("id", "saveDate");

    // add session save button
    const saveButton = document.createElement("button");
    saveButton.setAttribute("id", "saveButton");
    saveButton.appendChild(document.createTextNode("Save"));
    saveButton.setAttribute("class", "button-image");
    saveButton.addEventListener("click", saveSession);

    // and save and close button
    const saveAndCloseButton = document.createElement("button");
    saveAndCloseButton.setAttribute("id", "saveAndClose");
    saveAndCloseButton.appendChild(document.createTextNode("Save + Close"));
    saveAndCloseButton.setAttribute("class", "button-image");
    saveAndCloseButton.addEventListener("click", saveAndCloseSession);

    // delete
    const deleteButton = document.createElement("button");
    deleteButton.setAttribute("id", "delete");
    deleteButton.appendChild(document.createTextNode("Delete"));
    deleteButton.setAttribute("class", "button-image");
    deleteButton.addEventListener("click", deleteSession);

    const bottom = document.getElementById("bottom");

    bottom.appendChild(saveDateDiv);
    bottom.appendChild(saveButton);
    bottom.appendChild(saveAndCloseButton);
    bottom.appendChild(deleteButton);
  }
}

function reloadSessionDropDown() {
  chrome.runtime.sendMessage({ action: "getAllSessions" }, (response) => {
    console.log(response.sessions);

    if (response.sessions != undefined) {
      if (response.sessions.length > 0) {
        // remove children, if any, from earlier
        if (dropdown.options.length > 0) {
          for (i = dropdown.options.length; i >= 0; i--) {
            dropdown.remove(i);
          }
        }

        const option = document.createElement("option");
        option.value = -1;
        option.textContent = "Select other session";
        dropdown.appendChild(option);

        response.sessions.forEach((session) => {
          const option = document.createElement("option");
          option.value = session.id;
          option.textContent = session.sessionName;
          dropdown.appendChild(option);
        });

        // set dropdown to current active session id
        document.querySelector("#sessionDropdown").value = activeSession.id;

        dropdown.hidden = false;
      } else {
        dropdown.hidden = true;
      }
    }
  });
}

function updateSessionView(selectedSessionId) {
  console.log(selectedSessionId);

  // IndexedDB session ids must be positive integers, so using negative here to know default label chosen
  if (selectedSessionId === -1) {
    return;
  }

  // update and save current session due to it no longer being active session
  saveSession(0);

  chrome.runtime.sendMessage(
    { action: "getSessionById", data: selectedSessionId },
    (response) => {
      //console.log(response.session)
      const session = response.session;

      // rerender timeline, bottomToolBar
      const startDateDiv = document.getElementById("startDate");
      startDateDiv.innerHTML = `Session started at ${session.startDate}.`;

      activeSession = session;
      activeSession.currentSession = 1;

      document.getElementById("sessionName").innerText =
        activeSession.sessionName;

      rerenderTimeline(activeSession);
      renderBottomToolbar(true);
    }
  );
}

function saveSession(active = 0) {
  if (activeSession.bookmarkData.length || activeSession.contentData.length) {
    // get current sessionName, update dateSaved, etc.
    activeSession.savedDate = new Date();
    activeSession.sessionName =
      document.getElementById("sessionName").innerText;

    // update UI
    const saveDateDiv = document.getElementById("saveDate");
    saveDateDiv.innerHTML = "Last saved at " + activeSession.savedDate;

    chrome.runtime.sendMessage({ action: "saveSession", data: activeSession });

    showToast("Saving session.");

    // update session selector
    reloadSessionDropDown();
  }
}

function saveAndCloseSession() {
  if (activeSession.bookmarkData.length || activeSession.contentData.length) {
    // get current sessionName, update dateSaved, etc.
    activeSession.savedDate = new Date();
    activeSession.sessionName =
      document.getElementById("sessionName").innerText;

    // update UI
    const saveDateDiv = document.getElementById("saveDate");
    saveDateDiv.innerHTML = "Last saved at " + activeSession.savedDate;

    // set currentSession = 0
    activeSession.currentSession = 0;

    chrome.runtime.sendMessage({ action: "saveSession", data: activeSession });

    // update session selector, and bottomToolBar
    reloadSessionDropDown();
    renderBottomToolbar(false);

    // close session
    newSession();

    showToast("Saving and closing session.");
  }
}

function deleteSession() {
  const id = activeSession.id;

  chrome.runtime.sendMessage({ action: "deleteSession", id: id });

  newSession();
  reloadSessionDropDown();
  renderBottomToolbar(false);

  showToast("Deleting session.");
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "contentCapture") {
    // disallow duplicates
    const isDuplicate = activeSession.contentData.some(
      (item) =>
        item.url === message.data.url &&
        item.selectedText === message.data.selectedText &&
        item.type === "content"
    );

    if (isDuplicate === true) {
      return;
    }

    // append messages to sessionData, will later save when session complete
    message.data.dateAdded = Date.now();
    activeSession.contentData.push(message.data);

    // rerender timeline, bottomToolBar
    rerenderTimeline(activeSession);
    renderBottomToolbar(true);
  } else if (message.action === "bookmarkCreated") {
    bookmark = message.data[0];

    // disallow duplicates, check for bookmark type only
    const isDuplicate = activeSession.bookmarkData.some(
      (item) => item.url === bookmark.url && item.type === "bookmark"
    );

    if (isDuplicate === true) {
      return;
    }

    // append messages to sessionData, will later save when session complete
    bookmark.dateAdded = Date.now();
    activeSession.bookmarkData.push(bookmark);

    // rerender timeline, bottomToolBar
    rerenderTimeline(activeSession);
    renderBottomToolbar();
  } else if (message.action === "setActiveSession") {
    console.log(message.data);

    activeSession = message.data;
  }
});

function showToast(message) {
  const toastContainer = document.getElementById("toast-container");
  const toast = document.getElementById("toast");

  // Set the toast message
  toast.textContent = message;

  // Show the toast
  toastContainer.style.display = "block";

  // Trigger fade in after a short delay
  setTimeout(() => {
    toast.style.opacity = "1";
  }, 100);

  // Hide the toast and reset opacity after 5 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      toastContainer.style.display = "none";
    }, 500); // Wait for fade out animation to complete
  }, 5000);
}

function updateSessionName() {
  sessionNameDiv = document.getElementById("sessionName");

  sessionNameDiv.addEventListener("click", () => {
    sessionNameDiv.contentEditable = "true";
    sessionNameDiv.focus();
  });

  sessionNameDiv.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sessionNameDiv.contentEditable = "false";
      // Sanitize and set the content
      sessionNameDiv.innerHTML = sanitizeInput(sessionNameDiv.textContent);
    }
  });
}

// Sanitize user input
function sanitizeInput(input) {
  // Replace potentially harmful characters with safe ones
  return input.replace(/[&<>"'\/]/g, (char) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "/": "&#x2F;",
    };
    return replacements[char];
  });
}
