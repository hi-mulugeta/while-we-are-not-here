"use client";

import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { humanizeMessage, type HumanizeMessageInput } from "@/ai/flows/humanize-message-flow";
import { analyzeMessage, type AnalyzeMessageInput, type AnalyzeMessageOutput } from "@/ai/flows/analyze-message-flow";
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
import { Bot, BrainCircuit, CalendarIcon, Camera, FileDown, Lightbulb, Loader2, Printer, Trash2 } from "lucide-react";
import { Separator } from "./ui/separator";
import { MessageSlipDisplay } from "./message-slip-display";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

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
    importantMessage: "Important Message",
    formDescription: "Fill out the form to create a new message slip. Use the AI tools to improve your message.",
    for: "For",
    recipientPlaceholder: "Recipient's Name",
    date: "Date",
    pickDate: "Pick a date",
    time: "Time",
    from: "From",
    senderNamePlaceholder: "Sender's Name",
    senderOrg: "Of (Company/Org)",
    senderOrgPlaceholder: "Sender's Organization",
    phone: "Phone Number",
    phonePlaceholder: "Sender's Phone",
    messageType: "Message Type",
    message: "Message",
    messagePlaceholder: "Type your message here...",
    createMessageSlip: "Create Message Slip",
    previewActions: "Preview & Actions",
    previewDescription: "This is a preview of your generated message slip.",
    clear: "Clear",
    analyze: "Analyze",
    humanize: "Humanize",
    print: "Print",
    exportPng: "Export PNG",
    exportPdf: "Export PDF",
    analysisTitle: "Message Analysis",
    analysisDescription: "Here's the AI's feedback on your message.",
    tone: "Tone",
    clarityScore: "Clarity Score",
    suggestions: "Suggestions",
    approveAi: "Approve",
    aiSummary: "AI Summary",
    approved: "Approved",
    messageLabel: "Message",
    missingInfo: "Missing Information",
    missingInfoDesc: "Please fill out the recipient, sender, and message fields before using AI features.",
    aiHumanizeSuccess: "Message Humanized!",
    aiHumanizeSuccessDesc: "The AI summary has been added to the preview.",
    aiError: "AI Error",
    aiHumanizeError: "Could not generate the humanized message.",
    missingMessage: "Missing Message",
    missingMessageDesc: "Please enter a message to analyze.",
    aiAnalyzeError: "Could not analyze the message.",
    aiApproveSuccess: "AI Summary Approved",
    aiApproveSuccessDesc: "The original message has been updated.",
  },
  am: {
    importantMessage: "አስፈላጊ መልዕክት",
    formDescription: "አዲስ የመልዕክት ወረቀት ለመፍጠር ቅጹን ይሙሉ:: የመልዕክትዎን ጥራት ለማሻሻል የ AI መሣሪያዎችን ይጠቀሙ::",
    for: "ለ",
    recipientPlaceholder: "የተቀባይ ስም",
    date: "ቀን",
    pickDate: "ቀን ይምረጡ",
    time: "ሰዓት",
    from: "ከ",
    senderNamePlaceholder: "የላኪ ስም",
    senderOrg: "የድርጅት ስም",
    senderOrgPlaceholder: "የላኪ ድርጅት",
    phone: "ስልክ ቁጥር",
    phonePlaceholder: "የላኪ ስልክ",
    messageType: "የመልዕክት ዓይነት",
    message: "መልዕክት",
    messagePlaceholder: "መልዕክትዎን እዚህ ይጻፉ...",
    createMessageSlip: "የመልዕክት ወረቀት ፍጠር",
    previewActions: "ቅድመ-ዕይታ እና ድርጊቶች",
    previewDescription: "ይህ እርስዎ የፈጠሩት የመልዕክት ወረቀት ቅድመ-ዕይታ ነው።",
    clear: "አጽዳ",
    analyze: "ተንትን",
    humanize: "ሰዋዊ አድርግ",
    print: "አትም",
    exportPng: "PNG ላክ",
    exportPdf: "PDF ላክ",
    analysisTitle: "የመልዕክት ትንተና",
    analysisDescription: "የ AI ግብረመልስ በመልዕክትዎ ላይ።",
    tone: "ቃና",
    clarityScore: "የግልጽነት ነጥብ",
    suggestions: "የማሻሻያ ሐሳቦች",
    approveAi: "አጽድቅ",
    aiSummary: "የ AI ማጠቃለያ",
    approved: "ጸድቋል",
    messageLabel: "መልዕክት",
    missingInfo: "ያልተሟላ መረጃ",
    missingInfoDesc: "የ AI ባህሪያትን ከመጠቀምዎ በፊት እባክዎ የተቀባይ፣ የላኪ እና የመልዕክት መስኮችን ይሙሉ።",
    aiHumanizeSuccess: "መልዕክቱ ሰዋዊ ሆኗል!",
    aiHumanizeSuccessDesc: "የ AI ማጠቃለያው በቅድመ-ዕይታ ላይ ተጨምሯል።",
    aiError: "የ AI ስህተት",
    aiHumanizeError: "ሰዋዊ መልዕክት መፍጠር አልተቻለም።",
    missingMessage: "የጎደለ መልዕክት",
    missingMessageDesc: "እባክዎ ለመተንተን መልዕክት ያስገቡ።",
    aiAnalyzeError: "መልዕክቱን መተንተን አልተቻለም።",
    aiApproveSuccess: "የ AI ማጠቃለያ ጸድቋል",
    aiApproveSuccessDesc: "ዋናው መልዕክት ተዘምኗል።",
  }
}


