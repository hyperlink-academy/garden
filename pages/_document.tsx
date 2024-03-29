import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html>
      <Head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="preload"
          href="/cardBorders/memberCardBorder.svg"
          as="image"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#ffc40d" />
        {prefetchImages.map((href, index) => (
          <link rel="preload" href={href} as="image" key={index} />
        ))}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

const prefetchImages = [
  "/cardBorders/memberCardBorder.svg",
  "/cardBorders/chatCardBorder.svg",
  "/cardBorders/deckCardBorder.svg",
  "/img/gripper.svg",
];
