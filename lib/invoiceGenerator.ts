import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Definindo a interface para tipagem dos dados da Invoice
export interface InvoiceData {
  loadId: string;
  date: string;
  origin: string;
  destination: string;
  price: number;
  vin: string;
  brokerCompany: string;
  brokerAddress?: string;
  brokerCity?: string;
  brokerState?: string;
  brokerZip?: string;
  
  carrierCompany: string;
  carrierAddress?: string;
  carrierCity?: string;
  carrierState?: string;
  carrierZip?: string;
  carrierPhone?: string;
}

export function generateInvoice(data: InvoiceData) {
  // Cria um documento PDF em formato A4
  const doc = new jsPDF('p', 'pt', 'a4');

  // Cores da Marca (Laranja/Cinza)
  const brandColor = '#EA580C'; // Laranja Tailwind
  const textColor = '#333333';

  // --- HEADER ---
  doc.setFontSize(28);
  doc.setTextColor(brandColor);
  doc.text('INVOICE', 40, 60);

  doc.setFontSize(10);
  doc.setTextColor(textColor);
  const invoiceNumber = `INV-${data.loadId.split('-')[0].toUpperCase()}`;
  doc.text(`Invoice #: ${invoiceNumber}`, 40, 80);
  doc.text(`Date: ${data.date}`, 40, 95);
  doc.text(`Load ID: ${data.loadId}`, 40, 110);

  // Informações da Transportadora (Quem está cobrando)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(data.carrierCompany || 'Carrier Company LLC', 350, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.carrierAddress || 'Address Not Provided', 350, 75);
  doc.text(`${data.carrierCity || 'City'}, ${data.carrierState || 'ST'} ${data.carrierZip || '00000'}`, 350, 90);
  doc.text(`Phone: ${data.carrierPhone || 'N/A'}`, 350, 105);

  // Linha separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(40, 130, 550, 130);

  // --- BILL TO (Quem vai pagar) ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 40, 160);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.brokerCompany || 'Broker Company', 40, 175);
  doc.text(data.brokerAddress || 'Address Not Provided', 40, 190);
  doc.text(`${data.brokerCity || 'City'}, ${data.brokerState || 'ST'} ${data.brokerZip || '00000'}`, 40, 205);

  // --- ROTA ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ROUTE DETAILS:', 350, 160);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Origin: ${data.origin}`, 350, 175);
  doc.text(`Destination: ${data.destination}`, 350, 190);

  // --- TABELA DE ITENS (AUTOTABLE) ---
  autoTable(doc, {
    startY: 230,
    head: [['Description', 'VIN / Reference', 'Qty', 'Amount']],
    body: [
      ['Auto Transport Services', data.vin || 'N/A', '1', `$${data.price.toFixed(2)}`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [234, 88, 12] }, // Laranja
    styles: { fontSize: 10, cellPadding: 8 },
    columnStyles: {
      3: { halign: 'right' }
    }
  });

  // --- TOTAL ---
  const finalY = (doc as any).lastAutoTable.finalY + 30;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DUE:', 380, finalY);
  doc.setTextColor(brandColor);
  doc.text(`$${data.price.toFixed(2)}`, 480, finalY);

  // --- RODAPÉ / TERMOS ---
  doc.setTextColor(textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions:', 40, finalY + 40);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Payment is due upon receipt unless otherwise agreed.', 40, finalY + 55);
  doc.text('If using a factoring company, please remit payment to the Notice of Assignment provided.', 40, finalY + 70);
  
  // Salva o PDF no navegador do usuário
  doc.save(`Invoice_${invoiceNumber}.pdf`);
}
