// Helper utility for generating mobile and desktop printable PDF reports with full Unicode Bengali support

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  farmName?: string;
  userName?: string;
  dateRange?: string;
  filterLabel?: string;
  summaryCards?: { label: string; value: string; color?: string }[];
  tableHeaders: string[];
  tableRows: (string | number)[][];
  footerNotes?: string;
}

export const exportReportToPdf = (options: PdfReportOptions) => {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert("পপ-আপ উইন্ডোটি ব্লক করা আছে। অনুগ্রহ করে আপনার ব্রাউজারের পপ-আপ অ্যালাউ (Allow) করুন।");
    return;
  }

  const todayStr = new Date().toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.title} - ${options.farmName || 'স্মার্ট মৎস্য খামার'}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Hind Siliguri', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body {
          background-color: #f8fafc;
          color: #1e293b;
          padding: 20px;
          font-size: 13px;
          line-height: 1.5;
        }

        .report-card {
          max-width: 800px;
          margin: 0 auto;
          background: #ffffff;
          padding: 30px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
        }

        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }

        .farm-brand h1 {
          font-size: 22px;
          font-weight: 700;
          color: #1e3a8a;
          margin-bottom: 2px;
        }

        .farm-brand p {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        .report-meta {
          text-align: right;
        }

        .report-meta h2 {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }

        .report-meta p {
          font-size: 11px;
          color: #64748b;
        }

        .filter-badge {
          display: inline-block;
          background-color: #eff6ff;
          color: #1d4ed8;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .summary-box {
          background: #f8fafc;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .summary-box .label {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .summary-box .value {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          font-size: 12px;
        }

        th {
          background-color: #f1f5f9;
          color: #475569;
          font-weight: 700;
          text-align: left;
          padding: 10px 12px;
          border-bottom: 2px solid #cbd5e1;
          font-size: 11px;
          text-transform: uppercase;
        }

        td {
          padding: 10px 12px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          vertical-align: top;
        }

        tr:nth-child(even) {
          background-color: #fafafa;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }

        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e2e8f0;
          padding-top: 16px;
          font-size: 11px;
          color: #94a3b8;
          margin-top: 20px;
        }

        .print-btn-bar {
          text-align: center;
          margin-bottom: 20px;
        }

        .btn-print {
          background-color: #2563eb;
          color: #ffffff;
          border: none;
          padding: 12px 28px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
          transition: all 0.2s;
        }

        .btn-print:hover {
          background-color: #1d4ed8;
        }

        @media print {
          body {
            background-color: #ffffff;
            padding: 0;
          }
          .report-card {
            box-shadow: none;
            border: none;
            padding: 0;
            width: 100%;
            max-width: 100%;
          }
          .print-btn-bar {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>

      <div class="print-btn-bar">
        <button onclick="window.print()" class="btn-print">📥 সেভ বা প্রিন্ট করুন (Save as PDF)</button>
      </div>

      <div class="report-card">
        <div class="header-bar">
          <div class="farm-brand">
            <h1>🐟 ${options.farmName || 'স্মার্ট মৎস্য খামার'}</h1>
            <p>${options.userName ? 'খামারী: ' + options.userName : 'স্মার্ট চাষিয়া অটোমেটেড রিপোর্ট'}</p>
          </div>
          <div class="report-meta">
            <h2>${options.title}</h2>
            <p>তারিখ: ${todayStr}</p>
            ${options.subtitle ? `<p>${options.subtitle}</p>` : ''}
          </div>
        </div>

        ${options.filterLabel ? `<div class="filter-badge">🔍 ফিল্টার: ${options.filterLabel}</div>` : ''}

        ${options.summaryCards && options.summaryCards.length > 0 ? `
          <div class="summary-grid">
            ${options.summaryCards.map(c => `
              <div class="summary-box">
                <div class="label">${c.label}</div>
                <div class="value" style="${c.color ? 'color:' + c.color : ''}">${c.value}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              ${options.tableHeaders.map((h, idx) => `
                <th class="${idx === options.tableHeaders.length - 1 ? 'text-right' : idx === 0 ? 'text-left' : 'text-left'}">${h}</th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${options.tableRows.map(row => `
              <tr>
                ${row.map((cell, idx) => `
                  <td class="${idx === options.tableHeaders.length - 1 && typeof cell === 'string' && (cell.includes('৳') || cell.includes('টাকা')) ? 'text-right font-bold' : ''}">
                    ${cell !== undefined && cell !== null ? cell : '-'}
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${options.footerNotes ? `<p style="font-size:11px; color:#64748b; margin-bottom: 12px;">ℹ️ ${options.footerNotes}</p>` : ''}

        <div class="footer">
          <div>স্মার্ট চাষিয়ানি গাইড সিস্টেম দ্বারা তৈরিকৃত</div>
          <div>স্বাক্ষর / তারিখ: _____________________</div>
        </div>
      </div>

      <script>
        // Auto prompt print on open if user prefers
        window.onload = function() {
          // small delay for smooth render
          setTimeout(function() {
            // window.print();
          }, 300);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
