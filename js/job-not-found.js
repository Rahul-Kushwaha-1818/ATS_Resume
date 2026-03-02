// add the Indeed and LinkedIn redirect links
document.addEventListener("DOMContentLoaded", function () {
   addLinkedInLink();
   addIndeedLink();
   addGlassdoorLink();
   // Google Analytics Could Not Scan Event
   couldNotScan();
});

function addLinkedInLink() {
   document
      .getElementById("linkedinLink")
      .addEventListener("click", function () {
         chrome.tabs.create({
            active: true,
            url: "https://www.linkedin.com/jobs/",
         });
      });
}

function addIndeedLink() {
   document.getElementById("indeedLink").addEventListener("click", function () {
      chrome.tabs.create({ active: true, url: "https://indeed.com" });
   });
}

function addGlassdoorLink() {
   document
      .getElementById("glassdoorLink")
      .addEventListener("click", function () {
         chrome.tabs.create({
            active: true,
            url: "https://www.glassdoor.com/",
         });
      });
}

import { trackEvent, trackPageView } from "/js/analytics.js";
trackPageView("job_not_found");
function couldNotScan() {
   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var url = new URL(tabs[0].url);
      trackEvent("could_not_scan", { action: "click", page_url: url.toString() });
      save_tab(url.toString());
   });
}
