import type { Metadata } from "next";
import "./globals.css";
import { theme, buildCssVariables } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Food Van Vote",
  description: "Vote for your favourite food van this month.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* All CSS variables are generated from src/lib/theme.ts */}
        <style dangerouslySetInnerHTML={{ __html: buildCssVariables(theme) }} />
      </head>
      <body className="bg-(--bg) text-(--textBase)">
        {children}
      </body>
    </html>
  );
}
