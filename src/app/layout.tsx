import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "beacon-alerts",
  description: "An alerting system with pluggable event sources and delivery channels.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
