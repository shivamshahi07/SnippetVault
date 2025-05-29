// This is a basic background script that can be extended later
// for features like notifications, sync, etc.

import { supabase } from "./lib/supabase";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Snippet Organizer extension installed");
});

// Listen for magic link redirects
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (
    details.url.includes("mcaeeokdepphhihomapknljdamhkkabf.chromiumapp.org")
  ) {
    const url = new URL(details.url);
    const accessToken = url.searchParams.get("access_token");
    const refreshToken = url.searchParams.get("refresh_token");

    if (accessToken && refreshToken) {
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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "initiate_github_login") {
    chrome.identity.launchWebAuthFlow(
      {
        url: `${
          import.meta.env.VITE_SUPABASE_URL
        }/auth/v1/authorize?provider=github`,
        interactive: true,
      },
      async (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          sendResponse({ error: "Failed to authenticate" });
          return;
        }

        // Extract the access token from the redirect URL
        const params = new URLSearchParams(redirectUrl.split("#")[1]);
        const accessToken = params.get("access_token");

        if (!accessToken) {
          sendResponse({ error: "No access token received" });
          return;
        }

        try {
          // Exchange the token with Supabase
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
              redirectTo: chrome.identity.getRedirectURL(),
            },
          });

          if (error) throw error;
          sendResponse({ data });
        } catch (error) {
          console.error("Auth error:", error);
          sendResponse({ error: "Authentication failed" });
        }
      }
    );
    return true; // Required for async response
  }
});
