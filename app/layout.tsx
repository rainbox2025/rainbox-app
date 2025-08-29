import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
// import { Geist } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { OnboardingProvider } from "@/context/onboardingContext";
import { AuthProvider } from "@/context/authContext";
import { MailsProvider } from "@/context/mailsContext";
import { FoldersProvider } from "@/context/foldersContext";
import { SendersProvider } from "@/context/sendersContext";
import { SidebarProvider } from "@/context/sidebarContext";
import { ModeProvider } from "@/context/modeContext";
import Notification from "@/components/notifications/Notification";
import { GmailProvider } from "@/context/gmailContext";
import { BookmarkProvider } from "@/context/bookmarkContext";
import { SettingsProvider } from "@/context/settingsContext";
import { OutlookProvider } from "@/context/outlookContext";
import { Toaster } from "react-hot-toast";

const defaultUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Rainbox",
  description: "The fastest way to build apps with Next.js and Supabase",
  favicon: "/favicon.ico",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={GeistSans.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Notification />
            <Toaster position="bottom-center" />

            <main className="min-h-screen flex flex-col items-center">
              <div className="flex-1 w-full flex flex-col items-center">
                <SidebarProvider>
                  <SendersProvider>
                    <MailsProvider>
                      <BookmarkProvider>
                        <GmailProvider>
                          <OutlookProvider>
                            <FoldersProvider>
                              <SettingsProvider>
                                <OnboardingProvider>
                                  <ModeProvider>{children}</ModeProvider>
                                </OnboardingProvider>
                              </SettingsProvider>
                            </FoldersProvider>
                          </OutlookProvider>
                        </GmailProvider>
                      </BookmarkProvider>
                    </MailsProvider>
                  </SendersProvider>
                </SidebarProvider>
              </div>
            </main>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
