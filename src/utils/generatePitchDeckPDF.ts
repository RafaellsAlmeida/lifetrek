// @ts-nocheck
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { flushSync } from 'react-dom';

export interface PDFGeneratorOptions {
  totalSlides: number;
  setCurrentSlide: (index: number) => void;
  onProgress?: (current: number, total: number) => void;
  disableAnimations?: () => void;
  enableAnimations?: () => void;
}

// Wait for DOM to fully update and render
const waitForDOMUpdate = (ms: number = 300): Promise<void> => {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, ms);
      });
    });
  });
};

// Wait for all images to load
const waitForImages = (element: HTMLElement): Promise<void> => {
  const images = element.querySelectorAll('img');
  const promises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  });
  return Promise.all(promises).then(() => {});
};

export const generatePitchDeckPDF = async ({
  totalSlides,
  setCurrentSlide,
  onProgress,
  disableAnimations,
  enableAnimations
}: PDFGeneratorOptions): Promise<void> => {
  // Apply PDF export mode to document root for global CSS overrides
  document.documentElement.classList.add('pdf-export-mode');
  
  // Disable animations for clean capture
  disableAnimations?.();
  
  // Wait for mode changes to take effect
  await waitForDOMUpdate(300);
  
  // Create PDF with 16:9 landscape aspect ratio
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [297, 167] // 16:9 aspect ratio
  });

  const pageWidth = 297;
  const pageHeight = 167;

  try {
    for (let i = 0; i < totalSlides; i++) {
      // Use flushSync to force synchronous React render
      flushSync(() => {
        setCurrentSlide(i);
      });
      
      // Wait for DOM to fully update
      await waitForDOMUpdate(400);

      // Find the slide element
      const slideElement = document.querySelector('[data-slide]') as HTMLElement;
      
      if (!slideElement) {
        console.error(`Slide ${i + 1} not found`);
        continue;
      }

      // Wait for all images in slide to load
      await waitForImages(slideElement);
      
      // Additional wait for fonts and styles
      await waitForDOMUpdate(300);

      onProgress?.(i + 1, totalSlides);

      // Capture slide as high-res canvas with improved settings
      const canvas = await html2canvas(slideElement, {
        scale: 2.5, // Better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: null, // Let slide background show through
        logging: false,
        width: slideElement.offsetWidth,
        height: slideElement.offsetHeight,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Add pdf-export-mode to cloned document
          clonedDoc.documentElement.classList.add('pdf-export-mode');
          
          const clonedSlide = clonedDoc.querySelector('[data-slide]') as HTMLElement;
          if (clonedSlide) {
            // Detect if slide has dark background (cover slide is first slide with bg-gradient overlay)
            const hasGradientOverlay = clonedSlide.querySelector('.from-primary\\/90, .from-primary\\/80');
            const isDarkSlide = i === 0 || hasGradientOverlay; // First slide is always cover
            
            if (isDarkSlide) {
              clonedSlide.setAttribute('data-dark-slide', 'true');
              clonedSlide.style.backgroundColor = '#003366';
            } else {
              // Light slides get white background
              clonedSlide.style.backgroundColor = '#ffffff';
            }
          }
          
          // Process all elements for PDF compatibility
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (!htmlEl.style) return;
            
            // Remove problematic CSS properties
            htmlEl.style.backdropFilter = 'none';
            (htmlEl.style as any).webkitBackdropFilter = 'none';
            htmlEl.style.animation = 'none';
            htmlEl.style.transition = 'none';
            
            // Remove mask-image (not supported by html2canvas)
            if (htmlEl.style.maskImage || (htmlEl.style as any).webkitMaskImage) {
              htmlEl.style.maskImage = 'none';
              (htmlEl.style as any).webkitMaskImage = 'none';
              htmlEl.style.opacity = '0.1';
            }
            
            // Fix gradient text - replace with solid color
            if (htmlEl.classList.contains('bg-clip-text') || 
                htmlEl.classList.contains('text-transparent')) {
              htmlEl.style.webkitBackgroundClip = 'border-box';
              htmlEl.style.backgroundClip = 'border-box';
              htmlEl.style.background = 'transparent';
              (htmlEl.style as any).webkitTextFillColor = 'unset';
              htmlEl.style.color = '#003A5D'; // Brand primary blue
            }
            
            // Fix GlassCard backgrounds - make solid white
            if (htmlEl.classList.contains('bg-background/50') || 
                htmlEl.classList.contains('bg-card/50') ||
                htmlEl.classList.contains('bg-card/30')) {
              htmlEl.style.backgroundColor = 'rgba(255, 255, 255, 0.97)';
              htmlEl.style.backdropFilter = 'none';
            }
          });
        }
      });

      // Use PNG for better quality
      const imgData = canvas.toDataURL('image/png', 1.0);

      // Add new page for slides after the first
      if (i > 0) {
        pdf.addPage([pageWidth, pageHeight], 'landscape');
      }

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, `slide_${i}`, 'FAST');
    }

    // Save the PDF
    pdf.save('Lifetrek_Medical_Pitch_Deck.pdf');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    // Remove PDF export mode
    document.documentElement.classList.remove('pdf-export-mode');
    // Re-enable animations
    enableAnimations?.();
  }
};
