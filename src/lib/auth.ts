import { supabase } from "./supabase";

export async function getWebsiteAuthTokens() {
  try {
    // Get the website's domain from environment variable or default
    const websiteDomain =
      import.meta.env.VITE_WEBSITE_URL || "http://localhost:3000";
    console.log("Getting tokens from domain:", websiteDomain);

    // Send a message to the background script to get tokens from the website
    const response = await new Promise<any>((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "get_website_tokens",
          domain: websiteDomain,
        },
        (response) => {
          console.log("Token response:", response);
          resolve(response);
        }
      );
    });

    if (response?.error) {
      console.error("Token error:", response.error);
      throw new Error(response.error);
    }

    return response?.data;
  } catch (error) {
    console.error("Error getting website tokens:", error);
    return null;
  }
}

export async function fetchUserSnippets() {
  try {
    const tokens = await getWebsiteAuthTokens();
    if (!tokens) {
      return { error: "Not authenticated. Please log in on the website." };
    }

    console.log("Setting session with tokens");
    // Set the auth tokens in the Supabase client
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    if (sessionError) {
      console.error("Session error:", sessionError);
      return { error: "Failed to set session" };
    }

    if (!session) {
      console.error("No session after setting tokens");
      return { error: "Invalid session" };
    }

    console.log("Fetching snippets for user:", session.user.id);
    // Fetch the top 3 most recent snippets
    const { data: snippets, error } = await supabase
      .from("snippets")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) {
      console.error("Snippets error:", error);
      return { error: error.message };
    }

    return { data: snippets };
  } catch (error) {
    console.error("Error fetching snippets:", error);
    return { error: "Failed to fetch snippets" };
  }
}
