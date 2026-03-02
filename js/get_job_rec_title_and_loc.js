var _analyticsModule = null;
async function _getAnalytics() {
   if (!_analyticsModule) {
      _analyticsModule = await import(chrome.runtime.getURL("/js/analytics.js"));
   }
   return _analyticsModule;
}
async function trackEvent(eventName, eventParams) {
   const analytics = await _getAnalytics();
   return analytics.trackEvent(eventName, eventParams);
}

function get_job_title_and_location_linkedin() {
   var search_title = "";
   var loc = "";

   // logged out linkedin search, by element
   var logged_out_error = false;
   try {
      var forms = document.getElementsByClassName("base-search-bar__form");
      var search_form = Array.from(forms).filter((form) =>
         form.action.includes("/jobs/search")
      )[0];
      var title_input = search_form.children[0].children[0];
      if (title_input.tagName == "INPUT" && title_input.type == "search") {
         search_title = title_input.value;
      }

      var loc_input = search_form.children[1].children[0];
      if (loc_input.tagName == "INPUT" && loc_input.type == "search") {
         loc = loc_input.value;
      }

      // console.log("linkedin logged out elm search_title, loc: " + [search_title, loc])
   } catch (err) {
      logged_out_error = true;
      // console.log("linkedin logged out elm search exception: " + err.toString())
      trackEvent("job_recommendation", { status: "fail_parse_title_loc_elm_logged_out", error: err.toString() });
   }

   // logged in linkedin search, by element
   if (logged_out_error) {
      try {
         var search_input_divs = document.getElementsByClassName(
            "jobs-search-box__input"
         );
         var title_div = search_input_divs[0];
         var loc_div = search_input_divs[1];

         search_title = title_div.getElementsByClassName(
            "jobs-search-box__text-input"
         )[0].value;
         loc = loc_div.getElementsByClassName("jobs-search-box__text-input")[0]
            .value;

         // console.log("linkedin logged in elm search_title, loc: " + [search_title, loc])
      } catch (err) {
         // console.log("linkedin logged in elm search exception: " + err.toString())
         trackEvent("job_recommendation", { status: "fail_parse_title_loc_elm_logged_in", error: err.toString() });
      }
   }

   return [search_title, loc];
}

// -------- MAIN LOOP

var title = "";
var loc = "";

if (get_supported_page() == "linkedin_job_search") {
   var result = get_job_title_and_location_linkedin();
   // console.log("get_job_title_location_script_result: " + result)
   title = result[0];
   loc = result[1];
}

if (title != "" && loc != "") {
   chrome.runtime.sendMessage({
      action: "job_rec_title_and_loc",
      search_title: title.toLowerCase(),
      loc: loc.toLowerCase(),
   });
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
   /* If the received message has the expected format... */
   if (msg.text == "report_back") {
      /* Call the specified callback, passing
           the web-pages DOM content as argument */
      let title = document.getElementById("sc.keyword").value;
      let loc = document.getElementById("sc.location").value;
      sendResponse([title, loc]);
   }
});
