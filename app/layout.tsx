import type { Metadata } from "next";
import "./layout-fixes.css";
import "./delayed-dictation.css";
import "./globals.css";
import "./tug-of-war.css";
import "./faulty-echo.css";
import "./quickfire.css";
import "./erase-game.css";
import "./balloon-pop.css";
import "./volcano-game.css";
import "./draw-or-act.css";
import "./pass-the-bomb.css";
import "./whats-missing.css";
import "./hot-seat.css";

export const metadata: Metadata = {
  title: "Gamify — Language Activity Workspace",
  description: "Build interactive language classroom activities organised by input and production mode.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/gamify/gamify-favicon.png",
    shortcut: "/gamify/gamify-favicon.png",
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
