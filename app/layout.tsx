import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Super El Niño Mapper - Kenya',
  description:
    'Explore historical El Niño impacts, recurring flood hotspots, and county-level risk outlooks across Kenya.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
