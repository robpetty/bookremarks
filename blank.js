console.log("blank.js is loaded");

// get all session data
// Send a message to the background script to request the saved JSON data
chrome.runtime.sendMessage({ action: "getAllSessions" }, (response) => {
  const sessions = response.sessions;

  if (sessions != undefined && sessions.length > 0) {
    const content = document.getElementById("content");

    sessions.forEach(function (session) {
      // add session name to top of session block
      const sessionHeaderDiv = document.createElement("div");
      sessionHeaderDiv.setAttribute("class", "sessionHeader");

      const p = document.createElement("p");
      p.innerText = session.sessionName;
      p.setAttribute("class", "sessionName");
      sessionHeaderDiv.appendChild(p);

      // add label to indicate the most recent session
      if (session.currentSession === 1) {
        const p = document.createElement("p");
        p.innerText = "(*)";
        p.setAttribute("class", "sessionHeaderActive");
        sessionHeaderDiv.appendChild(p);
      }

      content.appendChild(sessionHeaderDiv);

      // generate table for each session
      const table = document.createElement("table");
      const caption = document.createElement("caption");
      table.appendChild(caption);
      const thead = document.createElement("thead");
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      table.appendChild(tbody);
      content.appendChild(table);

      caption.innerText = `Last save at ${session.savedDate}`;

      // add header row
      addRow(thead, "key", "value");

      // add meta data
      addRow(tbody, "id (session id)", session.id);

      session.bookmarkData.forEach(function (bookmark) {
        addRow(tbody, "bookmark", bookmark.url);
      });

      session.contentData.forEach(function (data) {
        addRow(tbody, "content - url", data, true, false);
        addRow(tbody, "content - selected text", data.selectedText);
        addRow(tbody, "content - full text", data.fullBodyText, false, true);
      });

      hr = document.createElement("hr");
      hr.setAttribute("class", "hrstyle");
      content.appendChild(hr);
    });

    const collapsibleHeaders = document.querySelectorAll(".collapsible-header");

    collapsibleHeaders.forEach((header) => {
      header.addEventListener("click", function () {
        const content = this.nextElementSibling;
        content.style.display =
          content.style.display === "block" ? "none" : "block";
      });

      // By default, collapse the content
      const content = header.nextElementSibling;
      content.style.display = "none";
    });
  } else {
    const content = document.getElementById("content");

    noSessionFound = document.createElement("p");
    noSessionFound.innerText = "No session found in IndexedDB.";
    content.appendChild(noSessionFound);
  }
});

function addRow(
  element,
  column1Text,
  column2Text,
  addColumn2AsURL = false,
  addColumn2AsHTML = false
) {
  const row = document.createElement("tr");
  row.insertCell(0).innerText = column1Text;

  if (addColumn2AsURL === false && addColumn2AsHTML === false) {
    row.insertCell(1).innerText = column2Text;
  } else if (addColumn2AsURL === true && addColumn2AsHTML === false) {
    //url handling
    cell = row.insertCell(1);

    url = new URL(column2Text.url);

    const a = document.createElement("a");
    var link = document.createTextNode(column2Text.url);
    a.appendChild(link);
    a.title = url;
    a.innerText = url.origin + url.pathname; // strip query string from title
    a.href = column2Text.url;

    cell.appendChild(a);
  } else if (addColumn2AsURL === false && addColumn2AsHTML === true) {
    cell = row.insertCell(1);

    // add full text area
    d = document.createElement("div");
    d.setAttribute("class", "collapsible");

    d1 = document.createElement("div");
    d1.setAttribute("class", "collapsible-header");
    d1.innerText = "Click to Open";
    d.appendChild(d1);

    d2 = document.createElement("div");
    d2.setAttribute("class", "collapsible-content");
    d2.innerText = column2Text;
    d.appendChild(d2);

    cell.appendChild(d);
  }

  element.append(row);
}
