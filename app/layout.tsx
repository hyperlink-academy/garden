import "styles/globals.css";
import React from "react";
import { SharedProviders } from "./SharedProviders";
import { Metadata, Viewport } from "next/types";

export const fetchCache = "force-no-store";

export const viewport: Viewport = {
  minimumScale: 1,
  initialScale: 1,
  width: "device-width",
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  appleWebApp: {
    statusBarStyle: "black-translucent",
    capable: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SharedProviders>{children}</SharedProviders>
      </body>
    </html>
  );
}
