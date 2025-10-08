"use client";

import { useEffect } from "react";
import { BASE_URL, REDIRECT_PATH, APP_IDENTIFIER } from "@/lib/config";

export default function Callback() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("authorization_code");
    const state = url.searchParams.get("state");
    const expected = localStorage.getItem("pkce_state");
    const code_verifier = localStorage.getItem("pkce_verifier");

    if (!code || !state || state !== expected || !code_verifier) {
      window.location.replace("/login");
      return;
    }

    fetch("/api/auth/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        code_verifier,
        redirect_uri: `${BASE_URL}${REDIRECT_PATH}`,
        app_identifier: APP_IDENTIFIER,
      }),
    })
      .then((r) => (r.ok ? "/" : "/login"))
      .then((dest) => {
        localStorage.removeItem("pkce_state");
        localStorage.removeItem("pkce_verifier");
        window.location.replace(dest);
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}
