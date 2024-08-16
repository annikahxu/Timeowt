chrome.runtime.onMessage.addListener(function (request) {
  //listen for incoming messages to execute provided callback function

  if (request.activateBackgroundJS) {
    console.log("extension on");
    //if request is to activate background, store local data that the extension is on
    chrome.storage.local.set({ extOn: true }).then(() => {
      console.log("Value is set to " + true);
    });
  } else if (request.activateBackgroundJS == false) {
    console.log("extension off");
    //if request is to deactivate background, store local data that the extension is off
    chrome.storage.local.set({ extOn: false }).then(() => {
      console.log("Value is set to " + false);
    });
  }

  //if request is to add a new entry to the list of blocked sites, store list with new entry in local storage
  if (request.newEntry) {
    console.log("enter clicked");
    //blocklist.push(request.newEntry)
    //chrome.storage.local.set({entryText: blocklist})
    chrome.storage.local.set({ entryText: request.newEntry });
    console.log(request.newEntry);
  }

  //if request is to delete an entry from list of blocked sites
  if (request.deleteEntry) {
    console.log(chrome.storage.local.get(["entryText"]));
    //get current blocklist from local storage
    chrome.storage.local.get(["entryText"], (result) => {
      console.log("here");

      console.log("id to delete", request.deleteEntry);
      console.log("arr", result.entryText);
      //   console.log("id", result.entryText[1].id);
      //get index of blocklist item that is to be deleted
      const delIndex = result.entryText.findIndex(
        (obj) => obj.id === parseInt(request.deleteEntry)
      );

      console.log("delindex", delIndex);

      if (delIndex > -1) {
        // only splice array when item is found
        //splice array and store new list in storage
        result.entryText.splice(delIndex, 1);
        console.log("entry deleted");
        chrome.storage.local.set({ entryText: result.entryText });
        console.log(result.entryText);
      }
    });
  }
});

//On switching to a different tab
chrome.tabs.onActivated.addListener(() => {
  setTimeout(() => {
    //Check to see if extension is on
    chrome.storage.local.get(["extOn"], (result) => {
      console.log("Value currently is " + result.extOn);

      if (result.extOn == true) {
        //Get list of sites to be blocked
        chrome.storage.local.get(["entryText"], (result2) => {
          console.log(result2.entryText);

          //If extension on

          chrome.tabs.query(
            { active: true, lastFocusedWindow: true, currentWindow: true },
            function (tabs) {
              var url = tabs[0].url;

              //check through blocklist and redirect user
              blockSite(url, result2.entryText, url.id);
            }
          );
        });
      }
    });
  }, 100);
});

//On entering a new URL
chrome.tabs.onUpdated.addListener((tabId, tab) => {
  //Check to see if extension is on
  chrome.storage.local.get(["extOn"], (result) => {
    console.log("Value currently is " + result.extOn);
    console.log("update", tab.url);
    //If extension on
    if (result.extOn == true) {
      //Get list of sites to be blocked
      chrome.storage.local.get(["entryText"], (result2) => {
        console.log("result 2", result2.entryText);

        //check through blocklist and redirect user
        blockSite(tab.url, result2.entryText, tabId);
      });
    }
  });
});

function blockSite(url, blocklist, tabId) {
  /*Checks through blocklist and redirects user
    Parameters:
        url: string 
        blocklist: string list
        tabId: int 
    Returns:
        None 
    */
  if (url) {
    for (var i = 0; i < blocklist.length; i++) {
      //check if each site from blocklist is contained within the url
      if (url.includes(blocklist[i].url)) {
        //prevents redirect loop by ending the redirect once the url has already changed
        var redirect =
          chrome.runtime.getURL("redirect.html") +
          "?url=" +
          encodeURIComponent(url);

        if (!url.includes("redirect.html?url=chrome-extension")) {
          chrome.tabs.update(tabId, { url: redirect });
          redirect = "";
        }
      }
    }
  }
}
