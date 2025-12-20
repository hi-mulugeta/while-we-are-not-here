"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
import { CalendarIcon, FileDown, Printer, Trash2 } from "lucide-react";
import { Separator } from "./ui/separator";
import { MessageSlipDisplay } from "./message-slip-display";

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
  const printRef = useRef<HTMLDivElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient: "",
      time: "",
      senderName: "",
      senderOrg: "",
      phone: "",
      message: "",
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

  const onSubmit = (values: FormValues) => {
    setSubmittedData(values);
  };

  const handleClearForm = () => {
    form.reset();
    setSubmittedData(null);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=800,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Print Message</title>');
      
      const stylesheets = Array.from(document.styleSheets)
        .map(sheet => {
          try {
            return Array.from(sheet.cssRules)
              .map(rule => rule.cssText)
              .join('');
          } catch (e) {
            console.warn('Could not read stylesheet', e);
            return '';
          }
        })
        .join('\n');

      printWindow.document.write(`<style>${stylesheets}</style></head><body>`);
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleExportPdf = () => {
    const input = printRef.current;
    if (!input) return;

    html2canvas(input, { scale: 2, backgroundColor: null }).then((canvas) => {
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
      // Fit to width
      finalWidth = pdfWidth - 40; // with margin
      finalHeight = finalWidth / canvasAspectRatio;

      if (finalHeight > pdfHeight - 40) {
        // Fit to height if it overflows
        finalHeight = pdfHeight - 40;
        finalWidth = finalHeight * canvasAspectRatio;
      }
      
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
      pdf.save("message-slip.pdf");
    });
  };

  const isFormSubmitted = submittedData !== null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="w-full">
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
            <CardHeader>
                <CardTitle>Preview & Actions</CardTitle>
                <CardDescription>
                    This is a preview of your generated message slip.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-4 border rounded-lg bg-white">
                    <div ref={printRef}>
                      <MessageSlipDisplay data={submittedData || form.getValues()} />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2">
                <Button type="button" variant="ghost" onClick={handleClearForm} className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" /> Clear
                </Button>
                <div className="flex w-full sm:w-auto sm:ml-auto gap-2">
                    <Button type="button" variant="outline" onClick={handlePrint} disabled={!isFormSubmitted} className="flex-1">
                        <Printer className="mr-2 h-4 w-4" /> Print
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
