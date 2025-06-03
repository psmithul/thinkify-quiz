import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/lib/authContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thinkify Quiz Platform",
  description: "Test your knowledge with our interactive quiz platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Catch and suppress common OAuth-related errors
              window.addEventListener('error', function(e) {
                // Suppress LinkedIn OAuth and static resource errors
                if (e.filename && (
                  e.filename.includes('licdn.com') || 
                  e.filename.includes('linkedin.com') ||
                  e.message.includes('textContent')
                )) {
                  e.preventDefault();
                  return false;
                }
              });
              
              // Catch unhandled promise rejections
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && e.reason.toString().includes('LinkedIn')) {
                  e.preventDefault();
                  return false;
                }
              });
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
