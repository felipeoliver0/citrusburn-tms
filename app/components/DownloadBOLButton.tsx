'use client';

import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DAMAGE_CODES, DamageMarkerData } from './DamageMarker';
import { getImageUrlAsBase64 } from './bolActions';

interface LoadData {
  id: string;
  originCity: string;
  originZip?: string;
  originAddress?: string;
  destCity: string;
  destZip?: string;
  destAddress?: string;
  price: number;
  pickupVin: string | null;
  deliveryVin: string | null;
  pickupDamages: any;
  deliveryDamages: any;
  driverSignature: string | null;
  deliverySignature: string | null;
  brokerCompany: string;
  brokerMc?: string | null;
  brokerUsdot?: string | null;
  carrierCompany: string;
  carrierMc?: string | null;
  carrierUsdot?: string | null;
  paymentType?: string | null;
}

export default function DownloadBOLButton({ load }: { load: LoadData }) {
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateBOL = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const loadIdShort = load.id.slice(-8).toUpperCase();

    // Header
    doc.setFontSize(22);
    doc.text('BILL OF LADING', 14, 20);
    doc.setFontSize(10);
    doc.text(`Load ID: ${load.id}`, 14, 28);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 34);

    // Parties
    autoTable(doc, {
      startY: 40,
      head: [['Broker / Shipper', 'Carrier']],
      body: [[
        `${load.brokerCompany || 'N/A'}\nMC: ${load.brokerMc || 'N/A'} | USDOT: ${load.brokerUsdot || 'N/A'}`, 
        `${load.carrierCompany || 'N/A'}\nMC: ${load.carrierMc || 'N/A'} | USDOT: ${load.carrierUsdot || 'N/A'}`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });

    // Route
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 6,
      head: [['Origin', 'Destination']],
      body: [[
        `${load.originCity}\n${load.originAddress || '[HIDDEN UNTIL ASSIGNED]'}`, 
        `${load.destCity}\n${load.destAddress || '[HIDDEN UNTIL ASSIGNED]'}`
      ]],
      theme: 'grid',
    });

    // Vehicle Details
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 6,
      head: [['Pickup VIN', 'Delivery VIN', 'Payment Terms', 'Agreed Price']],
      body: [[load.pickupVin || 'Pending', load.deliveryVin || 'Pending', load.paymentType || 'COD', `$${load.price.toFixed(2)}`]],
      theme: 'grid',
    });

    // Format Damages helper
    const formatDamages = (damagesRaw: any) => {
      if (!damagesRaw) return 'No damages reported';
      try {
        const damages: DamageMarkerData[] = typeof damagesRaw === 'string' ? JSON.parse(damagesRaw) : damagesRaw;
        if (damages.length === 0) return 'No damages reported';
        return damages.map(d => `${d.code} (${DAMAGE_CODES[d.code]})`).join(', ');
      } catch (e) {
        return 'No damages reported';
      }
    };

    // Damages Table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 6,
      head: [['Inspection Phase', 'Reported Damages']],
      body: [
        ['Pickup', formatDamages(load.pickupDamages)],
        ['Delivery', formatDamages(load.deliveryDamages)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;

    // --- VISUAL DAMAGE DIAGRAMS ---
    doc.setFontSize(14);
    doc.text('Visual Damage Reports', 14, currentY);
    currentY += 5;

    const drawCarDiagram = (xStart: number, yStart: number, damagesRaw: any, label: string) => {
      // Dimensions
      const w = 30;
      const h = 60;

      // Label
      doc.setFontSize(10);
      doc.text(label, xStart + 5, yStart - 2);

      // Draw Car Shadow/Box
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(248, 250, 252);
      doc.rect(xStart, yStart, w, h, 'FD');

      // Draw Wheels
      doc.setFillColor(51, 65, 85);
      doc.rect(xStart + 4, yStart + 8, 3, 8, 'F');
      doc.rect(xStart + 23, yStart + 8, 3, 8, 'F');
      doc.rect(xStart + 4, yStart + 44, 3, 8, 'F');
      doc.rect(xStart + 23, yStart + 44, 3, 8, 'F');

      // Draw Body
      doc.setFillColor(226, 232, 240);
      doc.setDrawColor(148, 163, 184);
      doc.roundedRect(xStart + 6, yStart + 3, 18, 54, 4, 4, 'FD');

      // Roof
      doc.setFillColor(203, 213, 225);
      doc.rect(xStart + 9, yStart + 24, 12, 10, 'F');

      // Draw Damages
      try {
        const damages: DamageMarkerData[] = typeof damagesRaw === 'string' ? JSON.parse(damagesRaw) : damagesRaw;
        if (damages && damages.length > 0) {
          damages.forEach(d => {
            // d.x and d.y are percentages 0-100 of the container
            const dotX = xStart + (d.x / 100) * w;
            const dotY = yStart + (d.y / 100) * h;
            
            // Draw red dot
            doc.setFillColor(220, 38, 38);
            doc.circle(dotX, dotY, 2, 'F');
            
            // Draw text code
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(6);
            doc.text(d.code, dotX - 1.5, dotY + 2);
          });
        }
      } catch (e) {}

      // Reset text color
      doc.setTextColor(0, 0, 0);
    };

    drawCarDiagram(30, currentY, load.pickupDamages, 'Pickup Inspection');
    drawCarDiagram(120, currentY, load.deliveryDamages, 'Delivery Inspection');

    currentY += 75;

    // Signatures
    doc.setFontSize(12);
    doc.text('Signatures', 14, currentY);
    currentY += 8;

    if (load.driverSignature) {
      doc.setFontSize(10);
      doc.text('Pickup Signature:', 14, currentY);
      const sigBase64 = load.driverSignature.startsWith('http') 
        ? await getImageUrlAsBase64(load.driverSignature) 
        : load.driverSignature;
      
      if (sigBase64) {
        doc.addImage(sigBase64, 'PNG', 14, currentY + 5, 80, 25);
      } else {
        doc.text('(Error loading image)', 14, currentY + 15);
      }
    } else {
      doc.text('Pickup Signature: Pending', 14, currentY);
    }

    if (load.deliverySignature) {
      doc.setFontSize(10);
      doc.text('Delivery Signature:', 100, currentY);
      const sigBase64 = load.deliverySignature.startsWith('http') 
        ? await getImageUrlAsBase64(load.deliverySignature) 
        : load.deliverySignature;
      
      if (sigBase64) {
        doc.addImage(sigBase64, 'PNG', 100, currentY + 5, 80, 25);
      } else {
        doc.text('(Error loading image)', 100, currentY + 15);
      }
    } else {
      doc.text('Delivery Signature: Pending', 100, currentY);
    }

    doc.save(`BOL_${loadIdShort}.pdf`);
    } catch (e) {
      console.error("Error generating BOL:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button 
      onClick={generateBOL}
      disabled={isGenerating}
      className={`flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors ${
        isGenerating ? 'bg-brand-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-500'
      }`}
    >
      <FileDown size={14} /> {isGenerating ? 'Generating...' : 'Download BOL'}
    </button>
  );
}
