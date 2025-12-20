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
    { label: "Wants to see you", checked:data?.statusWantsToSeeYou },
    { label: "Returned your call", checked: data?.statusReturnedCall },
    { label: "Please call", checked: data?.statusPleaseCall },
    { label: "Will call again", checked: data?.statusWillCallAgain },
    { label: "Urgent", checked: data?.statusUrgent },
    { label: "Rush", checked: data?.statusRush },
  ];

  const hasData = !!data && data.recipient;
  const time = data?.time ? new Date(`1970-01-01T${data.time}`) : null;
  const formattedTime = time ? format(time, "hh:mm a") : "";

  return (
    <div id="pdf-content" className={cn("bg-yellow-50 text-gray-800 font-serif p-6 border-2 border-dashed border-gray-400 rounded-md", !hasData && "text-center flex items-center justify-center h-full")}>
        {!hasData ? (
            <p className="text-gray-500">Your message preview will appear here.</p>
        ) : (
            <div className="space-y-4">
                <header className="text-center border-b-2 border-gray-400 pb-2">
                    <h1 className="text-2xl font-bold text-gray-900 uppercase">
                        While You Were Out
                    </h1>
                </header>

                <section className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-gray-300 pb-4">
                    <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                        <p className="font-semibold uppercase text-sm">To:</p>
                        <p className="text-base border-b border-dotted border-gray-500 w-full min-h-[1.5rem]">{data?.recipient}</p>
                    </div>
                     <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                        <p className="font-semibold uppercase text-sm">Date:</p>
                        <p className="text-base border-b border-dotted border-gray-500 w-full min-h-[1.5rem]">
                            {data?.date ? format(data.date, "MM/dd/yyyy") : ""}
                        </p>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-center gap-2 col-span-2">
                        <p className="font-semibold uppercase text-sm">From:</p>
                        <p className="text-base border-b border-dotted border-gray-500 w-full min-h-[1.5rem]">{data?.senderName}</p>
                    </div>
                     <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                        <p className="font-semibold uppercase text-sm">Of:</p>
                        <p className="text-base border-b border-dotted border-gray-500 w-full min-h-[1.5rem]">{data?.senderOrg || "N/A"}</p>
                    </div>
                     <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                        <p className="font-semibold uppercase text-sm">Time:</p>
                        <p className="text-base border-b border-dotted border-gray-500 w-full min-h-[1.5rem]">
                           {formattedTime}
                        </p>
                    </div>
                     <div className="grid grid-cols-[auto_1fr] items-center gap-2 col-span-2">
                         <p className="font-semibold uppercase text-sm">Phone:</p>
                         <p className="text-base border-b border-dotted border-gray-500 w-full min-h-[1.5rem]">{data?.phone || "N/A"}</p>
                    </div>
                </section>
                
                <section className="border-b border-gray-300 pb-4">
                    <p className="font-semibold uppercase text-sm mb-3 text-center">MESSAGE TYPE</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        {statusItems.map(item => (
                            <div key={item.label} className="flex items-center gap-2">
                                <div className="w-3 h-3 border border-gray-600 rounded-sm flex items-center justify-center print:p-0">
                                  {item.checked && <div className="w-2 h-2 bg-gray-700 rounded-sm"></div>}
                                </div>
                                <span className="print:hidden">{item.label}</span>
                                <span className="hidden print:inline">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </section>
                
                {humanizedMessage && (
                  <section className="border-b border-gray-300 pb-4">
                      <div className="font-semibold uppercase text-sm mb-2 text-center flex items-center justify-center gap-2">
                        <Bot size={16} /> AI Summary
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
                      <p className="text-sm italic text-gray-700 bg-yellow-100 p-2 rounded-md">
                          {humanizedMessage}
                      </p>
                  </section>
                )}

                <section>
                    <p className="font-semibold uppercase text-sm mb-2 text-center">Message</p>
                    <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap min-h-[60px] p-2 border-b border-dotted border-gray-500">
                        {data?.message}
                    </p>
                </section>

                <footer className="mt-4 text-center">
                    <p className="text-xs text-gray-500">MessageSlip Auto-Generated Document</p>
                </footer>
            </div>
        )}
    </div>
  );
}
