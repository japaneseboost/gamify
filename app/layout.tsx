import type { Metadata } from "next";
import "./layout-fixes.css";
import "./delayed-dictation.css";
import "./globals.css";
import "./tug-of-war.css";
import "./faulty-echo.css";

export const metadata: Metadata = {
  title: "Gamify — Language Activity Workspace",
  description: "Build interactive language classroom activities organised by input and production mode.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html:"try{var t=localStorage.getItem('gamify-theme');document.documentElement.dataset.theme=t==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}"}}/>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
