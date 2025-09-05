import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Payment Confirmation',
  description: 'A payment management app for csc students for self payment confirmation.',
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="https://paytsoftware.nl/wp-content/uploads/2020/09/iStock-2078490118-400x500.jpg" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#478E8B" />
      </head>
      <body className={`${inter.variable} font-body antialiased h-full bg-background flex flex-col min-h-screen`}>
        <div className="flex-1">
          {children}
        </div>
        <footer className="w-full text-center py-4 text-sm text-muted-foreground border-t mt-8">
          By Samson Chi, github link <a href="https://github.com/samsonchim/" target="_blank" rel="noopener noreferrer" className="underline">https://github.com/samsonchim/</a>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
