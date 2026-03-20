import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "VaultGuard — Secure Gateway for Local AI Agents",
  description: "Multi-tenant Auth0 Token Vault isolation for AI agents",
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
