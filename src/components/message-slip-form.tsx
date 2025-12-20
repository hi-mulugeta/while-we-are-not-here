"use client";

import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { humanizeMessage, type HumanizeMessageInput } from "@/ai/flows/humanize-message-flow";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Bot, CalendarIcon, Camera, FileDown, Loader2, Printer, Trash2 } from "lucide-react";
import { Separator } from "./ui/separator";
import { MessageSlipDisplay } from "./message-slip-display";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  recipient: z.string().min(1, { message: "Recipient is required." }),
  date: z.date({ required_error: "A date is required." }),
  time: z.string().min(1, { message: "Time is required." }),
  
  senderName: z.string().min(1, { message: "Sender name is required." }),
  senderOrg: z.string().optional(),
  phone: z.string().optional(),
  
  statusTelephoned: z.boolean().default(false),
  statusCameToSeeYou: z.boolean().default(false),
  statusWantsToSeeYou: z.boolean().default(false),
  statusReturnedCall: z.boolean().default(false),
  statusUrgent: z.boolean().default(false),
  statusPleaseCall: z.boolean().default(false),
  statusWillCallAgain: z.boolean().default(false),
  statusRush: z.boolean().default(false),
  
  message: z.string().min(1, { message: "Message is required." }),
});

export type FormValues = z.infer<typeof formSchema>;

const statusCheckboxes = [
  { id: "statusTelephoned", label: "Telephoned" },
  { id: "statusCameToSeeYou", label: "Came to see you" },
  { id: "statusWantsToSeeYou", label: "Wants to see you" },
  { id: "statusReturnedCall", label: "Returned your call" },
  { id: "statusPleaseCall", label: "Please call" },
  { id: "statusWillCallAgain", label: "Will call again" },
  { id: "statusUrgent", label: "Urgent" },
  { id: "statusRush", label: "Rush" },
] as const;


