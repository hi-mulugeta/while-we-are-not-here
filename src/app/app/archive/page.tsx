
'use client';

import { useMemo, useState, useRef } from 'react';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, orderBy } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { MessageSlipDisplay } from '@/components/message-slip-display';
import { Button } from '@/components/ui/button';
import { Printer, FileDown, Camera } from 'lucide-react';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ArchivePage() {
  const { firestore, user } = useFirebase();
  const { profile } = useUserProfile();
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const slipsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    
    const baseQuery = collection(firestore, 'messageSlips');

    if (profile?.role === 'admin') {
      return query(baseQuery, orderBy('createdAt', 'desc'));
    }
    
    return query(baseQuery, where('creatorId', '==', user.uid), orderBy('createdAt', 'desc'));

  }, [firestore, user, profile]);

  const { data: slips, isLoading } = useCollection(slipsQuery);

  const handlePrint = () => {
    const slipContent = printRef.current;
    if (!slipContent) return;

    const printWindow = window.open('', '', 'height=800,width=800');
    if (printWindow) {
        printWindow.document.write('<html><head><title>Print Message Slip</title>');
        printWindow.document.write('<link rel="stylesheet" href="/app/globals.css" type="text/css" />');
        printWindow.document.write('<style>@media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(slipContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
    }
  };

  const handleExportPdf = () => {
    const input = printRef.current;
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
    const input = printRef.current;
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


  if (isLoading) {
    return <p>Loading archived messages...</p>;
  }

  const slipDataForDisplay = selectedSlip ? {
    ...selectedSlip,
    date: selectedSlip.date ? new Date(selectedSlip.date) : new Date(),
  } : null;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Message Archive</CardTitle>
          <CardDescription>
            {profile?.role === 'admin' ? 'Viewing all message slips.' : 'Viewing your created message slips.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>From</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="hidden lg:table-cell">Message</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slips && slips.length > 0 ? (
                slips.map((slip) => (
                  <TableRow key={slip.id} onClick={() => setSelectedSlip(slip)} className="cursor-pointer">
                    <TableCell className="font-medium">{slip.recipient}</TableCell>
                    <TableCell>{slip.senderName}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {slip.date ? format(new Date(slip.date), 'PP') : 'N/A'} at {slip.time}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-xs truncate">
                      {slip.message}
                    </TableCell>
                    <TableCell className="text-right">
                        {slip.statusUrgent && <Badge variant="destructive" className="mr-1">Urgent</Badge>}
                        {slip.statusRush && <Badge variant="destructive" className="mr-1">Rush</Badge>}
                        {slip.statusPleaseCall && <Badge>Please Call</Badge>}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No archived messages found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedSlip} onOpenChange={(isOpen) => !isOpen && setSelectedSlip(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Archived Message Preview</DialogTitle>
            <DialogDescription>
                Preview of the message slip for {selectedSlip?.recipient} from {selectedSlip?.senderName}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
              <div ref={printRef}>
                <MessageSlipDisplay data={slipDataForDisplay} humanizedMessage={null} isApproved={true} />
              </div>
          </div>
          <DialogFooter className="no-print">
            <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
            <Button onClick={handleExportPng}><Camera className="mr-2 h-4 w-4" /> Export PNG</Button>
            <Button onClick={handleExportPdf}><FileDown className="mr-2 h-4 w-4" /> Export PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
