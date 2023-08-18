console.log("timelineRenderer.js is loaded");

let session = undefined;

function rerenderTimeline(activeSession) {
  if (activeSession != undefined) {
    session = activeSession;

    // render activity view asc so most recent activity on top
    renderActivity("ASC");
  }
}

function renderActivity(direction = "ASC") {
  // Maybe not best way to reset the container div
  const container = document.getElementById("timeline");
  container.innerHTML = "";

  // grab content and bookmarks, order in one object
  let map = new Map();

  let mergedData = session.bookmarkData.concat(session.contentData);

  if (direction === "ASC") {
    mergedData = mergedData.sort(
      (record1, record2) => record2.dateAdded - record1.dateAdded
    );
  } else {
    mergedData = mergedData.sort(
      (record1, record2) => record1.dateAdded - record2.dateAdded
    );
  }

  mergedData.forEach(function (data) {
    if (data.type === "bookmark") {
      addNewDivWithSeparator(data.url, true, data.title);
    }

    if (data.type === "content") {
      addNewDivWithSeparator(data.selectedText);
    }
  });
}

function createDivWithText(text) {
  const div = document.createElement("div");

  div.className = "box";
  div.textContent = text;

  return div;
}

function createSeparator() {
  const separator = document.createElement("div");
  separator.className = "separator-bar";

  return separator;
}

function addNewDivWithSeparator(text, makeLink = false, title = "") {
  const container = document.getElementById("timeline");

  if (container.children.length > 0) {
    const separator = createSeparator();
    container.appendChild(separator);
  }

  let newDiv = null;

  if (makeLink === false) {
    newDiv = createDivWithText(text);
  } else {
    newDiv = createDivWithText("");

    const a = document.createElement("a");
    var link = document.createTextNode(title);
    a.appendChild(link);
    a.title = title;
    a.href = text;

    newDiv.appendChild(a);
  }

  container.appendChild(newDiv);
}