export default function MessageSlipForm() {
  const [submittedData, setSubmittedData] = useState<FormValues | null>(null);
  const [humanizedMessage, setHumanizedMessage] = useState<string | null>(null);
  const [isAiMessageApproved, setIsAiMessageApproved] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeMessageOutput | null>(null);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "am">("en");

  const [isHumanizePending, startHumanizeTransition] = useTransition();
  const [isAnalyzePending, startAnalyzeTransition] = useTransition();
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const T = translations[language];

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
    startHumanizeTransition(async () => {
      const values = form.getValues();
      const { recipient, senderName, message, ...statuses } = values;

      if (!recipient || !senderName || !message) {
        toast({
          variant: "destructive",
          title: T.missingInfo,
          description: T.missingInfoDesc,
        });
        return;
      }

      const messageContext = statusCheckboxes
        .filter(status => statuses[status.id])
        .map(status => status[language])
        .join(', ');
      
      const input: HumanizeMessageInput = { recipient, senderName, message, messageContext, language };

      try {
        const { humanizedMessage: hMessage } = await humanizeMessage(input);
        setHumanizedMessage(hMessage);
        setIsAiMessageApproved(false);
        toast({
          title: T.aiHumanizeSuccess,
          description: T.aiHumanizeSuccessDesc,
        });
      } catch (error) {
        console.error("Failed to humanize message:", error);
        toast({
          variant: "destructive",
          title: T.aiError,
          description: T.aiHumanizeError,
        });
      }
    });
  };

  const handleAnalyzeMessage = () => {
    startAnalyzeTransition(async () => {
      const message = form.getValues("message");
      if (!message) {
        toast({
          variant: "destructive",
          title: T.missingMessage,
          description: T.missingMessageDesc,
        });
        return;
      }

      try {
        const result = await analyzeMessage({ message, language });
        setAnalysisResult(result);
        setIsAnalysisDialogOpen(true);
      } catch (error) {
        console.error("Failed to analyze message:", error);
        toast({
          variant: "destructive",
          title: T.aiError,
          description: T.aiAnalyzeError,
        });
      }
    });
  };

  const handleApproveAiMessage = () => {
    if (humanizedMessage) {
      form.setValue("message", humanizedMessage);
      setIsAiMessageApproved(true);
      toast({
        title: T.aiApproveSuccess,
        description: T.aiApproveSuccessDesc,
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
    setAnalysisResult(null);
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
    <div className="grid grid-cols-1 gap-8">
      <Card className="w-full no-print">
        <CardHeader>
          <CardTitle className="font-headline text-2xl tracking-wider">
            {T.importantMessage}
          </CardTitle>
          <CardDescription>
            {T.formDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
               <div className="space-y-2">
                <FormLabel>Language / ቋንቋ</FormLabel>
                <RadioGroup
                  defaultValue="en"
                  onValueChange={(value: "en" | "am") => setLanguage(value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="en" id="r1" />
                    <FormLabel htmlFor="r1" className="font-normal">English</FormLabel>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="am" id="r2" />
                    <FormLabel htmlFor="r2" className="font-normal">Amharic (አማርኛ)</FormLabel>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                 <FormField
                  control={form.control}
                  name="recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{T.for}</FormLabel>
                      <FormControl>
                        <Input placeholder={T.recipientPlaceholder} {...field} />
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
                        <FormLabel>{T.date}</FormLabel>
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
                                  <span>{T.pickDate}</span>
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
                      <FormItem className="flex flex-col">
                        <FormLabel>{T.time}</FormLabel>
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
                          <FormLabel>{T.from}</FormLabel>
                          <FormControl>
                            <Input placeholder={T.senderNamePlaceholder} {...field} />
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
                          <FormLabel>{T.senderOrg}</FormLabel>
                          <FormControl>
                            <Input placeholder={T.senderOrgPlaceholder} {...field} />
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
                        <FormLabel>{T.phone}</FormLabel>
                        <FormControl>
                          <Input placeholder={T.phonePlaceholder} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <Separator />

              <div className="space-y-4">
                <FormLabel>{T.messageType}</FormLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
                            {item[language]}
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
                      <FormLabel>{T.message}</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[140px] resize-y"
                          placeholder={T.messagePlaceholder}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full">{T.createMessageSlip}</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4">
          <Card className="w-full">
            <CardHeader className="no-print">
                <CardTitle>{T.previewActions}</CardTitle>
                <CardDescription>
                    {T.previewDescription}
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
                        language={language}
                      />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2 no-print">
                <Button type="button" variant="ghost" onClick={handleClearForm} className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" /> {T.clear}
                </Button>
                <div className="flex w-full sm:w-auto sm:ml-auto gap-2 flex-wrap justify-center">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleAnalyzeMessage}
                        disabled={isAnalyzePending}
                        className="flex-1"
                    >
                        {isAnalyzePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                        {T.analyze}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleHumanizeMessage}
                        disabled={isHumanizePending}
                        className="flex-1"
                    >
                        {isHumanizePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                        {T.humanize}
                    </Button>
                    <Button type="button" variant="outline" onClick={handlePrint} disabled={!isFormSubmitted} className="flex-1">
                        <Printer className="mr-2 h-4 w-4" /> {T.print}
                    </Button>
                    <Button type="button" onClick={handleExportPng} disabled={!isFormSubmitted} className="flex-1">
                        <Camera className="mr-2 h-4 w-4" /> {T.exportPng}
                    </Button>
                    <Button type="button" onClick={handleExportPdf} disabled={!isFormSubmitted} className="flex-1">
                        <FileDown className="mr-2 h-4 w-4" /> {T.exportPdf}
                    </Button>
                </div>
            </CardFooter>
          </Card>
      </div>

      <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BrainCircuit className="h-6 w-6" />
              {T.analysisTitle}
            </DialogTitle>
            <DialogDescription>
              {T.analysisDescription}
            </DialogDescription>
          </DialogHeader>
          {analysisResult && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase text-muted-foreground">{T.tone}</h3>
                <Badge variant="secondary" className="text-base">{analysisResult.tone}</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase text-muted-foreground">{T.clarityScore}</h3>
                <div className="flex items-center gap-2">
                   <Progress value={analysisResult.clarityScore * 10} className="w-full h-3" />
                   <span className="font-bold text-lg">{analysisResult.clarityScore}/10</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase text-muted-foreground">{T.suggestions}</h3>
                <ul className="space-y-2 list-none">
                  {analysisResult.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-500" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