export default function MessageSlipForm() {
  const [submittedData, setSubmittedData] = useState<FormValues | null>(null);
  const [humanizedMessage, setHumanizedMessage] = useState<string | null>(null);
  const [isAiMessageApproved, setIsAiMessageApproved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient: "",
      time: "",
      senderName: "",
      senderOrg: "",
      phone: "",
      message: "",
      date: new Date(),
      statusTelephoned: false,
      statusCameToSeeYou: false,
      statusWantsToSeeYou: false,
      statusReturnedCall: false,
      statusUrgent: false,
      statusPleaseCall: false,
      statusWillCallAgain: false,
      statusRush: false,
    },
  });
  
  const watchedValues = form.watch();

  const onSubmit = (values: FormValues) => {
    setSubmittedData(values);
    if (isAiMessageApproved && humanizedMessage) {
       setSubmittedData(prev => prev ? {...prev, message: humanizedMessage} : { ...values, message: humanizedMessage });
    }
  };
  
  const handleHumanizeMessage = () => {
    startTransition(async () => {
      const values = form.getValues();
      const { recipient, senderName, message, ...statuses } = values;

      if (!recipient || !senderName || !message) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please fill out the recipient, sender, and message fields before humanizing.",
        });
        return;
      }

      const messageContext = Object.entries(statuses)
        .filter(([key, value]) => key.startsWith('status') && value)
        .map(([key]) => {
          const status = statusCheckboxes.find(s => s.id === key);
          return status ? status.label : '';
        })
        .join(', ');
      
      const input: HumanizeMessageInput = { recipient, senderName, message, messageContext };

      try {
        const { humanizedMessage } = await humanizeMessage(input);
        setHumanizedMessage(humanizedMessage);
        setIsAiMessageApproved(false);
        toast({
          title: "Message Humanized!",
          description: "The AI summary has been added to the preview.",
        });
      } catch (error) {
        console.error("Failed to humanize message:", error);
        toast({
          variant: "destructive",
          title: "AI Error",
          description: "Could not generate the humanized message.",
        });
      }
    });
  };

  const handleApproveAiMessage = () => {
    if (humanizedMessage) {
      form.setValue("message", humanizedMessage);
      setIsAiMessageApproved(true);
      toast({
        title: "AI Summary Approved",
        description: "The original message has been updated.",
      });
    }
  };


  const handleClearForm = () => {
    form.reset({
      recipient: "",
      time: "",
      senderName: "",
      senderOrg: "",
      phone: "",
      message: "",
      date: new Date(),
      statusTelephoned: false,
      statusCameToSeeYou: false,
      statusWantsToSeeYou: false,
      statusReturnedCall: false,
      statusUrgent: false,
      statusPleaseCall: false,
      statusWillCallAgain: false,
      statusRush: false,
    });
    setSubmittedData(null);
    setHumanizedMessage(null);
    setIsAiMessageApproved(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    const input = document.getElementById('pdf-content');
    if (!input) return;

    html2canvas(input, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [595.28, 841.89], // A4 size
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasAspectRatio = canvas.width / canvas.height;
      
      let finalWidth, finalHeight;
      finalWidth = pdfWidth - 40; // with margin
      finalHeight = finalWidth / canvasAspectRatio;

      if (finalHeight > pdfHeight - 40) {
        finalHeight = pdfHeight - 40;
        finalWidth = finalHeight * canvasAspectRatio;
      }
      
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
      pdf.save("message-slip.pdf");
    });
  };

  const handleExportPng = () => {
    const input = document.getElementById('pdf-content');
    if (!input) return;

    html2canvas(input, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      logging: false,
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = 'message-slip.png';
      link.href = imgData;
      link.click();
    });
  };

  const isFormSubmitted = submittedData !== null;


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="w-full no-print">
        <CardHeader>
          <CardTitle className="font-headline text-2xl tracking-wider">
            Important Message
          </CardTitle>
          <CardDescription>
            Fill out the form to create a new message slip.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                 <FormField
                  control={form.control}
                  name="recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>For</FormLabel>
                      <FormControl>
                        <Input placeholder="Recipient's Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="senderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From</FormLabel>
                          <FormControl>
                            <Input placeholder="Sender's Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="senderOrg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Of (Company/Org)</FormLabel>
                          <FormControl>
                            <Input placeholder="Sender's Organization" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
                 <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Sender's Phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <Separator />

              <div className="space-y-4">
                <FormLabel>Message Type</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {statusCheckboxes.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name={item.id}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-sm">
                            {item.label}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>


              <Separator />

              <div>
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[140px] resize-y"
                          placeholder="Type your message here..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full">Create Message Slip</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4">
          <Card className="w-full">
            <CardHeader className="no-print">
                <CardTitle>Preview & Actions</CardTitle>
                <CardDescription>
                    This is a preview of your generated message slip.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-4 border rounded-lg bg-gray-50 print:border-none print:p-0 print:bg-transparent">
                    <div ref={printRef}>
                      <MessageSlipDisplay 
                        data={isFormSubmitted ? submittedData : watchedValues} 
                        humanizedMessage={humanizedMessage}
                        onApprove={handleApproveAiMessage}
                        isApproved={isAiMessageApproved}
                      />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2 no-print">
                <Button type="button" variant="ghost" onClick={handleClearForm} className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" /> Clear
                </Button>
                <div className="flex w-full sm:w-auto sm:ml-auto gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleHumanizeMessage}
                        disabled={isPending}
                        className="flex-1"
                    >
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                        Humanize
                    </Button>
                    <Button type="button" variant="outline" onClick={handlePrint} disabled={!isFormSubmitted} className="flex-1">
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                    <Button type="button" onClick={handleExportPng} disabled={!isFormSubmitted} className="flex-1">
                        <Camera className="mr-2 h-4 w-4" /> Export PNG
                    </Button>
                    <Button type="button" onClick={handleExportPdf} disabled={!isFormSubmitted} className="flex-1">
                        <FileDown className="mr-2 h-4 w-4" /> Export PDF
                    </Button>
                </div>
            </CardFooter>
          </Card>
      </div>
    </div>
  );
}
