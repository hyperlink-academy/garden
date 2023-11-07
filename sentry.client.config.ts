// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://7136d5316a754dcfa2edf00aa2e5d0ec@o4505908036173824.ingest.sentry.io/4505908040040448",

  allowUrls: [/https?:\/\/hyperlink\.academy/],
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,
  integrations: [
    new Sentry.Integrations.Breadcrumbs({
      console: false,
    }),
  ],
});
