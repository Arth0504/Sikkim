import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export const generateInvoicePDF = async (data, isCancellation = false) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Top colored bar (crimson for cancellation, teal for booking)
      const themeColor = isCancellation ? '#b91c1c' : '#0d9488';
      doc.rect(0, 0, 612, 15).fill(themeColor); 

      // Header Brand
      doc.fillColor('#0f172a').fontSize(22).font('Helvetica-Bold').text("Monastery360", 50, 40);
      doc.fillColor(themeColor).fontSize(10).font('Helvetica-Bold').text("SIKKIM SPIRITUAL TOURS", 50, 65);
      
      const docTitle = isCancellation ? "CANCELLATION & REFUND RECEIPT" : "BOOKING CONFIRMATION RECEIPT";
      doc.fillColor('#475569').fontSize(12).font('Helvetica-Bold').text(docTitle, 320, 45, { align: 'right' });
      doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 320, 65, { align: 'right' });

      // Horizontal separator line
      doc.moveTo(50, 85).lineTo(562, 85).strokeColor('#e2e8f0').lineWidth(1).stroke();

      if (isCancellation) {
        // CANCELLATION DETAILS SECTION
        // Left Column: Traveler & Package details
        doc.fillColor(themeColor).fontSize(12).font('Helvetica-Bold').text("Traveler & Trip Details", 50, 105);
        
        let yLeft = 130;
        const travelerDetails = [
          { label: "Traveler Name:", val: `${data.firstName || data.userName || "Traveler"} ${data.lastName || ""}`.trim() },
          { label: "Package Name:", val: String(data.packageName || "N/A") },
          { label: "Travel Date:", val: String(data.travelDate || "N/A") },
          { label: "Payment Method:", val: String(data.paymentMethod || "online").toUpperCase() },
          { label: "Approved By Admin:", val: data.approvedByAdmin || "Yes (Admin Portal)" },
        ];

        travelerDetails.forEach(item => {
          doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text(item.label, 50, yLeft);
          doc.fillColor('#0f172a').fontSize(9).font('Helvetica').text(item.val, 155, yLeft);
          yLeft += 18;
        });

        // Right Column: Cancellation & Refund Details
        doc.fillColor(themeColor).fontSize(12).font('Helvetica-Bold').text("Cancellation & Refund Details", 320, 105);
        
        let yRight = 130;
        const refundDetails = [
          { label: "Refund ID:", val: String(data.refundId || "N/A") },
          { label: "Refund Status:", val: String(data.refundStatus || "Refunded").toUpperCase() },
          { label: "Refund Date:", val: String(data.refundDate || new Date().toLocaleDateString('en-IN')) },
          { label: "Refund Percentage:", val: `${data.refundPercent ?? 0}%` },
          { label: "Original Amount:", val: `Rs. ${data.amount}` },
        ];

        refundDetails.forEach(item => {
          doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text(item.label, 320, yRight);
          doc.fillColor('#0f172a').fontSize(9).font('Helvetica').text(item.val, 435, yRight);
          yRight += 18;
        });

        let endY = Math.max(yLeft, yRight) + 15;

        // Cancellation Reason full-width section
        doc.fillColor(themeColor).fontSize(10).font('Helvetica-Bold').text("Cancellation Reason:", 50, endY);
        endY += 15;
        doc.rect(50, endY, 512, 40).fill('#f8fafc').strokeColor('#e2e8f0').lineWidth(1).stroke();
        doc.fillColor('#334155').fontSize(9).font('Helvetica-Oblique').text(`"${data.cancellationReason || data.cancelReason || "No reason provided"}"`, 60, endY + 14, { width: 490 });
        endY += 55;

        // Horizontal line
        doc.moveTo(50, endY).lineTo(562, endY).strokeColor('#e2e8f0').lineWidth(1).stroke();
        endY += 15;

        // Refund Amount Paid Box
        doc.rect(50, endY, 512, 45).fill('#fef2f2');
        doc.fillColor('#991b1b').fontSize(12).font('Helvetica-Bold').text("Refund Amount (INR):", 65, endY + 16);
        doc.fillColor('#991b1b').fontSize(16).font('Helvetica-Bold').text(`Rs. ${data.refundAmount}`, 440, endY + 14, { align: 'right', width: 100 });
        endY += 75;

        // Add a warning/note box
        doc.rect(50, endY, 512, 60).fill('#f8fafc').strokeColor('#e2e8f0').lineWidth(1).stroke();
        doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text("Note on Refunds:", 60, endY + 10);
        doc.fillColor('#64748b').fontSize(8).font('Helvetica').text("This refund was processed automatically. Credits should reflect in your source account within 5-7 business days depending on your banking institution.", 60, endY + 25, { width: 490 });

      } else {
        // BOOKING DETAILS SECTION
        doc.fillColor('#0d9488').fontSize(12).font('Helvetica-Bold').text("Traveler Details", 50, 105);
        
        let y = 130;
        const travDetails = [
          { label: "Lead Name:", val: `${data.firstName || data.userName || "Traveler"} ${data.lastName || ""}`.trim() },
          { label: "Mobile Number:", val: String(data.mobile || "N/A") },
          { label: "Age:", val: String(data.age || "N/A") },
          { label: "Address:", val: String(data.address || "N/A") },
          { label: "ID Proof:", val: `${data.idProofType || "Aadhaar"}: ${data.idProofNumber || "N/A"}` },
        ];

        travDetails.forEach(item => {
          doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text(item.label, 50, y);
          doc.fillColor('#0f172a').fontSize(9).font('Helvetica').text(item.val, 150, y);
          y += 18;
        });

        // Package Details on Right side
        doc.fillColor('#0d9488').fontSize(12).font('Helvetica-Bold').text("Package Details", 320, 105);
        
        let yRight = 130;
        const pkgDetails = [
          { label: "Package Name:", val: String(data.packageName) },
          { label: "Travel Start Date:", val: String(data.travelDate) },
          { label: "Total Travelers:", val: `${data.persons || 1} Person(s)` },
          { label: "Payment Method:", val: String(data.paymentMethod || "online").toUpperCase() },
          { label: "Payment Status:", val: String(data.paymentStatus || "Paid").toUpperCase() },
        ];

        pkgDetails.forEach(item => {
          doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text(item.label, 320, yRight);
          doc.fillColor('#0f172a').fontSize(9).font('Helvetica').text(item.val, 430, yRight);
          yRight += 18;
        });

        // Co-Travelers List
        let endY = Math.max(y, yRight) + 20;
        if (data.travellers && data.travellers.length > 0) {
          doc.fillColor('#0d9488').fontSize(10).font('Helvetica-Bold').text("Co-Travelers List:", 50, endY);
          endY += 15;
          data.travellers.forEach((t, index) => {
            doc.fillColor('#0f172a').fontSize(9).font('Helvetica').text(`${index + 1}. ${t.name} (Age: ${t.age})`, 60, endY);
            endY += 14;
          });
          endY += 10;
        }

        // Horizontal line
        doc.moveTo(50, endY).lineTo(562, endY).strokeColor('#e2e8f0').lineWidth(1).stroke();
        endY += 20;

        // Amount paid box
        doc.rect(50, endY, 512, 45).fill('#f0fdf4');
        doc.fillColor('#166534').fontSize(12).font('Helvetica-Bold').text("Amount Paid (INR):", 65, endY + 16);
        doc.fillColor('#166534').fontSize(16).font('Helvetica-Bold').text(`Rs. ${data.amount}`, 440, endY + 14, { align: 'right', width: 100 });
        endY += 75;

        // QR Code
        try {
          const qrText = `BookingID: ${data.bookingId}\nName: ${data.firstName || data.userName}\nAmount: INR ${data.amount}\nStatus: Paid`;
          const qrCodeBuffer = await QRCode.toBuffer(qrText, { margin: 1, width: 90 });
          doc.image(qrCodeBuffer, 460, endY, { width: 90 });
          
          doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text("Scan to Verify", 460, endY + 95, { width: 90, align: 'center' });
        } catch (qrErr) {
          console.error("QR Code Generation Error in PDF:", qrErr);
        }

        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text("Thank you for your booking!", 50, endY + 20);
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text("Your spiritual journey is secured. We look forward to guiding you through the serene sanctuaries of Sikkim.", 50, endY + 40, { width: 380 });
      }

      // Footer
      doc.fillColor('#94a3b8').fontSize(8).font('Helvetica').text("For queries, contact support@monastery360.com | Sikkim Tourism Development Corporation", 50, 720, { align: 'center', width: 512 });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};

const generateInvoice = async (res, data, isCancellation = false) => {
  try {
    const pdfBuffer = await generateInvoicePDF(data, isCancellation);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${data.bookingId}.pdf`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Generate Invoice Response Error:", err);
    res.status(500).send("Error generating PDF invoice");
  }
};

export default generateInvoice;
