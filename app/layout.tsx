import "styles/globals.css";
import React from "react";
import { SharedProviders } from "./SharedProviders";
import { Metadata, Viewport } from "next/types";
import { supabaseServerClient } from "supabase/server";

export const fetchCache = "force-no-store";

export const viewport: Viewport = {
  minimumScale: 1,
  initialScale: 1,
  maximumScale: 1,
  width: "device-width",
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  manifest: "/site.webmanifest",
  icons: [
    {
      type: "apple-touch-icon",
      sizes: "180x180",
      url: "/apple-touch-icon.png",
    },
    {
      type: "image/png",
      sizes: "32x32",
      url: "/favicon-32x32.png",
    },
    {
      type: "image/png",
      sizes: "16x16",
      url: "/favicon-16x16.png",
    },
  ],
  appleWebApp: {
    title: "Hyperlink Academy",
    statusBarStyle: "black-translucent",
    capable: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let supabase = supabaseServerClient();
  let { data: session } = await supabase.auth.getSession();
  return (
    <html lang="en">
      <body>
        <SharedProviders session={session.session}>{children}</SharedProviders>
      </body>
    </html>
  );
}
