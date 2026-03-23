import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXARTE — Art Opportunities",
  description: "Residencies, grants, open calls and more for artists worldwide",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#080808] text-white antialiased">
        {children}
      </body>
    </html>
  );
}