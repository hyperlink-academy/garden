# hyperlink-garden: 

Hi! Welcome to the codebase for hyperlink's web app.

## Important Dependencies
These are the libraries

### Replicache
### Cloudflare Workers
### React (& Next.js)
### TailwindCSS

## Structure

- `/pages`: these are different routes that can be renderd. If a file has a in
    brackets, like `[studio].tsx` that means it's a dynamic route.

- `/components`: every file here exports a react component used by files in
    `/pages` or by other components

- `/hooks`: every file here exports react hooks that encapsulate logic and
    side-effects

- `/backend`: This folder contains an `index.ts` file that defines a [Cloudflare
    Worker]

- `/data`: This folder contains data that is shared across the front and
    backend as well as mutations for updating them.
