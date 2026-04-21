import type { Metadata } from "next";
import "./globals.css";
import SessionSwitcher from "@/app/_components/session-switcher";

export const metadata: Metadata = {
  title: "Support Hub",
  description: "Shared business ticketing app for AI support resolvers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="border-b bg-background">
          <div className="mx-auto flex w-full max-w-5xl items-center px-6 py-3">
            <SessionSwitcher />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
