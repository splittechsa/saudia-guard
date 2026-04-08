// OAuth integration using Supabase
// This service provides OAuth redirects through Supabase only.

import { supabase } from "@/integrations/supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const oauth = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple" | "microsoft", opts?: SignInOptions) => {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: provider as "google" | "apple" | "github" | "gitlab" | "bitbucket" | "keycloak" | "discord" | "twitch" | "linkedin" | "linkedin_oidc" | "facebook" | "figma" | "notion" | "workos" | "kakao" | "spotify" | "slack" | "slack_oidc",
          options: {
            redirectTo: opts?.redirect_uri || window.location.origin,
          },
        });

        if (error) {
          return { error };
        }

        return { data };
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
    },
  },
};
