// This is a basic background script that can be extended later
// for features like notifications, sync, etc.

import { supabase } from "./lib/supabase";

// Log that the script is loaded
console.log("Background script loaded at:", new Date().toISOString());

// Create a wake lock to keep the service worker active
let wakeLock: any = null;

// Function to keep the service worker alive
const keepAlive = () => {
  // Reset the wake lock every minute
  setInterval(() => {
    console.log("Keeping service worker alive:", new Date().toISOString());
    if (wakeLock) {
      wakeLock.release();
    }
    navigator.wakeLock
      ?.request("screen")
      .then((lock) => {
        wakeLock = lock;
      })
      .catch((err) => console.error("Wake lock error:", err));
  }, 60000);
};

// Initialize wake lock
keepAlive();

// Keep track of active sessions
const activeSessions = new Set();

// Log when extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Extension event:", details.reason);
  console.log("GitHub Redirect URL:", chrome.identity.getRedirectURL());
});

// Listen for connections to keep service worker active
chrome.runtime.onConnect.addListener((port) => {
  const sessionId = Date.now();
  console.log("New connection established:", sessionId);
  activeSessions.add(sessionId);

  port.onDisconnect.addListener(() => {
    console.log("Connection closed:", sessionId);
    activeSessions.delete(sessionId);
  });
});

// Listen for magic link redirects
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  console.log("Navigation detected:", details.url);

  if (
    details.url.includes("mcaeeokdepphhihomapknljdamhkkabf.chromiumapp.org")
  ) {
    console.log("Processing auth redirect");
    const url = new URL(details.url);
    const accessToken = url.searchParams.get("access_token");
    const refreshToken = url.searchParams.get("refresh_token");

    if (accessToken && refreshToken) {
      console.log("Tokens found, setting session");
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error("Error setting session:", error);
      } else {
        console.log("Successfully set session:", data);
      }
    }
  }
});

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background script:", {
    type: message.type,
    sender: sender.id,
    timestamp: new Date().toISOString(),
  });

  // INSIDE chrome.runtime.onMessage
  if (message.type === "initiate_github_login") {
    console.log("Starting GitHub login flow");

    (async () => {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "github",
          options: {
            redirectTo: chrome.identity.getRedirectURL(),
          },
        });

        if (error) {
          console.error("Supabase OAuth error:", error);
          return sendResponse({ error: error.message });
        }

        console.log("OAuth flow initiated:", data);

        chrome.identity.launchWebAuthFlow(
          {
            url: data.url,
            interactive: true,
          },
          async (redirectUrl) => {
            if (chrome.runtime.lastError || !redirectUrl) {
              console.error(
                "Auth error or empty redirect URL",
                chrome.runtime.lastError
              );
              return sendResponse({ error: "OAuth failed" });
            }

            try {
              const url = new URL(redirectUrl);
              const code = url.searchParams.get("code");

              if (!code) {
                console.error("Missing code in redirect URL");
                return sendResponse({ error: "Missing code in redirect URL" });
              }

              const { data: sessionData, error: sessionError } =
                await supabase.auth.exchangeCodeForSession(code);

              if (sessionError) {
                console.error("Session exchange error:", sessionError);
                return sendResponse({ error: sessionError.message });
              }

              console.log("Session set successfully", sessionData);

              // Ensure the response is sent before the service worker dies
              Promise.resolve().then(() => sendResponse({ data: sessionData }));
            } catch (err) {
              console.error("Unexpected auth error", err);
              sendResponse({ error: "Failed to process auth" });
            }
          }
        );
      } catch (err) {
        console.error("Login error:", err);
        sendResponse({ error: "Unknown login error" });
      }
    })();

    return true; // 👈 keeps the message channel alive
  }

  if (message.type === "get_website_tokens") {
    const url = message.domain;
    console.log("Getting cookies for URL:", url);

    // Check if chrome.cookies API is available
    if (typeof chrome === "undefined" || !chrome.cookies) {
      console.error(
        "Chrome cookies API not available. Extension context:",
        chrome?.runtime?.id
      );
      sendResponse({
        error: "Cookie API not available. Please reload the extension.",
      });
      return true;
    }

    // Get access token cookie
    try {
      chrome.cookies.getAll(
        {
          url: url,
        },
        (allCookies) => {
          console.log("All cookies for domain:", allCookies);

          const accessCookie = allCookies.find(
            (c) => c.name === "snippet-organizer-token"
          );
          const refreshCookie = allCookies.find(
            (c) => c.name === "snippet-organizer-refresh"
          );

          if (!accessCookie) {
            console.log("No access token cookie found");
            sendResponse({
              error: "No auth tokens found. Please log in on the website.",
            });
            return;
          }

          if (!refreshCookie) {
            console.error("No refresh token found");
            sendResponse({ error: "Refresh token not found" });
            return;
          }

          console.log("Found cookies:", {
            hasAccessToken: !!accessCookie,
            hasRefreshToken: !!refreshCookie,
            accessTokenValue: accessCookie.value.substring(0, 10) + "...",
            refreshTokenValue: refreshCookie.value.substring(0, 10) + "...",
          });

          sendResponse({
            data: {
              access_token: accessCookie.value,
              refresh_token: refreshCookie.value,
            },
          });
        }
      );
    } catch (error: any) {
      console.error("Unexpected error accessing cookies:", error);
      sendResponse({ error: "Unexpected error: " + error.message });
    }

    return true; // Keep the message channel open for async response
  }
});
