"use client";

import { format } from "date-fns";
import type { FormValues } from "./message-slip-form";
import { cn } from "@/lib/utils";
import { Bot, Check, ThumbsUp } from "lucide-react";

interface MessageSlipDisplayProps {
  data: FormValues | null;
  humanizedMessage?: string | null;
  onApprove?: () => void;
  isApproved?: boolean;
  language?: "en" | "am";
}

const statusCheckboxes = [
  { id: "statusTelephoned", en: "Telephoned", am: "ተደውሎ ነበር" },
  { id: "statusCameToSeeYou", en: "Came to see you", am: "እርስዎን ለማየት መጥቶ ነበር" },
  { id: "statusWantsToSeeYou", en: "Wants to see you", am: "ሊያይዎት ይፈልጋል" },
  { id: "statusReturnedCall", en: "Returned your call", am: "ጥሪዎን መልሷል" },
  { id: "statusPleaseCall", en: "Please call", am: "እባክዎ ይደውሉ" },
  { id: "statusWillCallAgain", en: "Will call again", am: "እንደገና ይደውላል" },
  { id: "statusUrgent", en: "Urgent", am: "አስቸኳይ" },
  { id: "statusRush", en: "Rush", am: "በጣም አስቸኳይ" },
] as const;

const translations = {
  en: {
    whileYouWereOut: "While You Were Out",
    to: "To",
    date: "Date",
    from: "From",
    time: "Time",
    of: "Of",
    phone: "Phone",
    messageType: "Message Type",
    message: "Message",
    aiSummary: "AI Summary",
    footer: "MessageSlip | I Approve this Message",
    previewPlaceholder: "Your message preview will appear here.",
    approve: "Approve",
    approved: "Approved",
  },
  am: {
    whileYouWereOut: "እርስዎ በሌሉበት",
    to: "ለ",
    date: "ቀን",
    from: "ከ",
    time: "ሰዓት",
    of: "ከ(ድርጅት)",
    phone: "ስልክ",
    messageType: "የመልዕክት ዓይነት",
    message: "መልዕክት",
    aiSummary: "የ AI ማጠቃለያ",
    footer: "መልዕክት ወረቀት | ይህንን መልዕክት አጽድቄያለሁ",
    previewPlaceholder: "የመልዕክትዎ ቅድመ-ዕይታ እዚህ ይታያል።",
    approve: "አጽድቅ",
    approved: "ጸድቋል",
  },
};


export function MessageSlipDisplay({ data, humanizedMessage, onApprove, isApproved, language = "en" }: MessageSlipDisplayProps) {
  
  const T = translations[language];

  const statusItems = statusCheckboxes.map(item => ({
    label: item[language],
    checked: data?.[item.id],
  }));

  const hasData = !!data && data.recipient;
  const time = data?.time ? new Date(`1970-01-01T${data.time}`) : null;
  const formattedTime = time ? format(time, "hh:mm a") : "";

  const InfoRow = ({ label, value }: { label: string; value: string | undefined }) => (
    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] md:gap-x-2">
      <p className="font-semibold uppercase text-sm mt-1">{label}:</p>
      <div className="border-b border-dotted border-gray-500 text-base min-h-[1.5rem]">
        {value}
      </div>
    </div>
  );
  
  return (
    <div id="pdf-content" className={cn("bg-yellow-50 text-gray-800 font-serif p-8 border-2 border-dashed border-gray-400 rounded-md", !hasData && "text-center flex items-center justify-center h-full")}>
        {!hasData ? (
            <p className="text-gray-500">{T.previewPlaceholder}</p>
        ) : (
            <div className="space-y-6">
                <header className="text-center border-b-2 border-gray-400 pb-2 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-widest">
                        {T.whileYouWereOut}
                    </h1>
                </header>

                <section className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 border-b border-gray-300 pb-6">
                    <InfoRow label={T.to} value={data?.recipient} />
                    <InfoRow label={T.date} value={data?.date ? format(data.date, "MM/dd/yyyy") : ""} />
                    <InfoRow label={T.from} value={data?.senderName} />
                    <InfoRow label={T.time} value={formattedTime} />
                    <InfoRow label={T.of} value={data?.senderOrg || "N/A"} />
                    <InfoRow label={T.phone} value={data?.phone || "N/A"} />
                </section>
                
                <section className="border-b border-gray-300 pb-6">
                    <p className="font-semibold uppercase text-sm mb-4 text-center tracking-wider">{T.messageType}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3 text-sm">
                        {statusItems.map(item => (
                            <div key={item.label} className="flex items-center gap-3">
                                <div className="w-3.5 h-3.5 border border-gray-600 rounded-sm flex items-center justify-center p-0 flex-shrink-0">
                                  {item.checked && <div className="w-full h-full bg-gray-700 scale-90"></div>}
                                </div>
                                <span>{item.label.toUpperCase()}</span>
                            </div>
                        ))}
                    </div>
                </section>
                
                {humanizedMessage && (
                  <section className="grid grid-cols-1 gap-y-2 border-b border-gray-300 pb-6">
                      <div className="font-semibold uppercase text-sm flex items-center gap-2 tracking-wider justify-center mb-2">
                        <Bot size={16} /> {isApproved ? T.message : T.aiSummary}
                        {!isApproved && onApprove && (
                          <button onClick={onApprove} className="no-print ml-auto p-1 text-xs bg-green-200 text-green-800 rounded-md hover:bg-green-300 flex items-center gap-1">
                            <ThumbsUp size={12}/> {T.approve}
                          </button>
                        )}
                        {isApproved && (
                           <div className="no-print ml-auto p-1 text-xs bg-blue-200 text-blue-800 rounded-md flex items-center gap-1">
                            <Check size={12}/> {T.approved}
                          </div>
                        )}
                      </div>
                      <div className={cn(
                        "col-span-2 text-sm text-gray-700 p-3 rounded-md bg-yellow-100 italic"
                      )}>
                          {humanizedMessage}
                      </div>
                  </section>
                )}

                {(!humanizedMessage || !isApproved) && (
                  <section>
                      <p className="font-semibold uppercase text-sm mb-3 text-center tracking-wider">{T.message}</p>
                      <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap min-h-[60px] p-2 border-b border-dotted border-gray-500">
                          {data?.message}
                      </p>
                  </section>
                )}

                <footer className="mt-6 text-center">
                    <p className="text-xs text-gray-500">{T.footer}</p>
                </footer>
            </div>
        )}
    </div>
  );
}
