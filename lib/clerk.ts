import { dark } from "@clerk/themes";

export const clerkAppearance: any = {
  baseTheme: dark,
};

export const clerkLocalization: any = {
  // Let default localization take over, or keep minimal if needed
};

export const userButtonAppearance: any = {
  baseTheme: dark,
  elements: {
    avatarBox: "w-8 h-8",
    userButtonPopoverCard: "rounded-none border border-border shadow-md",
    userButtonPopoverActionButton: "font-mono text-sm rounded-none hover:bg-accent",
  },
};