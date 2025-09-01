"use client";

import React, { useEffect, useRef } from "react";
import { useMails } from "@/context/mailsContext";
import { useSenders } from "@/context/sendersContext";
import moment from "moment";
import { SenderIcon } from "@/components/sidebar/sender-icon";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

function sanitizeMailHtml(html: string): string {
  html = html.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  html = html.replace(/<link[^>]*rel=["']?stylesheet["']?[^>]*>/gi, "");
  html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<base[\s\S]*?>/gi, "");
  html = html.replace(/on([a-z]+)=["']?[^"'>]*["']?/gi, "");
  return html;
}

function Header() {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between px-4  py-2 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center">
        <Image
          src="/logo-lg.png"
          alt="Rainbox Logo"
          width={130}
          height={28}
          className="mr-1"
        />
        <div className="border-l-2 border-gray-500 h-6 "></div>
        <span className="ml-4 text-gray-800 hidden md:inline">
          Inbox for all your Newsletters
        </span>
      </div>
      <a
        href="https://rainbox.app"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-900 border border-gray-600 rounded-md hover:bg-gray-50 transition-colors"
      >
        Visit Website <ArrowRight className="w-4 h-4 ml-2" />
      </a>
    </div>
  );
}

function MailPageSkeleton() {
  return (
    <div className="flex-1 h-screen flex items-center justify-center p-4">
      <h2>Loading ...</h2>
    </div>
  );
}

export default function MailPage({ params }: { params: { id: string } }) {
  const { id: mailId } = params;
  const {
    mails,
    isMailsLoading,
    mailsListError,
    setSelectedMail,
    selectedMail,
  } = useMails();
  const { senders } = useSenders();
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mailFromContext = mails.find((m) => m.id === mailId);
    if (mailFromContext) {
      setSelectedMail(mailFromContext);
    } else if (!isMailsLoading && mailsListError) {
      console.error("Mail not found or error loading mails:", mailsListError);
    }
  }, [mailId, mails, isMailsLoading, mailsListError, setSelectedMail]);

  useEffect(() => {
    if (contentRef.current && selectedMail?.body) {
      contentRef.current.innerHTML = sanitizeMailHtml(selectedMail.body);

      const links = contentRef.current.querySelectorAll("a");
      links.forEach((link) => {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      });

      const tables = contentRef.current.querySelectorAll("table");
      tables.forEach((table) => {
        table.removeAttribute("width");
        table.style.width = "100%";
        table.style.tableLayout = "auto";
      });
    }
  }, [selectedMail?.body]);

  const mailSender: any = selectedMail
    ? senders.find((sender) => sender.id === selectedMail.sender_id) || {
        id: selectedMail.id,
        name: selectedMail.senders.name,
        domain: selectedMail.senders.domain,
        image_url: selectedMail.senders.image_url,
        email: selectedMail.sender,
      }
    : null;

  if (isMailsLoading && !selectedMail) {
    return <MailPageSkeleton />;
  }

  if (mailsListError && !selectedMail) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center p-4 text-center text-red-500">
        <p>Error loading mail: {mailsListError}</p>
      </div>
    );
  }

  if (!selectedMail) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center p-4 text-center">
        <p className="text-muted-foreground">Mail not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      <Header />
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {selectedMail.subject}
            </h1>
            {mailSender && (
              <div className="flex items-center mb-6 text-sm border-b pb-4 border-gray-100">
                <div className="mr-3 flex-shrink-0">
                  <SenderIcon sender={mailSender} width={36} height={36} />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    {mailSender.name}{" "}
                    {mailSender.email && (
                      <span className="text-gray-500 font-normal">
                        &lt;{mailSender.email}&gt;
                      </span>
                    )}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {moment(selectedMail.created_at).format(
                      "MMMM D, YYYY [at] h:mm A"
                    )}
                  </div>
                </div>
              </div>
            )}

            <div
              ref={contentRef}
              style={{ wordBreak: "break-word" }}
              className="text-base text-gray-700 leading-relaxed mail-body-content"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
