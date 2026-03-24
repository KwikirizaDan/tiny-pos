import { dark } from "@clerk/themes";

export const clerkAppearance: any = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#7c3aed",
    colorBackground: "#18181b",
    colorText: "#f8fafc",
    colorTextSecondary: "#94a3b8",
    colorInputBackground: "#09090b",
    colorInputText: "#f8fafc",
    colorTextOnPrimaryBackground: "#ffffff",
    fontFamily: "var(--font-mono)",
  },
  elements: {
    rootBox: "shadow-none w-full",
    cardBox: "shadow-none w-full",
    card: "bg-card/80 backdrop-blur-sm border border-border/50 shadow-2xl rounded-2xl w-full p-4",
    header: "items-center text-center mb-8",
    headerTitle: "text-foreground font-mono text-xl font-bold lowercase",
    headerSubtitle: "text-muted-foreground font-mono text-sm mt-1 lowercase",
    socialButtonsBlockButton: "bg-background/50 border border-border/50 hover:bg-accent/50 text-foreground font-mono rounded-lg transition-all h-12",
    socialButtonsBlockButtonText: "font-mono font-medium",
    dividerLine: "bg-border/30",
    dividerText: "text-muted-foreground font-mono text-xs lowercase px-4",
    formFieldLabel: "text-foreground font-mono text-sm mb-2 lowercase",
    formFieldInput: "bg-background/50 border-border/50 text-foreground rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono h-12",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-mono font-bold transition-all h-12 text-base",
    footer: "hidden",
    identityPreview: "bg-background/50 border-border/50 rounded-lg",
  },
};

export const clerkLocalization: any = {
  signIn: {
    start: {
      title: "sign in to pos",
      subtitle: "welcome back! please sign in to continue",
      actionPrimaryText: "continue ▸",
    },
  },
  signUp: {
    start: {
      title: "create account",
      subtitle: "join tinypos to start managing your store",
      actionPrimaryText: "continue ▸",
    },
  },
};

export const userButtonAppearance: any = {
  elements: {
    avatarBox: "w-8 h-8",
    userButtonPopoverCard: "rounded-none border border-border shadow-md",
    userButtonPopoverActionButton: "font-mono text-sm rounded-none hover:bg-accent",
  },
};
