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
}

export function MessageSlipDisplay({ data, humanizedMessage, onApprove, isApproved }: MessageSlipDisplayProps) {
  const statusItems = [
    { label: "Telephoned", checked: data?.statusTelephoned },
    { label: "Came to see you", checked: data?.statusCameToSeeYou },
    { label: "Wants to see you", checked: data?.statusWantsToSeeYou },
    { label: "Returned your call", checked: data?.statusReturnedCall },
    { label: "Please call", checked: data?.statusPleaseCall },
    { label: "Will call again", checked: data?.statusWillCallAgain },
    { label: "Urgent", checked: data?.statusUrgent },
    { label: "Rush", checked: data?.statusRush },
  ];

  const hasData = !!data && data.recipient;
  const time = data?.time ? new Date(`1970-01-01T${data.time}`) : null;
  const formattedTime = time ? format(time, "hh:mm a") : "";

  const InfoRow = ({ label, value }: { label: string; value: string | undefined }) => (
    <div className="contents">
      <p className="font-semibold uppercase text-sm mt-1">{label}:</p>
      <div className="border-b border-dotted border-gray-500 text-base min-h-[1.5rem]">
        {value}
      </div>
    </div>
  );
  
  return (
    <div id="pdf-content" className={cn("bg-yellow-50 text-gray-800 font-serif p-8 border-2 border-dashed border-gray-400 rounded-md", !hasData && "text-center flex items-center justify-center h-full")}>
        {!hasData ? (
            <p className="text-gray-500">Your message preview will appear here.</p>
        ) : (
            <div className="space-y-6">
                <header className="text-center border-b-2 border-gray-400 pb-2 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-widest">
                        While You Were Out
                    </h1>
                </header>

                <section className="grid grid-cols-[auto_1fr_auto_1fr] gap-x-4 gap-y-2 border-b border-gray-300 pb-6">
                    <InfoRow label="To" value={data?.recipient} />
                    <InfoRow label="Date" value={data?.date ? format(data.date, "MM/dd/yyyy") : ""} />
                    <InfoRow label="From" value={data?.senderName} />
                    <InfoRow label="Time" value={formattedTime} />
                    <InfoRow label="Of" value={data?.senderOrg || "N/A"} />
                    <InfoRow label="Phone" value={data?.phone || "N/A"} />
                </section>
                
                <section className="border-b border-gray-300 pb-6">
                    <p className="font-semibold uppercase text-sm mb-4 text-center tracking-wider">Message Type</p>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
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
                  <section className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-2 border-b border-gray-300 pb-6">
                      <div className="font-semibold uppercase text-sm flex items-center gap-2 tracking-wider col-span-2 justify-center mb-2">
                        <Bot size={16} /> {isApproved ? 'Message' : 'AI Summary'}
                        {!isApproved && onApprove && (
                          <button onClick={onApprove} className="no-print ml-auto p-1 text-xs bg-green-200 text-green-800 rounded-md hover:bg-green-300 flex items-center gap-1">
                            <ThumbsUp size={12}/> Approve
                          </button>
                        )}
                        {isApproved && (
                           <div className="no-print ml-auto p-1 text-xs bg-blue-200 text-blue-800 rounded-md flex items-center gap-1">
                            <Check size={12}/> Approved
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
                      <p className="font-semibold uppercase text-sm mb-3 text-center tracking-wider">Message</p>
                      <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap min-h-[60px] p-2 border-b border-dotted border-gray-500">
                          {data?.message}
                      </p>
                  </section>
                )}

                <footer className="mt-6 text-center">
                    <p className="text-xs text-gray-500">MessageSlip Auto-Generated Document</p>
                </footer>
            </div>
        )}
    </div>
  );
}
