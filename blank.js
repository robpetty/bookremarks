// Send a message to the background script to request the saved JSON data
chrome.runtime.sendMessage({ action: "getSavedText" }, function (response) {
    const savedJSON = response.savedJSON;

    if (Object.keys(savedJSON).length == 0) {
        const content = document.getElementById("content");

        noSessionFound = document.createElement('p')
        noSessionFound.innerText = "No session found in local storage."
        content.appendChild(noSessionFound)

        return;
    }

    // Check if the JSON data exists in storage
    if (savedJSON) {
        // Parse and display the JSON data on the new tab (blank tab)
        //const parsedData = JSON.parse(savedJSON.savedText);
        const data = savedJSON.savedText;
        const jsonData = JSON.stringify(data)

        // Add your logic to display the JSON data on the new tab here
        console.log(jsonData);

        const content = document.getElementById("content");

        // console.log(data)

        data.forEach(function (item) {
            console.log("Processing items from storage")
            console.log(item)
            snippet = document.createElement('div')

            // format data items
            captureDate = document.createElement('p')
            captureDate.innerText = item.date
            snippet.appendChild(captureDate)

            url = document.createElement('p')
            url.innerText = item.url
            snippet.appendChild(url)

            selectedText = document.createElement('p')
            selectedText.innerText = item.selectedText
            snippet.appendChild(selectedText)

            fullBodyText = document.createElement('p')

            // strip text down
            processedFullText = collapseSpaces(removeNewlines(removeHTMLTags(item.fullBodyText)))
            
            fullBodyText.innerText = processedFullText.slice(-200)
            snippet.appendChild(fullBodyText)

            hr = document.createElement('hr')

            content.appendChild(snippet)
            content.appendChild(hr)
        });
    }
});

function removeNewlines(input) {
    return input.replace(/\n/g, "")
}

function removeHTMLTags(input) {
    return input.replace(/<[^>]*>/g, "");
}

function collapseSpaces(inputString) {
    return inputString.replace(/\s+/g, " ");
}