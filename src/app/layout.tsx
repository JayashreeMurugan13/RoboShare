import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project RoboShare Enterprise | Edge Storage & Verification Protocol",
  description: "Decentralized Autonomous Edge Storage & Verification Protocol for Autonomous Mobile Robots and Distributed Host Nodes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
