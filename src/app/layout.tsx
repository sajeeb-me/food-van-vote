import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
