import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Football Team Manager",
  description: "Gestion des clubs et équipes de football américain",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
