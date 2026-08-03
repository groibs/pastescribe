export type DemoLine = {
  time: string;
  speaker: string;
  text: string;
};

export type Feature = {
  title: string;
  description: string;
};

export type PricingPlan = {
  name: string;
  priceMonthly: string;
  priceYearly: string;
  period: string;
  description: string;
  features: readonly string[];
  cta: string;
  badge?: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type Dictionary = {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    features: string;
    pricing: string;
    api: string;
    resources: string;
    signIn: string;
    getStarted: string;
    comingSoon: string;
    languageLabel: string;
  };
  home: {
    heroTagline: string;
    heroLead: string;
    transcribeLabel: string;
    transcribePlaceholder: string;
    transcribeButton: string;
    transcribeDisabledHint: string;
    platformsLabel: string;
    platforms: {
      youtube: string;
      tiktok: string;
      instagram: string;
      facebook: string;
      x: string;
      vimeo: string;
      loom: string;
      upload: string;
    };
    demoHeading: string;
    demoLead: string;
    demoUrl: string;
    demoTabs: {
      transcript: string;
      summary: string;
      actionItems: string;
    };
    demoLines: readonly DemoLine[];
    featuresHeading: string;
    featuresLead: string;
    features: readonly Feature[];
  };
  pricing: {
    heading: string;
    lead: string;
    draftNotice: string;
    billingMonthly: string;
    billingYearly: string;
    billingSave: string;
    plans: readonly PricingPlan[];
    creditsHeading: string;
    creditsBody: string;
    creditsCta: string;
    faqHeading: string;
    faq: readonly FaqItem[];
    payAsYouGoNotice: string;
  };
  footer: {
    brand: string;
    copyright: string;
    tools: string;
    platforms: string;
    privacy: string;
    terms: string;
    apiDocs: string;
    honesty: string;
  };
  auth: {
    heading: string;
    lead: string;
    notConfiguredTitle: string;
    notConfiguredBody: string;
    emailLabel: string;
    emailPlaceholder: string;
    magicLinkButton: string;
    magicLinkSending: string;
    magicLinkSentTitle: string;
    magicLinkSentBody: string;
    googleButton: string;
    dividerOr: string;
    passwordToggleShow: string;
    passwordToggleHide: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    passwordButton: string;
    passwordSigningIn: string;
    errorGeneric: string;
    errorCallback: string;
    backToHome: string;
  };
};

