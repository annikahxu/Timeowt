//Event DOMContentLoaded fires when initial HTML document has been completely loaded and parsed
document.addEventListener("DOMContentLoaded", function () {
  //Get references to elements on HTML (extension on/off toggle switch, blocklist site input form, form submit button)
  var checkToggleswitch = document.getElementById("extonoff");
  var textinpt = document.getElementById("siteInpt");
  var inptButton = document.getElementById("inptButton");
  var blockButton = document.getElementById("blockthis");

  //Get reference to button container div
  var buttonContainer = document.getElementById("buttonContainer");

  //check local storage to see if extension was last turned on or off
  chrome.storage.local.get(["extOn"], (result) => {
    if (result.extOn == true) {
      //if extension is on, show toggle switch as "on" (checked) in popup
      document.getElementById("extonoff").checked = true;
    }
  });

  //get current list of blocked sites from local storage and creates blocklist if not already existing
  chrome.storage.local.get(["entryText"], (result) => {
    if (!result.entryText) {
      blocklist = [];
      chrome.storage.local.set({ entryText: blocklist });
    }
    blocklist = result.entryText;

    //Generate buttons with names of blocked sites
    generateButtons();
  });

  //check for change in toggle switch state, if on, send message to activate background script, if not, don't
  checkToggleswitch.addEventListener("change", function () {
    if (checkToggleswitch.checked) {
      chrome.runtime.sendMessage({ activateBackgroundJS: true });
    } else {
      chrome.runtime.sendMessage({ activateBackgroundJS: false });
    }
  });

  //check for submit button click (submitting new site url to be blocked)
  inptButton.addEventListener("click", function () {
    chrome.storage.local.get(["entryText"], (result) => {
      blocklist = result.entryText;
      //add new entry to list of blocked sites if not already blocked
      if (!blocklist.some((obj) => obj.url == textinpt.value)) {
        blocklist.push({ url: textinpt.value, id: generateUniqueId() });
        chrome.runtime.sendMessage({ newEntry: blocklist });
      }
    });
    //chrome.runtime.sendMessage({newEntry: textinpt.value})
  });

  //Block this button adds current url to blocklist
  blockButton.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var url = tabs[0].url;

      chrome.storage.local.get(["entryText"], (result) => {
        blocklist = result.entryText;

        // check that not already blocked
        if (!blocklist.some((obj) => obj.url == url)) {
          //add new entry to list of blocked sites
          blocklist.push({ url: url, id: generateUniqueId() });
          chrome.runtime.sendMessage({ newEntry: blocklist });
          generateButtons();
        }
      });
    });
  });

  function generateUniqueId() {
    const timestamp = Date.now(); // Current time in milliseconds
    const randomNum = Math.floor(Math.random() * 100000); // Random number between 0 and 99999
    return timestamp + randomNum;
  }

  function generateButtons() {
    /*
        Generates buttons based on blocklist 
        Parameters: None
        Returns: None 
        */

    buttonContainer.innerHTML = "";
    if (blocklist) {
      for (var i = 0; i < blocklist.length; i++) {
        //Create new button element
        var button = document.createElement("button");

        //Set the button's text
        button.innerHTML = blocklist[i].url;
        button.id = blocklist[i].id;
        console.log(blocklist[i]);
        button.className = "button";
        button.onclick = (function () {
          return function () {
            //on click, send message to background.js to delete site from blocklist + remove button interface from HTML container
            chrome.runtime.sendMessage({ deleteEntry: this.id });
            buttonContainer.removeChild(this);
          };
        })(blocklist[i]);
        // button.addEventListener('click',function(){
        //     alert(button.innerHTML);
        //     chrome.runtime.sendMessage({deleteEntry:button.innerHTML});
        // })

        //Append the button to the button container
        buttonContainer.appendChild(button);
      }
    }
  }
});
