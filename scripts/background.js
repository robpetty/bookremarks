console.log('background.js is loaded')

// clear the storage on installation
// also is removed on extension removal
chrome.storage.local.remove("savedText", function () {
    console.log('savedText removed successfully from local storage.');
});

// capture bookmark creation (id is bookmark or folder)
// handle these differently then captured text
chrome.bookmarks.onCreated.addListener((id) => {
    console.log("chrome.bookmarks.onCreated")
    console.log(id)

    let data = null

    chrome.bookmarks.get(id, (result) => {
        data = result
        console.log('get bookmark by id ' + data)
        console.log(JSON.stringify(data))
    })

    // Bad code, sometimes array, sometimes not
    try {
        data[0].type = "bookmark"
        console.log('was ok')
    }
    catch (e) {
        //console.error(e)
        //console.log('Not array this time, placing directly on object')
        //console.log(typeof(data))
        //console.log(JSON.stringify(data))

        data.type = "bookmark"
    }

    // send bookmark message to add to session timeline
    console.log(data)
    chrome.runtime.sendMessage({ type: 'bookmarkCreated', data: data });
});

// save our data
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === 'saveSession') {
        sessionData = message.data
        console.log('saving session ' + sessionData)

        chrome.storage.local.set({ 'savedText': sessionData }).then(() => {
            console.log("Content saved to Chrome local database.");
        });

        console.log("saving " + JSON.stringify(message.selectedText))
    }
    else if (message.action === "getSavedText") {
        // Use chrome.storage.local to get the saved JSON data
        chrome.storage.local.get('savedText', (result) => {
            console.log('retrieving session data from local storage')
            sendResponse({ savedJSON: result });
        });

        // Indicate the asynchronous operation is being handled
        return true;
    }
});