import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { DemotivationTimer } from "@/components/demotivation-timer"

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
      <body className={`${inter.variable} font-body antialiased h-full bg-background`}>
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          <footer className="sticky bottom-0 w-full text-center py-3 text-xs sm:text-sm text-muted-foreground border-t bg-background/80 backdrop-blur-sm">
            By <a href="https://github.com/samsonchim/" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-primary transition-colors">Samson Chi</a>
          </footer>
        </div>
    <Toaster />
    <DemotivationTimer />
      </body>
    </html>
  );
}