export const en: Dictionary = {
  meta: {
    title: "PasteScribe — Paste any video. Get useful text.",
    description:
      "Turn public video links and your own audio or video files into clean transcripts, subtitles, summaries and more. In active development.",
  },
  nav: {
    features: "Features",
    pricing: "Pricing",
    api: "API",
    resources: "Resources",
    signIn: "Sign In",
    getStarted: "Get Started Free",
    comingSoon: "Coming soon",
    languageLabel: "Language",
  },
  home: {
    heroTagline: "Paste any video. Get useful text.",
    heroLead:
      "The fastest, most accurate way to transcribe, summarize, and extract insights from media links. Professional grade AI, zero friction.",
    transcribeLabel: "Paste a video link",
    transcribePlaceholder: "Paste YouTube, TikTok, Vimeo, or Loom link here…",
    transcribeButton: "Transcribe",
    transcribeDisabledHint:
      "Not accepting links yet — the cost and security foundation comes first.",
    platformsLabel: "Supported platforms",
    platforms: {
      youtube: "YouTube",
      tiktok: "TikTok",
      instagram: "Instagram",
      facebook: "Facebook",
      x: "X",
      vimeo: "Vimeo",
      loom: "Loom",
      upload: "Upload",
    },
    demoHeading: "Instant clarity.",
    demoLead: "See how raw video turns into structured data.",
    demoUrl: "youtube.com/watch?v=…",
    demoTabs: {
      transcript: "Transcript",
      summary: "Summary",
      actionItems: "Action Items",
    },
    demoLines: [
      {
        time: "00:00",
        speaker: "Speaker 1",
        text: "Welcome to today's architecture review. We're going to cover the new deployment strategy and how it impacts latency across the primary nodes.",
      },
      {
        time: "00:15",
        speaker: "Speaker 2",
        text: "I've reviewed the proposal. The orchestration looks solid, but I have a few concerns regarding cold start times for the edge functions.",
      },
      {
        time: "00:28",
        speaker: "Speaker 1",
        text: "That's a valid point. We've implemented a pre-warming strategy that should mitigate those spikes.",
      },
    ],
    featuresHeading: "More than just transcription.",
    featuresLead:
      "Turn raw audio into structured assets ready for publishing, sharing, or analysis.",
    features: [
      {
        title: "Executive Summaries",
        description:
          "Instantly generate high-level overviews, key takeaways, and bulleted lists from hour-long meetings or podcasts.",
      },
      {
        title: "Smart Chapters",
        description:
          "Automatically segment your video with clickable timestamps based on topic changes.",
      },
      {
        title: "Seamless Export",
        description: "Export to Notion, Google Docs, PDF, or raw JSON for your developer workflows.",
      },
      {
        title: "Blog Articles",
        description:
          "Transform a talking-head video into a fully formatted, SEO-ready blog post with headings and paragraphs.",
      },
    ],
  },
  pricing: {
    heading: "Simple, Transparent Pricing",
    lead: "Choose the plan for your transcription needs. Upgrade, downgrade, or cancel anytime.",
    draftNotice:
      "Draft pricing — illustrative only. Final values depend on real usage data and are not yet approved.",
    billingMonthly: "Monthly",
    billingYearly: "Yearly",
    billingSave: "Save 20%",
    plans: [
      {
        name: "Free",
        priceMonthly: "$0",
        priceYearly: "$0",
        period: "/mo",
        description: "For casual users",
        features: ["15 mins/mo", "Basic transcription", "TXT export"],
        cta: "Current Plan",
      },
      {
        name: "Creator",
        priceMonthly: "$19",
        priceYearly: "$15",
        period: "/mo",
        description: "For content creators",
        features: ["300 mins/mo", "AI summaries", "All export formats", "Speaker ID"],
        cta: "Get Started",
        badge: "Most Popular",
      },
      {
        name: "Pro",
        priceMonthly: "$49",
        priceYearly: "$39",
        period: "/mo",
        description: "For professionals & teams",
        features: ["1,200 mins/mo", "Translation", "API access", "Priority processing"],
        cta: "Get Started",
      },
    ],
    creditsHeading: "Need more minutes occasionally?",
    creditsBody: "Buy a credits pack: 100 minutes for $10. No expiration date.",
    creditsCta: "Buy Credits",
    faqHeading: "Frequently Asked Questions",
    faq: [
      {
        question: "Can I cancel my subscription anytime?",
        answer:
          "Yes. Cancel from your account settings whenever you like — you keep access until the end of the billing period, and you're never charged again after that.",
      },
      {
        question: "What happens if I run out of minutes?",
        answer:
          "You'll see your remaining balance before it runs out. You can finish the video you're on, buy a credits pack, or upgrade your plan — nothing is charged automatically without your action.",
      },
      {
        question: "Is my data secure?",
        answer:
          "Your media is processed and deleted on a short retention window; transcripts stay private until you choose to share them. See our security and privacy pages for details.",
      },
    ],
    payAsYouGoNotice: "No subscription required for pay-as-you-go",
  },
  footer: {
    brand: "PasteScribe",
    copyright: "© {year} PasteScribe. All rights reserved.",
    tools: "Tools",
    platforms: "Platforms",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    apiDocs: "API Documentation",
    honesty:
      "Works with public videos from compatible sources or files you upload. No private content, no DRM bypass.",
  },
  auth: {
    heading: "Sign in to PasteScribe",
    lead: "Use a magic link, Google, or a password — whichever you prefer.",
    notConfiguredTitle: "Sign-in isn't connected yet",
    notConfiguredBody:
      "This environment doesn't have a real Supabase project configured, so sign-in is disabled here. The page and its flows are fully built and ready for real credentials.",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    magicLinkButton: "Send magic link",
    magicLinkSending: "Sending…",
    magicLinkSentTitle: "Check your email",
    magicLinkSentBody:
      "We sent a sign-in link to {email}. Click it to continue — you can close this tab.",
    googleButton: "Continue with Google",
    dividerOr: "or",
    passwordToggleShow: "Use a password instead",
    passwordToggleHide: "Use a magic link instead",
    passwordLabel: "Password",
    passwordPlaceholder: "Your password",
    passwordButton: "Sign in",
    passwordSigningIn: "Signing in…",
    errorGeneric: "Something went wrong. Please try again.",
    errorCallback: "That sign-in link is invalid or expired. Request a new one below.",
    backToHome: "Back to home",
  },
};
