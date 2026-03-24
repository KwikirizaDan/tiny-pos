"use client";

import { SignUp } from "@clerk/nextjs";

export function SignUpForm() {
  return (
    <div className="flex flex-col gap-4 auth-clerk-container">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold font-mono text-center uppercase tracking-tighter">
          Join Tiny<span className="text-primary">POS</span>
        </h2>
        <p className="text-sm text-muted-foreground font-mono text-center">
          Create an account to start managing your shop
        </p>
      </div>
      <SignUp
        appearance={{
          layout: {
            logoPlacement: "none",
            shimmer: true,
          },
          variables: {
            colorBackground: "transparent",
            boxShadow: "none",
            borderRadius: "0",
          },
          elements: {
            rootBox: "w-full",
            cardBox: "w-full shadow-none",
            card: "shadow-none border-none p-0 bg-transparent w-full",
            header: "hidden",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            footer: "hidden",
            footerAction: "hidden",
            internal: "hidden",
            footerPages: "hidden",
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
    </div>
  );
}
