import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WorkMetrics - Time Tracking for Teams',
  description: 'Track time, manage projects, and boost productivity',
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
