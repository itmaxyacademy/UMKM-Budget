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

export const calculateTotals = (data: BudgetData, mode: 'plan' | 'realization', budgetMode: 'personal' | 'business' = 'personal') => {
  let income = 0;
  let expenses = 0;
  let recurringCostYear = 0;
  let recurringCostMonth = 0;
  const categoryTotals: Record<string, { total: number, targetPercentage: number }> = {};

  if (budgetMode === 'personal') {
    data.incomes.forEach((group) => {
      group.items.forEach((item) => {
        income += item[mode === 'plan' ? 'planned' : 'actual'] / (item.duration || 1);
      });
    });
  
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
  } else {
    (data.businessIncomes || []).forEach((group) => {
      group.items.forEach((item) => {
        const price = mode === 'plan' ? item.pricePlan : item.priceActual;
        const val = (item.quantity * price) / (item.duration || 1);
        if (item.isHPP) {
          expenses += val;
          if (!categoryTotals['Harga Pokok Penjualan (HPP)']) {
            categoryTotals['Harga Pokok Penjualan (HPP)'] = { total: 0, targetPercentage: 0 };
          }
          categoryTotals['Harga Pokok Penjualan (HPP)'].total += val;
        } else {
          income += val;
        }
      });
    });

    (data.businessExpenses || []).forEach((category) => {
      let categoryTotal = 0;
      (category.subcategories || []).forEach((group) => {
        (group.items || []).forEach((item) => {
          const price = mode === 'plan' ? item.pricePlan : item.priceActual;
          const monthlyValue = (item.quantity * price) / (item.duration || 1);
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
  }

  const surplus = income - expenses;

  let hppTotal = 0;
  if (categoryTotals['Harga Pokok Penjualan (HPP)']) {
    hppTotal = categoryTotals['Harga Pokok Penjualan (HPP)'].total;
  }
  const grossProfit = budgetMode === 'business' ? income - hppTotal : income;
  const operatingExpenses = budgetMode === 'business' ? expenses - hppTotal : expenses;

  return {
    income,
    expenses,
    surplus,
    categoryTotals,
    recurringCostMonth,
    recurringCostYear,
    hppTotal,
    grossProfit,
    operatingExpenses
  };
};

export const exportToPdf = async (data: BudgetData, mode: 'plan' | 'realization', budgetMode: 'personal' | 'business' = 'personal') => {
  const doc = new jsPDF();
  const title = `Executive Budget Report - ${mode === 'plan' ? 'Plan' : 'Realization'}`;
  const dateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('id-ID');
  
  // Header Branding Block
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 50, 'F');
  
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(budgetMode === 'business' ? 'UMKM Budget Pro (Business)' : 'UMKM Budget Pro', 14, 25);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(title, 14, 35);
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${dateStr} ${timeStr}`, doc.internal.pageSize.getWidth() - 14, 25, { align: 'right' });
  if (data.settings?.name) {
    doc.text(`Prepared for: ${data.settings.name}`, doc.internal.pageSize.getWidth() - 14, 35, { align: 'right' });
    if (budgetMode === 'business' && data.settings.businessName) {
      doc.text(`Business: ${data.settings.businessName}`, doc.internal.pageSize.getWidth() - 14, 45, { align: 'right' });
    }
  }

  // Calculate Totals
  const totals = calculateTotals(data, mode, budgetMode);

  // Summary Table
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Summary', 14, 65);
  
  autoTable(doc, {
    startY: 70,
    head: [['Metric', 'Value']],
    body: [
      ['Total Monthly Income', formatCurrency(totals.income, data.settings.currency)],
      ['Cost of Living (COL) / Expenses', formatCurrency(totals.expenses, data.settings.currency)],
      ['Net Balance (Surplus/Deficit)', formatCurrency(totals.surplus, data.settings.currency)],
      ['Recurring Cost (Monthly)', formatCurrency(totals.recurringCostMonth, data.settings.currency)],
      ['Recurring Cost (Annual)', formatCurrency(totals.recurringCostYear, data.settings.currency)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' }, // slate-600
    styles: { fontSize: 11, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [51, 65, 85] },
      1: { halign: 'right' }
    },
    alternateRowStyles: { fillColor: [248, 250, 252] } // slate-50
  });

  let finalY = (doc as any).lastAutoTable.finalY + 15;

  // Visual Representations (Charts from DOM)
  try {
    const svgElements = document.querySelectorAll('.recharts-surface');
    if (svgElements && svgElements.length > 0) {
      if (finalY + 100 > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        finalY = 20;
      }
      
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text('Visual Analysis', 14, finalY);
      finalY += 10;

      let currentX = 14;
      let rowHeight = 0;

      for (let i = 0; i < Math.min(svgElements.length, 3); i++) {
        const svg = svgElements[i] as SVGSVGElement;
        const xml = new XMLSerializer().serializeToString(svg);
        let formattedXml = xml;
        if (!formattedXml.includes('xmlns=')) formattedXml = formattedXml.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
        
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(formattedXml)));
        
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        
        if (img.width > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = svg.clientWidth || 300;
          canvas.height = svg.clientHeight || 300;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const targetWidth = 85; // Roughly half page width minus margins
            const targetHeight = (canvas.height * targetWidth) / canvas.width;
            
            if (currentX + targetWidth > doc.internal.pageSize.getWidth()) {
              currentX = 14;
              finalY += rowHeight + 10;
              rowHeight = 0;
              
              if (finalY + targetHeight > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                finalY = 20;
              }
            }

            doc.addImage(canvas.toDataURL('image/png'), 'PNG', currentX, finalY, targetWidth, targetHeight);
            currentX += targetWidth + 10;
            rowHeight = Math.max(rowHeight, targetHeight);
          }
        }
      }
      finalY += rowHeight + 15;
    }
  } catch (e) {
    console.warn("Could not export charts to PDF", e);
  }

  // Details Section Header
  if (finalY > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    finalY = 20;
  }
  
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Breakdowns', 14, finalY);
  finalY += 15;

  // Income Breakdown
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(budgetMode === 'business' ? 'Revenue Details' : 'Income Details', 14, finalY);
  
  const incomeRows: any[] = [];
  if (budgetMode === 'personal') {
    data.incomes.forEach(g => {
      g.items.forEach(i => {
        incomeRows.push([g.name, i.name, formatCurrency((mode === 'plan' ? i.planned : i.actual) * i.duration, data.settings.currency)]);
      });
    });
  } else {
    (data.businessIncomes || []).forEach(g => {
      g.items.forEach(i => {
        if (!i.isHPP) {
          const price = mode === 'plan' ? i.pricePlan : i.priceActual;
          incomeRows.push([g.name, i.name, formatCurrency(i.quantity * price, data.settings.currency)]);
        }
      });
    });
  }

  autoTable(doc, {
    startY: finalY + 5,
    head: [[budgetMode === 'business' ? 'Revenue Group' : 'Income Group', 'Item', 'Amount']],
    body: incomeRows,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] }, // indigo-500
    styles: { fontSize: 10 },
    columnStyles: { 2: { halign: 'right' } }
  });

  finalY = (doc as any).lastAutoTable.finalY + 15;

  // Expense Breakdown
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Expense Details by Category', 14, finalY);
  finalY += 10;

  const expensesToIterate = budgetMode === 'personal' ? data.expenses : [...(data.businessExpenses || [])];

  if (budgetMode === 'business') {
    const hppSubcategories: any[] = [];
    (data.businessIncomes || []).forEach(g => {
      const hppItems = g.items.filter(i => i.isHPP);
      if (hppItems.length > 0) {
        hppSubcategories.push({
          name: g.name,
          items: hppItems
        });
      }
    });
    
    if (hppSubcategories.length > 0) {
      expensesToIterate.unshift({
        id: 'hpp-virtual-cat',
        name: 'Harga Pokok Penjualan (HPP)',
        targetPercentage: 0,
        subcategories: hppSubcategories
      } as any);
    }
  }

  expensesToIterate.forEach(category => {
    if (finalY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      finalY = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text(`${category.name} (Target: ${category.targetPercentage}%)`, 14, finalY);
    
    const categoryRows: any[] = [];
    let catTotal = 0;
    category.subcategories.forEach(s => {
      s.items.forEach(i => {
        let val = 0;
        if (budgetMode === 'personal') {
          val = (mode === 'plan' ? i.planned : i.actual) * (i.duration || 1);
        } else {
          const price = mode === 'plan' ? i.pricePlan : i.priceActual;
          val = i.quantity * price;
        }
        catTotal += val;
        categoryRows.push([s.name, i.name, formatCurrency(val, data.settings.currency)]);
      });
    });
    
    if (categoryRows.length > 0) {
      // Add a total row
      categoryRows.push([{ content: 'Total', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }, { content: formatCurrency(catTotal, data.settings.currency), styles: { fontStyle: 'bold' } }]);
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Subcategory', 'Item', 'Amount']],
        body: categoryRows,
        theme: 'striped',
        headStyles: { fillColor: [244, 63, 94] }, // rose-500
        styles: { fontSize: 10 },
        columnStyles: { 2: { halign: 'right' } }
      });
      finalY = (doc as any).lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text("No items.", 14, finalY + 5);
      finalY += 15;
    }
  });
  
  // Footer page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  doc.save(`budget-${mode}-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToCsv = (data: BudgetData, mode: 'plan' | 'realization', budgetMode: 'personal' | 'business' = 'personal') => {
  const rows: string[][] = [];
  
  rows.push(['Type', 'Category/Group', 'Subcategory', 'Item', 'Amount']);
  
  if (budgetMode === 'personal') {
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
  } else {
    (data.businessIncomes || []).forEach(g => {
      g.items.forEach(i => {
        const price = mode === 'plan' ? i.pricePlan : i.priceActual;
        if (i.isHPP) {
          rows.push(['Expense', 'Harga Pokok Penjualan (HPP)', g.name, i.name, (i.quantity * price).toString()]);
        } else {
          rows.push(['Revenue', g.name, '', i.name, (i.quantity * price).toString()]);
        }
      });
    });

    (data.businessExpenses || []).forEach(c => {
      c.subcategories.forEach(s => {
        s.items.forEach(i => {
          const price = mode === 'plan' ? i.pricePlan : i.priceActual;
          rows.push(['Expense', c.name, s.name, i.name, (i.quantity * price).toString()]);
        });
      });
    });
  }

  const csvContent = rows.map(e => e.map(item => `"${item}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `budget-${budgetMode}-${mode}-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToXls = (data: BudgetData, mode: 'plan' | 'realization', budgetMode: 'personal' | 'business' = 'personal') => {
  const rows: any[] = [];
  
  if (budgetMode === 'personal') {
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
  } else {
    (data.businessIncomes || []).forEach(g => {
      g.items.forEach(i => {
        const price = mode === 'plan' ? i.pricePlan : i.priceActual;
        if (i.isHPP) {
          rows.push({
            Type: 'Expense',
            Group: 'Harga Pokok Penjualan (HPP)',
            Subcategory: g.name,
            Item: i.name,
            Amount: i.quantity * price
          });
        } else {
          rows.push({
            Type: 'Revenue',
            Group: g.name,
            Subcategory: '',
            Item: i.name,
            Amount: i.quantity * price
          });
        }
      });
    });
    
    (data.businessExpenses || []).forEach(c => {
      c.subcategories.forEach(s => {
        s.items.forEach(i => {
          const price = mode === 'plan' ? i.pricePlan : i.priceActual;
          rows.push({
            Type: 'Expense',
            Group: c.name,
            Subcategory: s.name,
            Item: i.name,
            Amount: i.quantity * price
          });
        });
      });
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Budget Data");
  XLSX.writeFile(workbook, `budget-${mode}-${new Date().toISOString().split('T')[0]}.xlsx`);
};
