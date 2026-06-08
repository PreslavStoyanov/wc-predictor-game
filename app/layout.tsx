import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WC 2026 Predictor",
  description: "World Cup 2026 prediction game for your group of friends",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen">
        <header className="border-b border-gray-800 bg-gray-900">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">⚽</span>
            <span className="font-bold text-lg tracking-tight">WC 2026 Predictor</span>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
