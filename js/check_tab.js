import {
   getResumeString,
   waitForPageSourceThenScan,
   runGetPageSource,
} from "/js/util.js";

import { recordScan, maybeAskFeedback } from "/js/feedback_utils.js";
import { trackEvent } from "/js/analytics.js";

function _getSourceFromUrl(url) {
   var hostname = url.hostname || "";
   if (hostname.includes("linkedin.com")) return "linkedin";
   if (hostname.includes("indeed.com")) return "indeed";
   if (hostname.includes("glassdoor.com")) return "glassdoor";
   if (hostname.includes("myworkdayjobs.com")) return "workday";
   if (hostname.includes("joinhandshake.com")) return "handshake";
   return "other";
}

function save_tab(url) {
   chrome.storage.local.set({ jobalytics_data: url }, function () {
      // console.log('set up success');
   });
   chrome.storage.local.set({ scan_yet: true }, function () {});
}

function check_tab() {
   console.log("check tab called");
   var url;
   chrome.tabs.query(
      { active: true, lastFocusedWindow: true },
      function (tabs) {
         url = tabs[0].url;
         // console.log(url);
      }
   );
   chrome.storage.local.get(["jobalytics_data", "scan_yet"], function (result) {
      // console.log(result.jobalytics_data);
      // console.log(result.scan_yet);
      console.log("Local storage result", result);
      if (result.jobalytics_data == url && result.scan_yet) {
         url = new URL(url);
         trackEvent("scan_job_desc", { action: "click", page_url: url.hostname + url.pathname });
         trackEvent("resume_scan_url", { page_url: url.toString(), source: _getSourceFromUrl(url) });
         recordScan();
         waitForPageSourceThenScan();
         runGetPageSource();
         console.log("Inside if cond");
      } else {
         window.location.href = "/html/scanner.html";
      }
   });
}

export { save_tab, check_tab };
