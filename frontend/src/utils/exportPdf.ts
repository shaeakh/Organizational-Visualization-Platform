import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export async function exportElementToPdf(elementId: string, filename: string = 'org_chart.pdf'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // Temporary modifications to optimize for screenshot rendering
  const originalStyle = element.style.cssText;
  element.style.maxHeight = 'none';
  element.style.overflow = 'visible';
  element.style.width = 'fit-content';
  element.style.padding = '32px';
  element.style.background = '#ffffff'; // match white background from UI

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Increase resolution
      useCORS: true,
      backgroundColor: '#ffffff', // match white background from UI
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Determine orientation based on aspect ratio
    const width = canvas.width;
    const height = canvas.height;
    const orientation = width > height ? 'l' : 'p';

    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'px',
      format: [width, height] // Custom format fitting the canvas exactly
    });

    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(filename);
  } finally {
    // Revert element styles back to original state
    element.style.cssText = originalStyle;
  }
}
