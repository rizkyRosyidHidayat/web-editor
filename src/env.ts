import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
  PUBLIC_SUPABASE_URL: {
    static: true,
    public: true
  },
  PUBLIC_SUPABASE_PUBLISHABLE_KEY: {
    static: true,
    public: true
  }
})