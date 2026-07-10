'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DownloadContractButton({ load, currentUser }: { load: any, currentUser: any }) {

  const generatePDF = () => {
    const doc = new jsPDF();
    const isBroker = currentUser.role === 'BROKER';
    
    // We assume load.broker and load.carrier are populated when calling this component
    const brokerName = load.broker?.companyName || load.broker?.fullName || 'N/A';
    const brokerPhone = load.broker?.phone || 'N/A';
    const brokerEmail = load.broker?.email || 'N/A';
    
    const carrierName = load.carrier?.companyName || load.carrier?.fullName || currentUser.companyName || currentUser.fullName || 'N/A';
    const carrierPhone = load.carrier?.phone || currentUser.phone || 'N/A';
    const carrierMC = load.carrier?.mcNumber || currentUser.mcNumber || 'N/A';
    const carrierEmail = load.carrier?.email || currentUser.email || 'N/A';

    // Fonts & Colors
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(217, 119, 6); // Brand Color (Amber 600)
    
    // Header
    doc.text('H ESTOKER DISPATCH', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text('RATE CONFIRMATION / DISPATCH AGREEMENT', 105, 28, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const contractDate = new Date().toLocaleDateString('en-US');
    doc.text(`Load ID: ${load.id.split('-')[0]}`, 14, 40);
    doc.text(`Date Issued: ${contractDate}`, 150, 40);
    
    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 43, 196, 43);

    // Parties
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('BROKER INFORMATION', 14, 52);
    doc.text('CARRIER INFORMATION', 110, 52);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Company: ${brokerName}`, 14, 58);
    doc.text(`Email: ${brokerEmail}`, 14, 64);
    doc.text(`Phone: ${brokerPhone}`, 14, 70);

    doc.text(`Company: ${carrierName}`, 110, 58);
    doc.text(`MC Number: ${carrierMC}`, 110, 64);
    doc.text(`Email: ${carrierEmail}`, 110, 70);
    doc.text(`Phone: ${carrierPhone}`, 110, 76);

    // Load Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('LOAD DETAILS', 14, 90);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Price: $${load.price.toFixed(2)}`, 14, 98);
    doc.text(`Total Distance: ${load.distance} miles`, 14, 104);
    doc.text(`Rate per Mile: $${(load.price / (load.distance || 1)).toFixed(2)}`, 14, 110);
    doc.text(`Trailer Type Required: ${load.trailerType}`, 110, 98);
    doc.text(`Payment Terms: ${load.paymentType}`, 110, 104);

    // Route
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ROUTE INFORMATION', 14, 124);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Pick-up Date: ${load.pickupDate ? new Date(load.pickupDate).toLocaleDateString() : 'TBD'}`, 14, 132);
    doc.text(`City: ${load.originCity}, ${load.originZip}`, 14, 138);
    doc.text(`Address: ${load.originAddress || '[HIDDEN UNTIL ASSIGNED]'}`, 14, 144);
    
    doc.text(`Delivery Date: ${load.deliveryDate ? new Date(load.deliveryDate).toLocaleDateString() : 'TBD'}`, 110, 132);
    doc.text(`City: ${load.destCity}, ${load.destZip}`, 110, 138);
    doc.text(`Address: ${load.destAddress || '[HIDDEN UNTIL ASSIGNED]'}`, 110, 144);

    // Vehicles Table
    const vehiclesArray = Array.isArray(load.vehiclesData) ? load.vehiclesData : JSON.parse(load.vehiclesData || '[]');
    const tableData = vehiclesArray.map((v: any, index: number) => [
      index + 1,
      v.model || 'Unknown',
      v.type || 'N/A',
      v.operable ? 'Yes (Runs)' : 'No (INOP)'
    ]);

    autoTable(doc, {
      startY: 150,
      head: [['#', 'Vehicle Model / Make', 'Type', 'Operable']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [217, 119, 6] },
      styles: { fontSize: 9 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 160;

    // Terms & Conditions
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const terms = "By signing below, the Carrier agrees to transport the listed vehicles from the origin to the destination as detailed above. Carrier is responsible for proper insurance coverage during transit. Any damages must be reported immediately. Payment will be released according to the Payment Terms upon receipt of a clean Bill of Lading (BOL).";
    const splitTerms = doc.splitTextToSize(terms, 180);
    doc.text(splitTerms, 14, finalY + 15);

    // Signatures
    doc.setDrawColor(0, 0, 0);
    doc.line(14, finalY + 45, 90, finalY + 45); // Broker line
    doc.line(110, finalY + 45, 196, finalY + 45); // Carrier line

    if (load.driverSignature) {
      doc.addImage(load.driverSignature, 'PNG', 120, finalY + 25, 50, 20);
    }
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Broker Signature / Date', 14, finalY + 50);
    doc.text('Carrier Signature / Date', 110, finalY + 50);

    // Save PDF
    doc.save(`Rate_Confirmation_${load.id.split('-')[0]}.pdf`);
  };

  return (
    <button 
      onClick={generatePDF}
      className="bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5 shadow-sm"
    >
      <span>📄</span> Download Contract
    </button>
  );
}
