import { pdfParser, docxParser } from "/js/parser.js";
import {
   getResumeString,
   waitForPageSourceThenScan,
   runGetPageSource,
} from "/js/util.js";

import { save_tab } from "/js/check_tab.js";

import { recordScan } from "/js/feedback_utils.js";
import { trackEvent, trackPageView } from "/js/analytics.js";

function _getSourceFromUrl(url) {
   var hostname = url.hostname || "";
   if (hostname.includes("linkedin.com")) return "linkedin";
   if (hostname.includes("indeed.com")) return "indeed";
   if (hostname.includes("glassdoor.com")) return "glassdoor";
   if (hostname.includes("myworkdayjobs.com")) return "workday";
   if (hostname.includes("joinhandshake.com")) return "handshake";
   return "other";
}

document.addEventListener(
   "DOMContentLoaded",
   function () {
      trackPageView("scanner");
      addLinkedInLink();
      addIndeedLink();
      addGlassdoorLink();

      var reviewLink = document.getElementById("expert_resume_review");
      if (reviewLink) {
         reviewLink.addEventListener("click", function () {
            trackEvent("resume_review_click", { source_page: "scanner_page" });
         });
      }

      var resumeData = "";
      var resumeFilename = "";
      chrome.storage.local.get(["filename"], function (result) {
         if (result["filename"] != undefined) {
            document.getElementById("filename").innerHTML = result["filename"];
            resumeFilename = result["filename"];
         }
      });

      var scanButton = document.getElementById("scan");
      scanButton.addEventListener(
         "click",
         function () {
            chrome.tabs.query(
               { active: true, currentWindow: true },
               function (tabs) {
                  var url = new URL(tabs[0].url);
                  trackEvent("scan_job_desc", { action: "click", page_url: url.hostname + url.pathname });
                  trackEvent("resume_scan_url", { page_url: url.toString(), source: _getSourceFromUrl(url) });
                  save_tab(url.toString());
               }
            );

            recordScan();

            waitForPageSourceThenScan();
            runGetPageSource();
         },
         false
      );

      function displayResult() {
         // einstein's working upload functionality goes here

         if (resumeData != "") {
            chrome.storage.local.set({ resume: resumeData }, function () {});
            console.log("Resume data", resumeData);
            chrome.storage.local.set(
               { filename: resumeFilename },
               function () {}
            );

            var text = "";

            chrome.storage.local.get(["resume"], function (result) {
               text = result["resume"];
               if (text != undefined) {
                  window.location.href = "/html/scanner.html";
               }
            });
         } else {
            alert("error uploading resume. Please choose a docx or pdf file");
         }
      }

      $("#reupload").click(function () {
         chrome.storage.local.set({ scan_yet: false }, function () {}); //turn into not scan
         trackEvent("resume_upload", { action: "click" });
      });

      $("#reupload").on("change", function (evt) {
         var file = evt.target.files[0];
         //console.log(file.split('.'))
         var ext = file.name.split(".").pop();
         resumeFilename = file.name;
         //debug_printer.log("input file is: " + String(file))
         if (ext == "pdf") {
            //debug_printer.log("detected pdf")
            //Read the file using file reader
            var fileReader = new FileReader();

            fileReader.onload = function () {
               //debug_printer.log("pdf file content loaded")

               //Turn array buffer into typed array
               var typedarray = new Uint8Array(this.result);

               //calling function to read from pdf file
               pdfParser(typedarray).then(
                  function (text) {
                     //debug_printer.log("pdf file parsed, resume data is now: " + resumeData.substring(0, 20) + "...")

                     /*Selected pdf file content is in the variable text. */

                     resumeData = text;

                     displayResult();
                  },
                  function (
                     reason //Execute only when there is some error while reading pdf file
                  ) {
                     alert(
                        "Seems this file is broken, please upload another file"
                     );
                  }
               );
            };

            //debug_printer.log("starting to read pdf file")
            //Read the file as ArrayBuffer
            fileReader.readAsArrayBuffer(file);
         } else if (ext == "docx") {
            //debug_printer.log("docx file detected")
            //Csongor's code goes here
            function setResumeData(result) {
               //debug_printer.log("done parsing docx file")
               var myResume = result.value;
               chrome.storage.local.set({ resume: myResume }, function () {});
               chrome.storage.local.get("resume", function (obj) {
                  //resumeData = obj.resume;
                  // debug_printer.log("resumeData is now: " + resumeData.substring(0, 20) + "...")
               });
               console.log("resumeData is " + resumeData);
               resumeData = myResume;
               displayResult();
            }

            docxParser(setResumeData);
         } else {
            alert("Please only upload pdf or docx");
         }
      });
   },
   false
);

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
