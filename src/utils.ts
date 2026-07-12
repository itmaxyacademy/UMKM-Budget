import { BudgetData } from './types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToJson = (data: BudgetData, filename: string = 'budget-data') => {
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const formatCurrency = (amount: number, currencyCode: string = 'IDR') => {
  return new Intl.NumberFormat(currencyCode === 'IDR' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const calculateTotals = (data: BudgetData, mode: 'plan' | 'realization') => {
  let income = 0;
  data.incomes.forEach((group) => {
    group.items.forEach((item) => {
      income += item[mode === 'plan' ? 'planned' : 'actual'] / (item.duration || 1);
    });
  });

  let expenses = 0;
  let recurringCostYear = 0;
  let recurringCostMonth = 0;

  const categoryTotals: Record<string, { total: number, targetPercentage: number }> = {};
  
  (data.expenses || []).forEach((category) => {
    let categoryTotal = 0;
    (category.subcategories || []).forEach((group) => {
      (group.items || []).forEach((item) => {
        const itemValue = item[mode === 'plan' ? 'planned' : 'actual'];
        const monthlyValue = itemValue / (item.duration || 1);
        categoryTotal += monthlyValue;
        
        if ((item.duration || 1) > 1) {
          recurringCostMonth += monthlyValue;
          recurringCostYear += (monthlyValue * 12);
        }
      });
    });
    categoryTotals[category.name] = { total: categoryTotal, targetPercentage: category.targetPercentage };
    expenses += categoryTotal;
  });

  const surplus = income - expenses;

  return {
    income,
    expenses,
    surplus,
    categoryTotals,
    recurringCostMonth,
    recurringCostYear
  };
};

export const exportToPdf = async (data: BudgetData, mode: 'plan' | 'realization') => {
  const doc = new jsPDF();
  const title = `Executive Budget Report - ${mode === 'plan' ? 'Plan' : 'Realization'}`;
  const dateStr = new Date().toLocaleDateString('id-ID');
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('UMKM Budget Pro', 14, 22);
  
  doc.setFontSize(14);
  doc.text(title, 14, 32);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${dateStr}`, 14, 40);
  if (data.settings?.name) {
    doc.text(`Prepared for: ${data.settings.name}`, 14, 46);
  }

  // Calculate Totals
  const totals = calculateTotals(data, mode);

  // Summary Table
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Summary', 14, 60);
  
  autoTable(doc, {
    startY: 65,
    head: [['Description', 'Amount']],
    body: [
      ['Total Income', formatCurrency(totals.income, data.settings.currency)],
      ['Total Expense', formatCurrency(totals.expenses, data.settings.currency)],
      ['Net Balance', formatCurrency(totals.surplus, data.settings.currency)],
      ['Recurring Cost / Month', formatCurrency(totals.recurringCostMonth, data.settings.currency)],
      ['Recurring Cost / Year', formatCurrency(totals.recurringCostYear, data.settings.currency)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [250, 183, 0] }, // Amber color (#fab700)
    styles: { fontSize: 10 }
  });

  let finalY = (doc as any).lastAutoTable.finalY + 15;

  // Try to add charts if they exist in the DOM
  try {
    const svgElements = document.querySelectorAll('.recharts-surface');
    if (svgElements && svgElements.length > 0) {
      // First chart (Gauge)
      const svg1 = svgElements[0] as SVGSVGElement;
      const xml1 = new XMLSerializer().serializeToString(svg1);
      let formattedXml1 = xml1;
      if (!formattedXml1.includes('xmlns=')) formattedXml1 = formattedXml1.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
      
      const img1 = new Image();
      img1.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(formattedXml1)));
      
      await new Promise((resolve) => {
        img1.onload = resolve;
        img1.onerror = resolve;
      });
      
      if (img1.width > 0) {
        const canvas1 = document.createElement('canvas');
        canvas1.width = svg1.clientWidth || 300;
        canvas1.height = svg1.clientHeight || 300;
        const ctx1 = canvas1.getContext('2d');
        if (ctx1) {
          ctx1.fillStyle = '#ffffff';
          ctx1.fillRect(0, 0, canvas1.width, canvas1.height);
          ctx1.drawImage(img1, 0, 0, canvas1.width, canvas1.height);
          
          if (finalY + 80 > doc.internal.pageSize.getHeight()) {
            doc.addPage();
            finalY = 20;
          }
          
          doc.text('Charts Summary', 14, finalY);
          const ratio = (canvas1.height * 80) / canvas1.width;
          doc.addImage(canvas1.toDataURL('image/png'), 'PNG', 14, finalY + 5, 80, ratio);
          finalY += ratio + 20;
        }
      }
    }
  } catch (e) {
    console.warn("Could not export charts to PDF", e);
  }

  if (finalY > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    finalY = 20;
  }

  // Income Breakdown
  doc.setFontSize(12);
  doc.text('Income Breakdown', 14, finalY);
  
  const incomeRows: any[] = [];
  data.incomes.forEach(g => {
    g.items.forEach(i => {
      incomeRows.push([g.name, i.name, formatCurrency((mode === 'plan' ? i.planned : i.actual) * i.duration, data.settings.currency)]);
    });
  });

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Group', 'Item', 'Amount']],
    body: incomeRows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] }, // Indigo
    styles: { fontSize: 9 }
  });

  finalY = (doc as any).lastAutoTable.finalY + 15;

  // Expense Breakdown (Divide by category)
  doc.setFontSize(14);
  doc.text('Expense Breakdown', 14, finalY);
  finalY += 10;

  data.expenses.forEach(category => {
    if (finalY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      finalY = 20;
    }
    
    doc.setFontSize(12);
    doc.setTextColor(225, 29, 72); // Rose
    doc.text(category.name, 14, finalY);
    
    const categoryRows: any[] = [];
    category.subcategories.forEach(s => {
      s.items.forEach(i => {
        categoryRows.push([s.name, i.name, formatCurrency((mode === 'plan' ? i.planned : i.actual) * i.duration, data.settings.currency)]);
      });
    });
    
    if (categoryRows.length > 0) {
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Subcategory', 'Item', 'Amount']],
        body: categoryRows,
        theme: 'striped',
        headStyles: { fillColor: [244, 63, 94] },
        styles: { fontSize: 9 }
      });
      finalY = (doc as any).lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("No items.", 14, finalY + 5);
      finalY += 15;
    }
  });

  doc.save(`budget-${mode}-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToCsv = (data: BudgetData, mode: 'plan' | 'realization') => {
  const rows: string[][] = [];
  
  rows.push(['Type', 'Category/Group', 'Subcategory', 'Item', 'Amount']);
  
  data.incomes.forEach(g => {
    g.items.forEach(i => {
      rows.push(['Income', g.name, '', i.name, ((mode === 'plan' ? i.planned : i.actual) * i.duration).toString()]);
    });
  });
  
  data.expenses.forEach(c => {
    c.subcategories.forEach(s => {
      s.items.forEach(i => {
        rows.push(['Expense', c.name, s.name, i.name, ((mode === 'plan' ? i.planned : i.actual) * i.duration).toString()]);
      });
    });
  });

  const csvContent = rows.map(e => e.map(item => `"${item}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `budget-${mode}-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToXls = (data: BudgetData, mode: 'plan' | 'realization') => {
  const rows: any[] = [];
  
  data.incomes.forEach(g => {
    g.items.forEach(i => {
      rows.push({
        Type: 'Income',
        Group: g.name,
        Subcategory: '',
        Item: i.name,
        Amount: (mode === 'plan' ? i.planned : i.actual) * i.duration
      });
    });
  });
  
  data.expenses.forEach(c => {
    c.subcategories.forEach(s => {
      s.items.forEach(i => {
        rows.push({
          Type: 'Expense',
          Group: c.name,
          Subcategory: s.name,
          Item: i.name,
          Amount: (mode === 'plan' ? i.planned : i.actual) * i.duration
        });
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Budget Data");
  XLSX.writeFile(workbook, `budget-${mode}-${new Date().toISOString().split('T')[0]}.xlsx`);
};
