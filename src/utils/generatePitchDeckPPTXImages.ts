// @ts-nocheck
import html2canvas from 'html2canvas';
import pptxgen from 'pptxgenjs';
import { flushSync } from 'react-dom';

export interface PPTXImagesGeneratorOptions {
  totalSlides: number;
  setCurrentSlide: (index: number) => void;
  onProgress?: (current: number, total: number) => void;
  disableAnimations?: () => void;
  enableAnimations?: () => void;
}

// Wait for slide to be fully rendered
const waitForStableRender = (ms: number = 200): Promise<void> => {
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

export const generatePitchDeckPPTXImages = async ({
  totalSlides,
  setCurrentSlide,
  onProgress,
  disableAnimations,
  enableAnimations
}: PPTXImagesGeneratorOptions): Promise<void> => {
  // Disable animations for faster capture
  disableAnimations?.();
  
  const pres = new pptxgen();

  // Set presentation properties
  pres.author = 'Lifetrek Medical';
  pres.title = 'Lifetrek Medical - Pitch Deck';
  pres.subject = 'Manufatura Contratada ISO 13485';
  pres.company = 'Lifetrek Medical';

  // Define slide dimensions (16:9)
  pres.defineLayout({ name: 'CUSTOM_16x9', width: 13.333, height: 7.5 });
  pres.layout = 'CUSTOM_16x9';

  try {
    for (let i = 0; i < totalSlides; i++) {
      // Navigate to slide with flushSync for immediate render
      flushSync(() => {
        setCurrentSlide(i);
      });
      
      // Wait for DOM to fully update
      await waitForStableRender(200);

      // Find the slide element
      const slideElement = document.querySelector('[data-slide]') as HTMLElement;
      
      if (!slideElement) {
        console.error(`Slide ${i + 1} not found`);
        continue;
      }

      // Wait for all images in slide to load
      await waitForImages(slideElement);

      onProgress?.(i + 1, totalSlides);

      // Capture slide as high-res canvas
      const canvas = await html2canvas(slideElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        width: slideElement.offsetWidth,
        height: slideElement.offsetHeight,
        onclone: (clonedDoc) => {
          const clonedSlide = clonedDoc.querySelector('[data-slide]') as HTMLElement;
          if (clonedSlide) {
            clonedSlide.classList.add('pdf-export-mode');
            clonedSlide.parentElement?.classList.add('pdf-export-mode');
            
            // Detect if slide has dark or light background
            const hasDarkBg = clonedSlide.className.includes('from-primary/90') ||
                              clonedSlide.className.includes('from-primary/80');
            
            clonedSlide.style.backgroundColor = hasDarkBg ? '#003366' : '#ffffff';
          }
          
          // Fix gradient text and backdrop filters
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const computedStyle = window.getComputedStyle(htmlEl);
            
            if (htmlEl.style) {
              htmlEl.style.backdropFilter = 'none';
              (htmlEl.style as any).webkitBackdropFilter = 'none';
              htmlEl.style.animation = 'none';
              htmlEl.style.transition = 'none';
              
              if (htmlEl.classList.contains('bg-clip-text') || 
                  computedStyle.webkitBackgroundClip === 'text') {
                htmlEl.style.webkitBackgroundClip = 'border-box';
                htmlEl.style.backgroundClip = 'border-box';
                htmlEl.style.background = 'transparent';
                (htmlEl.style as any).webkitTextFillColor = 'unset';
                htmlEl.style.color = '#004d99';
              }
              
              if (htmlEl.classList.contains('text-transparent')) {
                htmlEl.style.color = '#004d99';
              }
            }
          });
        }
      });

      // Convert canvas to JPEG for faster processing
      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      // Create slide and add image as background
      const slide = pres.addSlide();
      
      slide.addImage({
        data: imgData,
        x: 0,
        y: 0,
        w: '100%',
        h: '100%',
        sizing: { type: 'cover', w: '100%', h: '100%' }
      });
    }

    // Save the PPTX
    await pres.writeFile({ fileName: 'Lifetrek_Medical_Pitch_Deck_HD.pptx' });
    
  } catch (error) {
    console.error('Error generating PPTX with images:', error);
    throw error;
  } finally {
    // Re-enable animations
    enableAnimations?.();
  }
};
