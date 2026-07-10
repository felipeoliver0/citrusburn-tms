'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GeneratePDFButton({ load }: { load: any }) {
  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      
      // Colors
      const primaryColor: [number, number, number] = [37, 99, 235]; // brand-600
      const textColor: [number, number, number] = [30, 41, 59]; // gray-800

      // Header Background
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 30, 'F');
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text('DISPATCH RATE CONFIRMATION', 14, 20);
      
      // ID & Status
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Load ID: ${load.id.substring(0,8).toUpperCase()}`, 150, 16);
      doc.text(`Status: ${load.status}`, 150, 22);
      
      // Reset text color
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      // Company Info Box
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('BROKER INFO', 14, 45);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${load.broker?.companyName || load.broker?.fullName || 'N/A'}`, 14, 52);
      doc.text(`Phone: ${load.broker?.phone || 'N/A'}`, 14, 58);
      doc.text(`Email: ${load.broker?.email || 'N/A'}`, 14, 64);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('CARRIER INFO', 110, 45);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${load.carrier?.companyName || load.carrier?.fullName || 'Unassigned'}`, 110, 52);
      doc.text(`Phone: ${load.carrier?.phone || 'N/A'}`, 110, 58);
      doc.text(`Email: ${load.carrier?.email || 'N/A'}`, 110, 64);

      // Route Info
      doc.setFillColor(241, 245, 249); // gray-100
      doc.rect(14, 75, 182, 45, 'F');
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('PICKUP LOCATION', 18, 85);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${new Date(load.pickupDate).toLocaleDateString()}`, 18, 92);
      doc.text(`City: ${load.originCity}, ${load.originZip}`, 18, 98);
      doc.setFont("helvetica", "bold");
      doc.text(`Address: ${load.originAddress || '[HIDDEN UNTIL ASSIGNED]'}`, 18, 104);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('DELIVERY LOCATION', 110, 85);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${new Date(load.deliveryDate).toLocaleDateString()}`, 110, 92);
      doc.text(`City: ${load.destCity}, ${load.destZip}`, 110, 98);
      doc.setFont("helvetica", "bold");
      doc.text(`Address: ${load.destAddress || '[HIDDEN UNTIL ASSIGNED]'}`, 110, 104);

      // Load Details Table
      let vehicles = [];
      try {
        vehicles = typeof load.vehiclesData === 'string' ? JSON.parse(load.vehiclesData) : load.vehiclesData;
      } catch (e) {}

      autoTable(doc, {
        startY: 130,
        head: [['Year', 'Make', 'Model', 'Type', 'Condition']],
        body: vehicles.map((v: any) => [v.year || '-', v.make || '-', v.model || '-', v.type || '-', v.operable ? 'Runs' : 'Inop']),
        theme: 'striped',
        headStyles: { fillColor: primaryColor }
      });

      // Financials
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('RATE AND PAYMENT TERMS', 14, finalY);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Distance: ${load.distance} miles`, 14, finalY + 10);
      doc.text(`Payment Type: ${load.paymentType}`, 14, finalY + 16);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL PAY: $${load.price.toFixed(2)}`, 140, finalY + 16);

      // Footer
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text('This document serves as a binding rate confirmation agreement between Broker and Carrier.', 14, 280);
      doc.text('Generated securely by America Dispatch TMS.', 14, 285);

      doc.save(`Dispatch-Load-${load.id.substring(0,8)}.pdf`);
      toast.success('PDF Generated Successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <button 
      onClick={generatePDF}
      className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg transition-colors text-xs"
    >
      <Download size={16} />
      Download PDF
    </button>
  );
}
