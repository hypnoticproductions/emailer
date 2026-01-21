import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WUKR WIRE - Morphic Intelligence Network",
  description: "Automated signal distribution from MANUS to your contact network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
