export type Dictionary = {
  meta: {
    title: string;
    description: string;
  };
  home: {
    tagline: string;
    lead: string;
    statusHeading: string;
    statusBody: string;
    valuesHeading: string;
    values: readonly string[];
    languageLabel: string;
  };
  footer: {
    honesty: string;
  };
};

export const en: Dictionary = {
  meta: {
    title: "PasteScribe — Paste any video. Get useful text.",
    description:
      "Turn public video links and your own audio or video files into clean transcripts, subtitles, summaries and more. In active development.",
  },
  home: {
    tagline: "Paste any video. Get useful text.",
    lead: "PasteScribe turns public videos from compatible sources — or files you upload — into transcripts, subtitles, summaries, chapters and translations you can actually use.",
    statusHeading: "Being built in the open",
    statusBody:
      "PasteScribe is under active development and is not accepting transcriptions yet. The foundation — cost governance, security and a real editor — comes first.",
    valuesHeading: "What it will do",
    values: [
      "Transcripts with timestamps and speakers",
      "SRT, VTT, TXT, Markdown, DOCX, PDF and JSON export",
      "Summaries, chapters, quotes and translations",
      "Clear pricing: free taste, pay per video, credits or plans",
    ],
    languageLabel: "Language",
  },
  footer: {
    honesty:
      "Works with public videos from compatible sources or files you upload. No private content, no DRM bypass.",
  },
};
