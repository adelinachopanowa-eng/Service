import type { Metadata, Viewport } from "next";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Сервиз на машини",
  description:
    "Следене на техническата поддръжка и ремонти на камиони и индустриална техника",
  // Disable iOS Safari's automatic detection of phone numbers, dates and
  // addresses which inserts styled (often green) tappable links into the
  // page content.
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Сервиз",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a4a2e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bg">
      <body className="min-h-screen bg-cream">
        <Nav />
        <main className="mx-auto max-w-3xl px-4 py-5 pb-24 sm:py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
