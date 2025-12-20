"use client";

import { useRef } from "react";
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
  CardFooter,
  CardHeader,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CalendarIcon, FileDown, Printer, Trash2 } from "lucide-react";
import { Separator } from "./ui/separator";

const formSchema = z.object({
  recipient: z.string().min(1, { message: "Recipient is required." }),
  date: z.date({ required_error: "A date is required." }),
  time: z.string().min(1, { message: "Time is required." }),
  timePeriod: z.enum(["am", "pm"], { required_error: "AM/PM is required." }),
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
  statusSpecialAttention: z.boolean().default(false),
  statusSentDocs: z.boolean().default(false),
  
  message: z.string().min(1, { message: "Message is required." }),
});

type FormValues = z.infer<typeof formSchema>;

const statusCheckboxes = [
  { id: "statusTelephoned", label: "Telephoned" },
  { id: "statusPleaseCall", label: "Please call" },
  { id: "statusCameToSeeYou", label: "Came to see you" },
  { id: "statusWillCallAgain", label: "Will call again" },
  { id: "statusWantsToSeeYou", label: "Wants to see you" },
  { id: "statusRush", label: "Rush" },
  { id: "statusReturnedCall", label: "Returned your call" },
  { id: "statusSpecialAttention", label: "Special attention" },
  { id: "statusUrgent", label: "Urgent" },
  { id: "statusSentDocs", label: "Sent documents" },
] as const;

export default function MessageSlipForm() {
  const formRef = useRef<HTMLDivElement>(null);
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
      statusTelephoned: false,
      statusCameToSeeYou: false,
      statusWantsToSeeYou: false,
      statusReturnedCall: false,
      statusUrgent: false,
      statusPleaseCall: false,
      statusWillCallAgain: false,
      statusRush: false,
      statusSpecialAttention: false,
      statusSentDocs: false,
    },
  });

  const onSubmit = (values: FormValues) => {
    console.log(values);
    toast({
      title: "Form Submitted",
      description: "Your message has been logged to the console.",
    });
  };

  const handleClearForm = () => {
    form.reset();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    const input = formRef.current;
    if (!input) return;

    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const width = pdfWidth;
      const height = width / ratio;

      // If height is bigger than a page, we split it
      if (height > pdfHeight) {
          // This case is not handled for simplicity, but could be implemented
          // by slicing the image and adding new pages.
          console.warn("PDF content exceeds one page, which is not fully supported in this export.");
      }
      
      pdf.addImage(imgData, "PNG", 0, 0, width, height > pdfHeight ? pdfHeight : height);
      pdf.save("message-slip.pdf");
    });
  };

  return (
    <Card ref={formRef} className="w-full max-w-2xl print-card">
      <CardHeader className="text-center">
        <h1 className="font-headline text-3xl tracking-wider">
          IMPORTANT MESSAGE
        </h1>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="recipient"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-4">
                      <FormLabel className="w-16 text-right font-headline text-muted-foreground">FOR</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </div>
                    <FormMessage className="ml-20" />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-4">
                  <FormLabel className="w-16 pt-2 text-right font-headline text-muted-foreground">DATE</FormLabel>
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col flex-1">
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
                </div>
                <div className="flex items-center gap-4">
                  <FormLabel className="w-16 text-right font-headline text-muted-foreground">TIME</FormLabel>
                  <div className="flex flex-1 items-start gap-2">
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="timePeriod"
                      render={({ field }) => (
                        <FormItem className="pt-2">
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex gap-2"
                            >
                              <FormItem className="flex items-center space-x-1 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="am" />
                                </FormControl>
                                <FormLabel className="font-normal">AM</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-1 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="pm" />
                                </FormControl>
                                <FormLabel className="font-normal">PM</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />
            
            <div className="space-y-4 print-break-inside-avoid">
              <FormField
                control={form.control}
                name="senderName"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-4">
                      <FormLabel className="w-16 text-right font-headline text-muted-foreground">FROM</FormLabel>
                      <FormControl>
                        <Input placeholder="Name / Business" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage className="ml-20" />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="senderOrg"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-4">
                      <FormLabel className="w-16 text-right font-headline text-muted-foreground">OF</FormLabel>
                      <FormControl>
                        <Input placeholder="Company / Organization" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage className="ml-20" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-4">
                      <FormLabel className="w-16 text-right font-headline text-muted-foreground">PHONE</FormLabel>
                      <FormControl>
                        <Input placeholder="Mobile / Phone Number" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage className="ml-20" />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 print-break-inside-avoid">
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
                      <FormLabel className="font-normal">
                        {item.label}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <Separator />

            <div className="print-break-inside-avoid">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-4">
                      <FormLabel className="w-16 pt-2 text-right font-headline text-muted-foreground">MSG.</FormLabel>
                      <FormControl>
                        <Textarea
                          className="textarea-ruled min-h-[140px] resize-y"
                          placeholder="Type your message here..."
                          {...field}
                        />
                      </FormControl>
                    </div>
                     <FormMessage className="ml-20" />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 pt-4 no-print">
              <Button type="button" variant="ghost" onClick={handleClearForm}>
                <Trash2 className="mr-2 h-4 w-4" /> Clear Form
              </Button>
              <Button type="button" variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
              <Button type="button" variant="outline" onClick={handleExportPdf}>
                <FileDown className="mr-2 h-4 w-4" /> Export PDF
              </Button>
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
