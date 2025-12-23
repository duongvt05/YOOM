// app/layout.tsx
import { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      {/* KHÔNG CÓ CLASS NÀO KHÁC TRÊN THẺ HTML */}
      <body className={`${inter.className} bg-dark-2`}>
        {children}
      </body>
    </html>
  );
}