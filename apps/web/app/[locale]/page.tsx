import {
  AlignLeft,
  Camera,
  Clapperboard,
  Copy,
  Download,
  FileEdit,
  Link as LinkIcon,
  ListVideo,
  Music2,
  Play,
  PlayCircle,
  Share2,
  ThumbsUp,
  Upload,
  Video,
  X as XIcon,
  Zap,
} from "lucide-react";
import { notFound } from "next/navigation";

import { getDictionary, isLocale } from "@pastescribe/i18n";
import { TranscribeBar, cx } from "@pastescribe/ui";

import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dict = getDictionary(locale);

  const platforms = [
    { key: "youtube", label: dict.home.platforms.youtube, Icon: PlayCircle },
    { key: "tiktok", label: dict.home.platforms.tiktok, Icon: Music2 },
    { key: "instagram", label: dict.home.platforms.instagram, Icon: Camera },
    { key: "facebook", label: dict.home.platforms.facebook, Icon: ThumbsUp },
    { key: "x", label: dict.home.platforms.x, Icon: XIcon },
    { key: "vimeo", label: dict.home.platforms.vimeo, Icon: Clapperboard },
    { key: "loom", label: dict.home.platforms.loom, Icon: Video },
    { key: "upload", label: dict.home.platforms.upload, Icon: Upload },
  ] as const;

  const features = [
    { ...dict.home.features[0], Icon: AlignLeft, span: true, decoration: "icon" },
    { ...dict.home.features[1], Icon: ListVideo, span: false, decoration: "none" },
    { ...dict.home.features[2], Icon: Share2, span: false, decoration: "none" },
    { ...dict.home.features[3], Icon: FileEdit, span: true, decoration: "document" },
  ] as const;

  return (
    <>
      <SiteHeader locale={locale} dict={dict} currentPath="" />
      <main className="flex flex-col items-center">
        {/* Hero */}
        <section className="hero-pattern flex w-full flex-col items-center border-b border-outline-variant px-4 pb-16 pt-24 text-center sm:px-12">
          <h1 className="mb-4 max-w-2xl text-balance text-4xl font-bold leading-tight tracking-tight text-on-background sm:text-5xl">
            {dict.home.heroTagline}
          </h1>
          <p className="mb-8 max-w-xl text-pretty text-lg leading-7 text-on-surface-variant">
            {dict.home.heroLead}
          </p>

          <div className="mb-8 w-full max-w-3xl">
            <TranscribeBar
              label={dict.home.transcribeLabel}
              hideLabel
              placeholder={dict.home.transcribePlaceholder}
              buttonLabel={dict.home.transcribeButton}
              buttonIcon={<Zap className="size-4" aria-hidden="true" />}
              leadingIcon={<LinkIcon className="size-5" aria-hidden="true" />}
              disabled
            />
            <p className="mt-2 text-sm text-on-surface-variant">
              {dict.home.transcribeDisabledHint}
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              {dict.home.platformsLabel}
            </span>
            <div className="flex flex-wrap justify-center gap-4 text-on-surface-variant opacity-70 sm:gap-6">
              {platforms.map(({ key, label, Icon }) => (
                <div key={key} className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Instant clarity — demonstração estática (não interativa; ver
            docs/DESIGN_SYSTEM.md sobre por que não hotlinkamos a foto
            de estoque do export original). */}
        <section className="w-full max-w-[1280px] px-4 py-12 sm:px-12">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-on-background sm:text-3xl">
              {dict.home.demoHeading}
            </h2>
            <p className="mt-2 text-lg text-on-surface-variant">{dict.home.demoLead}</p>
          </div>
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
            <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container p-4">
              <div className="mb-4 flex items-center justify-between" aria-hidden="true">
                <div className="flex gap-2">
                  <span className="size-3 rounded-full bg-error-container" />
                  <span className="size-3 rounded-full bg-surface-variant" />
                  <span className="size-3 rounded-full bg-surface-variant" />
                </div>
                <span className="font-mono text-xs text-on-surface-variant">{dict.home.demoUrl}</span>
              </div>
              <div
                aria-hidden="true"
                className="relative flex aspect-video w-full items-center justify-center rounded-lg border border-outline-variant bg-inverse-surface"
              >
                <div className="flex size-16 items-center justify-center rounded-full border border-outline-variant bg-surface/80 shadow-sm">
                  <Play className="ml-0.5 size-6 text-primary" fill="currentColor" />
                </div>
                <div className="absolute inset-x-4 bottom-4 h-1 overflow-hidden rounded-full bg-surface-variant/50">
                  <div className="h-full w-1/3 rounded-full bg-primary" />
                </div>
              </div>
            </div>

            <div className="relative flex h-[400px] flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-sm">
              <div className="z-10 flex items-center justify-between border-b border-outline-variant bg-surface-bright p-4">
                <div className="flex gap-4" aria-hidden="true">
                  <span className="border-b-2 border-primary pb-1 text-sm font-semibold text-primary">
                    {dict.home.demoTabs.transcript}
                  </span>
                  <span className="pb-1 text-sm font-semibold text-on-surface-variant">
                    {dict.home.demoTabs.summary}
                  </span>
                  <span className="pb-1 text-sm font-semibold text-on-surface-variant">
                    {dict.home.demoTabs.actionItems}
                  </span>
                </div>
                <div className="flex gap-2 text-outline" aria-hidden="true">
                  <Copy className="size-4" />
                  <Download className="size-4" />
                </div>
              </div>
              <div
                tabIndex={0}
                role="group"
                aria-label={dict.home.demoHeading}
                className="relative flex-grow space-y-6 overflow-y-auto p-6 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              >
                <div
                  aria-hidden="true"
                  className="absolute left-0 top-6 h-24 w-1 rounded-r-full bg-primary"
                />
                {dict.home.demoLines.map((line) => (
                  <div key={line.time} className="flex gap-4 pl-2">
                    <span className="w-12 shrink-0 pt-1 font-mono text-xs text-on-surface-variant">
                      {line.time}
                    </span>
                    <div>
                      <span className="mb-1 inline-block rounded bg-surface-container px-2 py-0.5 text-xs font-semibold text-on-secondary-fixed-variant">
                        {line.speaker}
                      </span>
                      <p className="text-base text-on-background">{line.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface to-transparent"
              />
            </div>
          </div>
        </section>

        {/* More than just transcription */}
        <section
          id="features"
          className="w-full border-y border-outline-variant bg-surface-container-low py-24"
        >
          <div className="mx-auto max-w-[1280px] px-4 sm:px-12">
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-on-background sm:text-3xl">
                {dict.home.featuresHeading}
              </h2>
              <p className="mt-2 max-w-2xl text-lg text-on-surface-variant">
                {dict.home.featuresLead}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:auto-rows-[240px] md:grid-cols-3">
              {features.map(({ title, description, Icon, span, decoration }) => (
                <div
                  key={title}
                  className={cx(
                    "relative flex flex-col justify-between overflow-hidden rounded-xl border border-outline-variant bg-surface p-6 shadow-sm",
                    span && "md:col-span-2"
                  )}
                >
                  <div className="relative z-10">
                    <span className="mb-4 inline-flex rounded-lg bg-primary-fixed p-2 text-primary">
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                    <h3 className="mb-2 text-lg font-semibold text-on-background">{title}</h3>
                    <p
                      className={cx(
                        "text-on-surface-variant",
                        span ? "max-w-md text-base" : "text-sm"
                      )}
                    >
                      {description}
                    </p>
                  </div>
                  {decoration === "icon" ? (
                    <Icon
                      aria-hidden="true"
                      className="pointer-events-none absolute -bottom-8 -right-8 size-48 text-primary opacity-[0.07]"
                    />
                  ) : null}
                  {decoration === "document" ? (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-0 right-0 w-56 translate-y-6 rounded-tl-xl border-l border-t border-outline-variant bg-surface-container p-4 shadow-sm"
                    >
                      <div className="mb-3 h-3 w-3/4 rounded bg-surface-variant" />
                      <div className="mb-2 h-2 w-full rounded bg-surface-variant" />
                      <div className="mb-2 h-2 w-5/6 rounded bg-surface-variant" />
                      <div className="h-2 w-full rounded bg-surface-variant" />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter dict={dict} />
    </>
  );
}
