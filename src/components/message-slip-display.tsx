"use client";

import { format } from "date-fns";
import type { FormValues } from "./message-slip-form";
import { cn } from "@/lib/utils";

interface MessageSlipDisplayProps {
  data: FormValues | null;
}

export function MessageSlipDisplay({ data }: MessageSlipDisplayProps) {
  const statusItems = [
    { label: "Telephoned", checked: data?.statusTelephoned },
    { label: "Came to see you", checked: data?.statusCameToSeeYou },
    { label: "Wants to see you", checked: data?.statusWantsToSeeYou },
    { label: "Returned your call", checked: data?.statusReturnedCall },
    { label: "Please call", checked: data?.statusPleaseCall },
    { label: "Will call again", checked: data?.statusWillCallAgain },
    { label: "Urgent", checked: data?.statusUrgent },
    { label: "Rush", checked: data?.statusRush },
  ].filter(item => item.checked);

  const hasData = !!data && data.recipient;

  return (
    <div className={cn("bg-white text-gray-800 font-sans p-8 rounded-lg border border-gray-200", !hasData && "text-center")}>
        {!hasData ? (
            <p className="text-gray-500">Your message preview will appear here once you fill out the form.</p>
        ) : (
            <>
                <header className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-wider text-gray-900 uppercase">
                        Important Message
                    </h1>
                </header>

                <section className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8 border-b border-gray-200 pb-8">
                    <div>
                        <p className="text-sm text-gray-500 uppercase tracking-wider">For</p>
                        <p className="text-lg font-semibold text-gray-900">{data?.recipient}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500 uppercase tracking-wider">Date & Time</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {data?.date ? format(data.date, "MM/dd/yyyy") : ""} at {data?.time}
                        </p>
                    </div>
                </section>

                <section className="mb-8 border-b border-gray-200 pb-8">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                        <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wider">From</p>
                            <p className="text-lg font-semibold text-gray-900">{data?.senderName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wider">Of</p>
                            <p className="text-lg font-semibold text-gray-900">{data?.senderOrg || "N/A"}</p>
                        </div>
                        <div className="col-span-2">
                             <p className="text-sm text-gray-500 uppercase tracking-wider">Phone</p>
                             <p className="text-lg font-semibold text-gray-900">{data?.phone || "N/A"}</p>
                        </div>
                    </div>
                </section>
                
                {statusItems.length > 0 && (
                    <section className="mb-8 border-b border-gray-200 pb-8">
                        <p className="text-sm text-gray-500 uppercase tracking-wider mb-3">Regarding</p>
                        <div className="flex flex-wrap gap-3">
                            {statusItems.map(item => (
                                <span key={item.label} className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1.5 rounded-full">
                                    {item.label}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <p className="text-sm text-gray-500 uppercase tracking-wider mb-3">Message</p>
                    <p className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">
                        {data?.message}
                    </p>
                </section>

                <footer className="mt-12 text-center">
                    <p className="text-xs text-gray-400">MessageSlip Auto-Generated Document</p>
                </footer>
            </>
        )}
    </div>
  );
}
