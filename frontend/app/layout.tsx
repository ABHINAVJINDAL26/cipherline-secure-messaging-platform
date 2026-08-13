import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal Clone — Secure Messaging",
  description: "A pixel-close, fully functional clone of Signal Messenger. Real-time messaging, groups, and end-to-end encrypted (mocked) communication.",
  keywords: ["Signal", "messaging", "secure", "privacy", "chat"],
  openGraph: {
    title: "Signal Clone — Secure Messaging",
    description: "Real-time secure messaging platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}

// Inline theme initializer to avoid FOUC (flash of unstyled content)
function ThemeInitializer() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var theme = localStorage.getItem('signal-theme') || 'dark';
              var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
              if (isDark) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch(e) {}
          })();
        `,
      }}
    />
  );
}
