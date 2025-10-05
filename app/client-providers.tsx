"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Notification />
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
      </AuthProvider>
    </QueryClientProvider>
  );
}
