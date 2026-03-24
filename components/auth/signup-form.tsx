"use client";

import { SignUp } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SignUpForm() {
  return (
    <Card className="rounded-none border-border shadow-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold font-mono text-center uppercase tracking-tighter">Join Tiny<span className="text-primary">POS</span></CardTitle>
        <CardDescription className="text-center">
          Create an account to start managing your shop
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-none p-0 bg-transparent",
              header: "hidden",
              footer: "hidden",
              formButtonPrimary:
                "bg-primary hover:bg-primary/90 text-primary-foreground rounded-none font-mono w-full shadow-none",
              formFieldInput:
                "bg-background border-border text-foreground rounded-none focus:border-primary focus:ring-0",
              formFieldLabel: "text-foreground font-mono text-xs uppercase tracking-wider",
              identityPreviewText: "text-foreground",
              identityPreviewEditButtonIcon: "text-primary",
              formResendCodeLink: "text-primary hover:text-primary/90",
              otpCodeFieldInput: "border-border focus:border-primary rounded-none",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
              socialButtonsBlockButton: "border-border rounded-none hover:bg-accent text-foreground",
              socialButtonsBlockButtonText: "font-mono",
            },
          }}
        />
      </CardContent>
    </Card>
  );
}
