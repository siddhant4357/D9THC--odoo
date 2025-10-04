import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate Professional PDF Expense Report
 * COMPLETELY REDESIGNED - No overlapping, proper layout, beautiful design
 */
export const generateExpenseReport = async (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 60, bottom: 60, left: 60, right: 60 }
      });
      
      const fileName = `expense-report-${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../uploads', fileName);
      const writeStream = fs.createWriteStream(filePath);
      
      doc.pipe(writeStream);

      // === HEADER SECTION ===
      doc.rect(0, 0, doc.page.width, 120).fill('#7C3AED'); // Purple header
      
      // Company Name (Large, White)
      doc.fillColor('#FFFFFF')
         .fontSize(32)
         .font('Helvetica-Bold')
         .text('EXPENSE REPORT', 60, 30, { width: doc.page.width - 120 });
      
      doc.fontSize(14)
         .font('Helvetica')
         .text(reportData.company.name, 60, 70);
      
      // Report Date & Time (Right side)
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      doc.fontSize(11)
         .text(`Generated on ${dateStr}`, 60, 92);
      doc.fontSize(10)
         .fillColor('#E0E0FF')
         .text(`at ${timeStr}`, 60, 107);

      // === SUMMARY SECTION ===
      let yPos = 150;
      
      doc.fillColor('#000000')
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('Financial Summary', 60, yPos);
      
      yPos += 40;
      
      // Summary Cards (4 boxes in a row with better spacing)
      const summaryData = [
        { label: 'Total Expenses', value: reportData.totals.count, unit: 'items', color: '#7C3AED' },
        { label: 'Total Amount', value: `${formatCurrency(reportData.totals.amount, reportData.company.currency)}`, unit: '', color: '#10B981' },
        { label: 'Approved', value: `${formatCurrency(reportData.totals.approved, reportData.company.currency)}`, unit: '', color: '#3B82F6' },
        { label: 'Pending', value: `${formatCurrency(reportData.totals.pending, reportData.company.currency)}`, unit: '', color: '#F59E0B' },
      ];
      
      const cardWidth = 115;
      const cardGap = 10;
      let xPos = 60;
      
      summaryData.forEach((item) => {
        // Card background with border
        doc.rect(xPos, yPos, cardWidth, 70)
           .strokeColor(item.color)
           .lineWidth(2)
           .stroke();
        
        doc.rect(xPos, yPos, cardWidth, 70)
           .fillColor(item.color)
           .opacity(0.08)
           .fill();
        
        doc.opacity(1);
        
        // Card label
        doc.fillColor('#666666')
           .fontSize(9)
           .font('Helvetica')
           .text(item.label, xPos + 10, yPos + 12, { width: cardWidth - 20, align: 'left' });
        
        // Card value (number)
        doc.fillColor(item.color)
           .fontSize(20)
           .font('Helvetica-Bold')
           .text(item.value.toString(), xPos + 10, yPos + 30, { width: cardWidth - 20, align: 'left' });
        
        // Unit text
        if (item.unit) {
          doc.fillColor('#999999')
             .fontSize(8)
             .font('Helvetica')
             .text(item.unit, xPos + 10, yPos + 55);
        }
        
        xPos += cardWidth + cardGap;
      });
      
      yPos += 100;

      // === CATEGORY BREAKDOWN ===
      doc.fillColor('#000000')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text('Spending by Category', 60, yPos);
      
      yPos += 35;
      
      if (reportData.byCategory && reportData.byCategory.length > 0) {
        const maxAmount = reportData.totals.amount;
        
        reportData.byCategory.forEach((cat) => {
          if (yPos > 680) {
            doc.addPage();
            yPos = 60;
          }
          
          // Category name
          doc.fillColor('#333333')
             .fontSize(12)
             .font('Helvetica-Bold')
             .text(cat.category, 60, yPos, { width: 120 });
          
          // Amount (right side)
          doc.fillColor('#7C3AED')
             .fontSize(12)
             .font('Helvetica-Bold')
             .text(formatCurrency(cat.amount, reportData.company.currency), 400, yPos, { width: 135, align: 'right' });
          
          // Count (small text)
          doc.fillColor('#999999')
             .fontSize(9)
             .font('Helvetica')
             .text(`${cat.count} expense${cat.count > 1 ? 's' : ''}`, 60, yPos + 17, { width: 120 });
          
          // Progress bar
          const barWidth = 475;
          const percentage = (cat.amount / maxAmount) * 100;
          const filledWidth = (barWidth * percentage) / 100;
          
          // Background bar
          doc.rect(60, yPos + 32, barWidth, 10)
             .fillColor('#F0F0F0')
             .fill();
          
          // Filled bar (gradient effect with color)
          doc.rect(60, yPos + 32, filledWidth, 10)
             .fillColor('#7C3AED')
             .fill();
          
          // Percentage text on bar
          if (percentage > 15) {
            doc.fillColor('#FFFFFF')
               .fontSize(8)
               .font('Helvetica-Bold')
               .text(`${percentage.toFixed(1)}%`, 65, yPos + 34);
          } else {
            doc.fillColor('#7C3AED')
               .fontSize(8)
               .font('Helvetica-Bold')
               .text(`${percentage.toFixed(1)}%`, 65 + filledWidth + 5, yPos + 34);
          }
          
          yPos += 55;
        });
      }
      
      yPos += 20;

      // === TOP EXPENSES TABLE (Always new page) ===
      doc.addPage();
      yPos = 60;
      
      doc.fillColor('#000000')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text('Top 10 Expenses', 60, yPos);
      
      yPos += 35;
      
      // Table Header
      doc.rect(60, yPos, 475, 30)
         .fillColor('#7C3AED')
         .fill();
      
      doc.fillColor('#FFFFFF')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Date', 70, yPos + 10, { width: 80 })
         .text('Description', 160, yPos + 10, { width: 150 })
         .text('Category', 320, yPos + 10, { width: 100 })
         .text('Amount', 430, yPos + 10, { width: 95, align: 'right' });
      
      yPos += 30;
      
      // Table Rows
      if (reportData.topExpenses && reportData.topExpenses.length > 0) {
        reportData.topExpenses.slice(0, 10).forEach((expense, index) => {
          // Check if we need a new page
          if (yPos > 720) {
            doc.addPage();
            yPos = 60;
            
            // Redraw header on new page
            doc.rect(60, yPos, 475, 30)
               .fillColor('#7C3AED')
               .fill();
            
            doc.fillColor('#FFFFFF')
               .fontSize(10)
               .font('Helvetica-Bold')
               .text('Date', 70, yPos + 10, { width: 80 })
               .text('Description', 160, yPos + 10, { width: 150 })
               .text('Category', 320, yPos + 10, { width: 100 })
               .text('Amount', 430, yPos + 10, { width: 95, align: 'right' });
            
            yPos += 30;
          }
          
          // Alternating row colors
          if (index % 2 === 0) {
            doc.rect(60, yPos, 475, 35)
               .fillColor('#FAFAFA')
               .fill();
          }
          
          // Date
          doc.fillColor('#555555')
             .fontSize(10)
             .font('Helvetica')
             .text(
               new Date(expense.date).toLocaleDateString('en-US', { 
                 month: 'short', 
                 day: 'numeric',
                 year: 'numeric'
               }), 
               70, 
               yPos + 10,
               { width: 80, lineBreak: false }
             );
          
          // Description (truncate if needed)
          const description = expense.description.length > 22 
            ? expense.description.substring(0, 20) + '...' 
            : expense.description;
          doc.text(description, 160, yPos + 10, { width: 150, lineBreak: false });
          
          // Category
          doc.text(expense.category, 320, yPos + 10, { width: 100, lineBreak: false });
          
          // Amount (bold, purple)
          doc.fillColor('#7C3AED')
             .fontSize(11)
             .font('Helvetica-Bold')
             .text(
               formatCurrency(expense.amount, expense.currency), 
               430, 
               yPos + 10, 
               { width: 95, align: 'right', lineBreak: false }
             );
          
          yPos += 35;
        });
      }

      // === FOOTER ON ALL PAGES ===
      doc.end();
      
      // Wait for document to finish rendering before adding footers
      doc.on('end', () => {
        // We can't add footers after doc.end() with pdfkit
        // Footers need to be added while building
      });
      
      // Add footer to all pages before ending
      const pageRange = doc.bufferedPageRange();
      const pageCount = pageRange.count;
      
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(pageRange.start + i);
        
        // Footer line
        doc.moveTo(60, doc.page.height - 70)
           .lineTo(doc.page.width - 60, doc.page.height - 70)
           .strokeColor('#CCCCCC')
           .lineWidth(1)
           .stroke();
        
        // Footer text - Report generation info
        doc.fillColor('#888888')
           .fontSize(9)
           .font('Helvetica')
           .text(
             `Report generated on ${dateStr} at ${timeStr}`,
             60,
             doc.page.height - 55,
             { width: 200, align: 'left' }
           );
        
        // Company name (center)
        doc.text(
          reportData.company.name,
          60,
          doc.page.height - 55,
          { width: doc.page.width - 120, align: 'center' }
        );
        
        // Page number (right)
        doc.text(
          `Page ${i + 1} of ${pageCount}`,
          doc.page.width - 200,
          doc.page.height - 55,
          { width: 140, align: 'right' }
        );
      }
      
      writeStream.on('finish', () => {
        resolve({
          fileName,
          filePath,
          url: `/uploads/${fileName}`
        });
      });
      
      writeStream.on('error', (err) => {
        console.error('PDF write stream error:', err);
        reject(err);
      });
      
    } catch (error) {
      console.error('Generate PDF error:', error);
      reject(error);
    }
  });
};

/**
 * Generate Individual Employee Report
 */
export const generateEmployeeReport = async (employeeData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 60, bottom: 60, left: 60, right: 60 } });
      const fileName = `employee-expenses-${employeeData.employee.name.replace(/\s/g, '-')}-${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../uploads', fileName);
      const writeStream = fs.createWriteStream(filePath);
      
      doc.pipe(writeStream);

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      // Header
      doc.rect(0, 0, doc.page.width, 100).fill('#7C3AED');
      doc.fillColor('#FFFFFF')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text('EMPLOYEE EXPENSE REPORT', 60, 30);
      
      doc.fontSize(12)
         .text(`Generated: ${dateStr} at ${timeStr}`, 60, 70);
      
      let yPos = 130;
      
      // Employee Info
      doc.fillColor('#000000')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text(employeeData.employee.name, 60, yPos);
      
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#666666')
         .text(employeeData.employee.email, 60, yPos + 22);
      
      yPos += 60;
      
      // Summary boxes
      doc.fillColor('#000000')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text('Summary', 60, yPos);
      
      yPos += 35;
      
      const stats = [
        { label: 'Submitted', value: employeeData.totals.submitted, color: '#F59E0B' },
        { label: 'Approved', value: employeeData.totals.approved, color: '#10B981' },
        { label: 'Pending', value: employeeData.totals.pending, color: '#3B82F6' },
        { label: 'Rejected', value: employeeData.totals.rejected, color: '#EF4444' },
      ];
      
      let xPos = 60;
      stats.forEach(stat => {
        doc.rect(xPos, yPos, 115, 65)
           .strokeColor(stat.color)
           .lineWidth(2)
           .stroke();
        
        doc.rect(xPos, yPos, 115, 65)
           .fillColor(stat.color)
           .opacity(0.08)
           .fill();
        
        doc.opacity(1)
           .fillColor('#666666')
           .fontSize(9)
           .font('Helvetica')
           .text(stat.label, xPos + 10, yPos + 12);
        
        doc.fontSize(24)
           .fillColor(stat.color)
           .font('Helvetica-Bold')
           .text(stat.value.toString(), xPos + 10, yPos + 28);
        
        xPos += 125;
      });
      
      yPos += 90;
      
      // Expense List
      doc.fillColor('#000000')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('Expense Details', 60, yPos);
      
      yPos += 30;
      
      employeeData.expenses.forEach((expense) => {
        if (yPos > 680) {
          doc.addPage();
          yPos = 60;
        }
        
        doc.rect(60, yPos, 475, 75)
           .fillColor('#F9FAFB')
           .strokeColor('#E5E7EB')
           .lineWidth(1)
           .fillAndStroke();
        
        doc.fillColor('#111827')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text(expense.description, 70, yPos + 12, { width: 300 });
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#6B7280')
           .text(`${new Date(expense.date).toLocaleDateString()} • ${expense.category}`, 70, yPos + 32);
        
        doc.fillColor('#7C3AED')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text(formatCurrency(expense.amount, expense.currency), 70, yPos + 50);
        
        const statusColor = {
          'draft': '#EF4444',
          'submitted': '#F59E0B',
          'approved': '#10B981',
          'rejected': '#6B7280'
        }[expense.status];
        
        doc.roundedRect(420, yPos + 12, 100, 25, 3)
           .fillColor(statusColor)
           .opacity(0.15)
           .fill();
        
        doc.opacity(1)
           .fillColor(statusColor)
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(expense.status.toUpperCase(), 420, yPos + 20, { width: 100, align: 'center' });
        
        yPos += 85;
      });

      doc.end();
      
      writeStream.on('finish', () => {
        resolve({ fileName, filePath, url: `/uploads/${fileName}` });
      });
      
      writeStream.on('error', (err) => {
        console.error('Employee PDF error:', err);
        reject(err);
      });
      
    } catch (error) {
      console.error('Generate employee PDF error:', error);
      reject(error);
    }
  });
};

// Helper function
function formatCurrency(amount, currency) {
  if (!currency) currency = 'USD';
  const currencyCode = typeof currency === 'object' ? currency.code : currency;
  
  // Format with proper currency symbol
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  
  return formatted;
}
