console.log('sidepane.js is loaded')

sessionData = new Array();

// start session
document.addEventListener("DOMContentLoaded", onDOMContentLoaded)

function onDOMContentLoaded() {
    const startTimeDiv = document.getElementById("startTime");
    startTimeDiv.innerHTML = "Session started at " + new Date();

    // add session closing button
    const saveButton = document.createElement("button")
    saveButton.setAttribute('id', 'saveButton')
    saveButton.appendChild(document.createTextNode('Save Session'))
    saveButton.addEventListener("click", saveSession);

    const bottom = document.getElementById("bottom");
    bottom.appendChild(saveButton)
}

function saveSession() {
    if (sessionData.length) {
        chrome.runtime.sendMessage({ type: 'saveSession', data: sessionData });
    }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === 'contentCapture') {
        // disallow duplicates
        const isDuplicate = sessionData.some((item) =>
            item.url === message.data.url 
                && item.selectedText === message.data.selectedText
                && item.type === 'content'
        );

        if (isDuplicate === true) { return; }

        // append messages to sessionData, will later save when session complete
        sessionData.push(message.data)

        var content = message.data;

        addNewDivWithSeparator(content.selectedText)
    }
    else if (message.type === 'bookmarkCreated') {
        bookmark = message.data[0]

        // disallow duplicates, check for bookmark type only
        const isDuplicate = sessionData.some((item) =>
            item.url === bookmark.url && item.type === 'bookmark'
        );

        if (isDuplicate === true) { return; }

        // append messages to sessionData, will later save when session complete
        sessionData.push(bookmark)

        addNewDivWithSeparator(bookmark.url, true, bookmark.title)
    }
});

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
    const container = document.getElementById("container");

    if (container.children.length > 0) {
        const separator = createSeparator();
        container.appendChild(separator);
    }

    let newDiv = null

    if (makeLink === false) {
        newDiv = createDivWithText(text);
    }
    else {
        newDiv = createDivWithText("")

        const a = document.createElement('a')
        var link = document.createTextNode(title)
        a.appendChild(link)
        a.title = title
        a.href = text

        newDiv.appendChild(a)
    }

    container.appendChild(newDiv);
}