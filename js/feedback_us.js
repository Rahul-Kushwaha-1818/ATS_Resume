import { handleNotNow, handleGiveFeedback } from "/js/feedback_utils.js";
import { trackEvent, trackPageView } from "/js/analytics.js";

$(document).ready(function () {
   trackPageView("feedback");
   $("#not_now").click(function () {
      trackEvent("feedback_us_page_not_now", { action: "click" });
      handleNotNow();
   });

   $("#feedbackLink").click(function () {
      trackEvent("feedback_us_page_click_through", { action: "click" });
      handleGiveFeedback(goToFeedbackForm);
   });
});

function goToFeedbackForm() {
   chrome.tabs.create({
      active: true,
      url: "https://docs.google.com/forms/d/e/1FAIpQLSe2lMzT8PJTTEFNL5cow6tZk0Z78pIFT6nSGDMbuDhUjYOyyQ/viewform",
   });
}
