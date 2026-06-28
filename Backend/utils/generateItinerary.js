import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export const generateItineraryPDF = async (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const themeColor = '#0d9488'; // Teal branding color
      
      // Top colored bar
      doc.rect(0, 0, 612, 12).fill(themeColor); 

      // Header Brand
      doc.fillColor('#0f172a').fontSize(18).font('Helvetica-Bold').text("Monastery360", 40, 30);
      doc.fillColor(themeColor).fontSize(8).font('Helvetica-Bold').text("SIKKIM SPIRITUAL TOURS", 40, 50);
      
      doc.fillColor('#475569').fontSize(10).font('Helvetica-Bold').text("OFFICIAL TRAVEL ITINERARY", 320, 32, { align: 'right', width: 252 });
      doc.fillColor('#94a3b8').fontSize(8).font('Helvetica').text(`Issued: ${new Date().toLocaleDateString('en-IN')}`, 320, 48, { align: 'right', width: 252 });

      // Horizontal separator line
      doc.moveTo(40, 65).lineTo(572, 65).strokeColor('#e2e8f0').lineWidth(1).stroke();

      // TRAVELER & TRIP SUMMARY SECTION (Side-by-side Columns)
      doc.fillColor(themeColor).fontSize(10).font('Helvetica-Bold').text("Lead Traveler Details", 40, 80);
      let yLeft = 98;
      const travelerDetails = [
        { label: "Name:", val: `${data.firstName || "Traveler"} ${data.lastName || ""}`.trim() },
        { label: "Mobile:", val: String(data.mobile || "N/A") },
        { label: "Age / ID:", val: `${data.age} yrs (${data.idProofType || "Aadhaar"}: ${data.idProofNumber || "N/A"})` },
        { label: "Address:", val: String(data.address || "N/A") },
      ];

      travelerDetails.forEach(item => {
        doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text(item.label, 40, yLeft);
        doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica').text(item.val, 100, yLeft, { width: 180 });
        yLeft += 14;
      });

      doc.fillColor(themeColor).fontSize(10).font('Helvetica-Bold').text("Journey Details", 330, 80);
      let yRight = 98;
      const pkgDetails = [
        { label: "Booking ID:", val: String(data.bookingId) },
        { label: "Package:", val: String(data.packageName) },
        { label: "Start Date:", val: String(data.travelStartDateString) },
        { label: "Travelers:", val: `${data.persons || 1} Person(s)` },
      ];

      pkgDetails.forEach(item => {
        doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text(item.label, 330, yRight);
        doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica').text(item.val, 400, yRight, { width: 172 });
        yRight += 14;
      });

      let currentY = Math.max(yLeft, yRight) + 10;

      // Helper for page breaks and space checks
      const ensureSpace = (neededHeight, hasHeader = false) => {
        if (currentY + neededHeight > 740) {
          doc.addPage();
          doc.rect(0, 0, 612, 12).fill(themeColor);
          if (hasHeader) {
            doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text("Monastery360 Itinerary (Contd.)", 40, 25);
            doc.moveTo(40, 42).lineTo(572, 42).strokeColor('#e2e8f0').lineWidth(1).stroke();
            currentY = 55;
          } else {
            currentY = 40;
          }
          return true;
        }
        return false;
      };

      // Co-Travelers List if applicable
      if (data.travellers && data.travellers.length > 0) {
        doc.fillColor(themeColor).fontSize(9).font('Helvetica-Bold').text("Co-Travelers:", 40, currentY);
        let coTravText = data.travellers.map((t, idx) => `${idx + 1}. ${t.name} (Age: ${t.age})`).join("  |  ");
        doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica').text(coTravText, 110, currentY, { width: 462 });
        currentY += 16;
      }

      // Horizontal line separator
      doc.moveTo(40, currentY).lineTo(572, currentY).strokeColor('#e2e8f0').lineWidth(1).stroke();
      currentY += 10;

      // DRIVER DETAILS (Only show card if assigned, else compact pending text)
      if (data.driver) {
        doc.rect(40, currentY, 532, 40).fill('#f0fdf4').strokeColor('#bcf0da').lineWidth(1).stroke();
        doc.fillColor('#166534').fontSize(8).font('Helvetica-Bold').text("DRIVER ALLOCATED:", 52, currentY + 8);
        doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica').text(`${data.driver.name} (Phone: ${data.driver.phone})`, 160, currentY + 8);
        doc.fillColor('#166534').fontSize(8).font('Helvetica-Bold').text("VEHICLE:", 52, currentY + 22);
        doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica').text(`${data.driver.vehicleType} (${data.driver.vehicleNumber})`, 160, currentY + 22);
        currentY += 50;
      } else {
        doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Oblique').text("Driver details will be shared 24 hours before departure.", 40, currentY);
        currentY += 18;
      }

      // DAY-WISE SCHEDULE
      ensureSpace(30, true);
      doc.fillColor(themeColor).fontSize(10).font('Helvetica-Bold').text("Day-Wise Travel Schedule", 40, currentY);
      currentY += 14;

      const itinerary = data.itinerary || [];
      for (let i = 0; i < itinerary.length; i++) {
        const day = itinerary[i];

        // Generate day date
        const d = new Date(data.travelStartDate);
        d.setDate(d.getDate() + (day.day - 1));
        const dayDateString = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

        // Day Title & Date on single line
        const dayHeading = `Day ${day.day} (${dayDateString}): ${day.title || `Activity`}`;
        
        let dayHeight = 15; // heading
        let descHeight = 0;
        if (day.description) {
          descHeight = doc.heightOfString(day.description, { width: 517, fontSize: 8.5, font: 'Helvetica', lineGap: 1 });
          dayHeight += descHeight + 4;
        }
        if (day.hotel) {
          dayHeight += 11;
        }
        dayHeight += 8; // margin between days

        ensureSpace(dayHeight, true);

        doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text(dayHeading, 40, currentY);
        currentY += 13;

        let contentX = 55;
        if (day.description) {
          doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(day.description, contentX, currentY, { width: 517, lineGap: 1 });
          currentY += descHeight + 4;
        }

        if (day.hotel) {
          doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text("Night Stay:", contentX, currentY);
          doc.fillColor('#0f172a').fontSize(8).font('Helvetica').text(day.hotel, contentX + 55, currentY);
          currentY += 11;
        }

        currentY += 6; // Compact gap between days
      }

      // POLICIES SECTION (Rendered as proper compact bullet list)
      const policies = data.policies || [
        "Carry valid ID proofs (Aadhaar/Passport/Driving License) at all times.",
        "Respect local custom traditions and dress appropriately at monasteries.",
        "Weather in Sikkim changes rapidly; carry suitable warm clothing.",
        "Permits are required for restricted areas. Co-operate with guides."
      ];

      // Estimate title height + space
      ensureSpace(35);
      doc.fillColor(themeColor).fontSize(10).font('Helvetica-Bold').text("Important Guidelines & Policies", 40, currentY);
      currentY += 14;

      policies.forEach(p => {
        const itemHeight = doc.heightOfString(p, { width: 515, fontSize: 8.5, font: 'Helvetica', lineGap: 1 }) + 3;
        ensureSpace(itemHeight);
        
        doc.fillColor(themeColor).fontSize(9).text("•", 45, currentY);
        doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(p, 57, currentY, { width: 515, lineGap: 1 });
        currentY += itemHeight;
      });

      // QR CODE AND SIGN-OFF
      ensureSpace(80);
      currentY += 10;

      doc.moveTo(40, currentY).lineTo(572, currentY).strokeColor('#e2e8f0').lineWidth(1).stroke();
      currentY += 10;

      // QR Code
      try {
        const qrText = `Monastery360 Itinerary\nBooking ID: ${data.bookingId}\nName: ${data.firstName} ${data.lastName}\nPackage: ${data.packageName}\nTravel Date: ${data.travelStartDateString}\nDriver: ${data.driver ? data.driver.name : "Allocation Pending"}`;
        const qrCodeBuffer = await QRCode.toBuffer(qrText, { margin: 1, width: 60 });
        doc.image(qrCodeBuffer, 510, currentY, { width: 60 });
      } catch (qrErr) {
        console.error("QR Code Generation Error in Itinerary PDF:", qrErr);
      }

      doc.fillColor(themeColor).fontSize(10).font('Helvetica-Bold').text("Have an enriching journey!", 40, currentY + 5);
      doc.fillColor('#64748b').fontSize(8).font('Helvetica').text("This travel document is issued under Sikkim Tourism norms. Please carry it in print or digital copy.", 40, currentY + 18, { width: 450 });

      // Footer
      doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica').text("Support: support@monastery360.com | Sikkim Tourism Development Corporation", 40, 755, { align: 'center', width: 532 });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};

const generateItinerary = async (res, data) => {
  try {
    const pdfBuffer = await generateItineraryPDF(data);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=itinerary_${data.bookingId}.pdf`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Generate Itinerary Response Error:", err);
    res.status(500).send("Error generating PDF itinerary");
  }
};

export default generateItinerary;
