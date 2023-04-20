# hyperlink-academy

Hi! Welcome to the codebase for Hyperlink's web app.

Hyperlink is an app for small groups of people to learn and make things together on the internet.

The main container for people to do things is a Space, which we store as a self-contained Cloudflare Durable Object. Data about its contents — cards, members, discussions, references — is all stored within that Durable Object. Data for user accounts and other global metadata lives in Supabase.

Here's the data model for within a Space, TL;DR version:

- facts: a single unit of data, like a row in a database, but always with the same three columns: `entity`, `attribute`, and `value`
  - entity: a unique ID
  - attribute: a property name
  - value: the actual value, of a type specified by the attribute
  - (to see all the attributes, look in `data/Attributes.ts`)
- useIndex: the React hook we use to read a Space's data from React components
  - there are a number of different indexes for different data access patterns
  - you can see the ones we use in `hooks/useReplicache.ts`
- mutations: named functions for updating data
  - you can see all the mutations in `data/mutations.ts`
  - there's another React hook `useMutations` in `hooks/useReplicache.ts` for calling mutations from React components, which also returns other useful things for writing data, auth, etc.

## Important Dependencies

These are the main technologies we use:

- **[Typescript](https://www.typescriptlang.org/)** because we're hype for types
- **[React](https://react.dev/)** & **[Next.js](https://nextjs.org/)** for UI and app framework
- **[Cloudflare Workers](https://workers.cloudflare.com/)**, in particular Durable Objects as data stores for each Hyperlink Space
- **[Supabase](https://supabase.com/)** for auth, account data, other medatada storage
- **[Replicache](https://replicache.dev/)** for realtime data syncing, to power multiplayer collaboration in Spaces
- **[TailwindCSS](https://tailwindcss.com/)** for frontend styling magic

## Structure

- `/pages`: these are different routes that can be rendered; if a file has a name in
    brackets, like `[studio].tsx`, that means it's a dynamic route
- `/components`: every file here exports React components used by files in
    `/pages` or by other components
- `/hooks`: every file here exports React hooks that encapsulate logic and
    side effects
- `/backend`: this folder contains an `index.ts` file that defines a Cloudflare
    Worker, as well as a Durable Object class defining a Space
- `/data`: this folder contains data and types that are shared across the front and
    backend as well as mutations for updating them
- `/src`: additional helper functions
- `/public` and `/styles`: static files and styles (for miles!)
- `/supabase`: stores migrations (should never have to write those directly)

## Configuring your dev environment

First, install node / npm and Docker. Run `npm i` to make sure all dependencies are installed.

Local dev environment needs three things running:

- frontend: `npm run dev`
- cloudflare: `npm run wranger-dev`
- supabase: `npm run supabase-dev`

(Note these are aliases set in `package.json` --> `scripts`)

The first time you start up supabase it will take a while to first download the Docker images it needs and then start the containers. If you're running the Docker Desktop app, Supabase should start automatically while it's running (so you may not need that third command each time).

You also need two files with local environment variables:

- `.dev.vars` for Cloudflare Wrangler:
  - SUPABASE_API_TOKEN - this is the `service_role key` from supabase start
  - SUPABASE_URL - also from supabase start, usually `localhost:54321` (but may be different)

- `.env.local` for Next.js
  - NEXT_PUBLIC_SOCKET_URL - websocket for communicating with CloudFlare Workers (note the extra `/v0`)
  - NEXT_PUBLIC_WORKER_URL - http url for communicating with CloudFlare Workers (note the extra `/v0`)
  - NEXT_PUBLIC_SUPABASE_URL - same as SUPABASE_URL above for local env
  - NEXT_PUBLIC_SUPABASE_ANON_KEY - this is the `anon key` from when Supabase starts

Values for your local environment should look something like this:

```
NEXT_PUBLIC_SOCKET_URL="ws://127.0.0.1:8787/v0"
NEXT_PUBLIC_WORKER_URL="http://127.0.0.1:8787/v0"
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

If you'd like to test against the live Hyperlink site, you can swap in the production values:

```
NEXT_PUBLIC_SOCKET_URL="wss://hyperlink-garden.awarm.workers.dev/v0"
NEXT_PUBLIC_WORKER_URL="https://hyperlink-garden.awarm.workers.dev/v0"
NEXT_PUBLIC_SUPABASE_URL=https://epzrqdtswyqvjtketjhe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwenJxZHRzd3lxdmp0a2V0amhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzkyNDk3NzIsImV4cCI6MTk5NDgyNTc3Mn0.yj_htmdUK7-SUOoFfXfW1-SnGzVW2ucOCZfXOR6JvBM
```

Other useful things:

- to DELETE ALL DATA from your local dev environment, run these two commands:
  - supabase: `npx supabase db reset`
  - cloudflare: `rm -rf .wrangler`
- note a few other useful urls for local Supabase testing (to check these, run `npx supabase status`)
  - Studio URL for Supabase dashboard, should be e.g. `http://localhost:54323`
  - Inbucket URL for email testing, should be e.g. `http://localhost:54324`
- when deploying, make sure to set the necessary environment variables in your hosting providers
  - e.g. GitHub Actions, Vercel, Cloudflare…

## Contributing

This is an early stage project and it's quite possible things may have changed by the time you read this!

While we'd love to see you play with the code and build stuff with it, we don't have a formal process for managing contributions, and our bandwidth is limited. If you'd like to contribute back, or have other questions, please reach out to chat.
