import { handleNotNow, handleGiveFeedback } from "./feedback_utils.js";
import { trackEvent, trackPageView } from "/js/analytics.js";

$(document).ready(function () {
   trackPageView("review");
   $("#not_now").click(function () {
      trackEvent("review_us_page_not_now", { action: "click" });
      handleNotNow();
   });

   $("#reviewLink").click(function () {
      trackEvent("review_us_page_click_through", { action: "click" });
      handleGiveFeedback(goToReviewPage);
   });
});

function goToReviewPage() {
   var utm_params = "&utm_source=app&utm_medium=review_us";

   chrome.tabs.create({
      active: true,
      url:
         "http://chrome.google.com/webstore/detail/jobalytics-resume-keyword/fkiljfkkceaopbpfgfmjdnkiejaifkgd?hl=en" +
         utm_params,
   });
}
