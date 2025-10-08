"use client";

import { randomString, sha256 } from "@/lib/pkce";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AUTH_PORTAL_URL, BASE_URL, REDIRECT_PATH, APP_IDENTIFIER } from "@/lib/config";

export default function Login() {
  async function startLogin() {
    const state = randomString(24).replace(/[^A-Za-z0-9_-]/g, "");
    const code_verifier = randomString(64);
    const code_challenge = await sha256(code_verifier);

    localStorage.setItem("pkce_state", state);
    localStorage.setItem("pkce_verifier", code_verifier);

    const params = new URLSearchParams({
      redirect_uri: `${BASE_URL}${REDIRECT_PATH}`,
      app_identifier: APP_IDENTIFIER,
      code_challenge,
      code_challenge_method: "S256",
      state,
    });
    
    console.log('🔗 Redirecting to auth portal:', AUTH_PORTAL_URL);
    console.log('📋 Login URL:', `${AUTH_PORTAL_URL}/login?${params.toString()}`);
    
    window.location.href = `${AUTH_PORTAL_URL}/login?${params.toString()}`;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">App CS Airflow</CardTitle>
          <p className="text-muted-foreground">Customer Success Portal</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Sign in to manage Airflow configurations and Power BI reports
          </p>
          <Button onClick={startLogin} className="w-full">
            Continue with Intelligence Industrielle
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
