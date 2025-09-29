"use client";

import { randomString, sha256 } from "@/lib/pkce";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  async function startLogin() {
    const state = randomString(24).replace(/[^A-Za-z0-9_-]/g, "");
    const code_verifier = randomString(64);
    const code_challenge = await sha256(code_verifier);

    localStorage.setItem("pkce_state", state);
    localStorage.setItem("pkce_verifier", code_verifier);

    const params = new URLSearchParams({
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}${process.env.NEXT_PUBLIC_REDIRECT_PATH || "/callback"}`,
      app_identifier: process.env.NEXT_PUBLIC_APP_IDENTIFIER || "",
      code_challenge,
      code_challenge_method: "S256",
      state,
    });
    
    const portal = process.env.NEXT_PUBLIC_AUTH_PORTAL_BASE;
    console.log('🔗 Redirecting to auth portal:', portal);
    console.log('📋 Login URL:', `${portal}/login?${params.toString()}`);
    
    window.location.href = `${portal}/login?${params.toString()}`;
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
