console.log("content.js is loaded");

document.addEventListener("mouseup", function (event) {
  const target = event.target;
  const selection = window.getSelection();
  const selectionAsString = selection.toString().trim();
  const fullBodyText = document.body.innerText;

  if (selectionAsString.length > 0) {
    console.log(selectionAsString);

    data = {
      selectedText: selectionAsString,
      url: document.location.href,
      date: new Date(),
      fullBodyText: fullBodyText,
      type: "content",
    };

    try {
      chrome.runtime.sendMessage({ action: "contentCapture", data: data });
    } catch (e) {
      alert(e);
      console.error(e);
    }
  }
});
