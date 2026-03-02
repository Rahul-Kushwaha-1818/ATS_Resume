const GA_MEASUREMENT_ID = "G-N7E5N8SE44";
const GA_API_SECRET = "InWAY3RXTE2aViio-Xhr8Q";
const GA_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const GA_DEBUG_ENDPOINT = "https://www.google-analytics.com/debug/mp/collect";

// Set to true to log validation messages from GA4 debug endpoint
const DEBUG_MODE = false;

// Session ID persists for 30 minutes of activity
let _sessionId = null;
let _sessionLastActive = 0;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function _getSessionId() {
   const now = Date.now();
   if (!_sessionId || now - _sessionLastActive > SESSION_TIMEOUT_MS) {
      _sessionId = String(Math.floor(now / 1000));
   }
   _sessionLastActive = now;
   return _sessionId;
}

function getClientId() {
   return new Promise((resolve) => {
      chrome.storage.local.get("ga_client_id", (data) => {
         if (data.ga_client_id) {
            resolve(data.ga_client_id);
         } else {
            const clientId = crypto.randomUUID();
            chrome.storage.local.set({ ga_client_id: clientId });
            resolve(clientId);
         }
      });
   });
}

// Detect if we're running in a content script (injected into a web page)
// vs an extension page (popup, scanner, result, etc.) or service worker.
// Content scripts can't fetch google-analytics.com directly due to ad blockers,
// so they relay events through the background service worker.
function _isContentScript() {
   try {
      // Extension pages have chrome-extension:// origin
      // Service worker has no window object
      // Content scripts have the web page's origin (https://www.linkedin.com, etc.)
      if (typeof window === "undefined") return false; // service worker
      return !location.protocol.startsWith("chrome-extension");
   } catch (e) {
      return false;
   }
}

async function trackEvent(eventName, eventParams = {}) {
   // Sanitize event params
   const cleanParams = {};
   for (const [key, value] of Object.entries(eventParams)) {
      if (value !== null && value !== undefined) {
         cleanParams[key] = String(value).substring(0, 100);
      }
   }

   // Add page_location so GA4 can determine user geography and page attribution
   try {
      if (typeof window !== "undefined" && window.location) {
         cleanParams.page_location = window.location.href.substring(0, 1000);
         cleanParams.page_title = (document.title || window.location.pathname).substring(0, 300);
      }
   } catch (e) {}

   const sanitizedName = eventName.substring(0, 40);

   // If we're in a content script, relay to background service worker
   if (_isContentScript()) {
      try {
         chrome.runtime.sendMessage({
            action: "analytics_event",
            eventName: sanitizedName,
            eventParams: cleanParams,
         });
         if (DEBUG_MODE) {
            console.log("[Jobalytics Analytics] Relayed to background:", sanitizedName, cleanParams);
         }
      } catch (err) {
         console.error("[Jobalytics Analytics] Relay error:", err);
      }
      return;
   }

   // Otherwise, send directly (extension pages & service worker)
   await _sendEvent(sanitizedName, cleanParams);
}

async function _sendEvent(eventName, cleanParams) {
   const clientId = await getClientId();

   const payload = {
      client_id: clientId,
      events: [
         {
            name: eventName,
            params: {
               ...cleanParams,
               session_id: _getSessionId(),
               engagement_time_msec: 10000,
            },
         },
      ],
   };

   const endpoint = DEBUG_MODE ? GA_DEBUG_ENDPOINT : GA_ENDPOINT;
   const url = `${endpoint}?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`;

   try {
      const response = await fetch(url, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload),
      });

      if (DEBUG_MODE) {
         const debugResult = await response.json();
         if (debugResult.validationMessages && debugResult.validationMessages.length > 0) {
            console.warn("[Jobalytics Analytics] Validation errors:", debugResult.validationMessages);
         } else {
            console.log("[Jobalytics Analytics] Event sent OK:", eventName, cleanParams);
         }
      }
   } catch (err) {
      console.error("[Jobalytics Analytics] Fetch error:", err);
   }
}

function trackPageView(pageName) {
   return trackEvent("page_view", { page_title: pageName });
}

// Called by background.js to handle relayed events from content scripts
async function handleRelayedEvent(message) {
   await _sendEvent(message.eventName, message.eventParams);
}

export { trackEvent, trackPageView, getClientId, handleRelayedEvent };
