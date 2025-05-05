import jsPDF from "jspdf";
import { ImageOptions } from "../types";
import html2canvas from "html2canvas";

export const convertImagetoDataURL = async (src: string): Promise<string> => {
    const response = await fetch(src);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const addCustomImagetoPDF = async (
    pdf: jsPDF, 
    src: string, 
    yPos: number, 
    margin: number, 
    options?: ImageOptions
): Promise<number> => {
    return new Promise((resolve) => {
        const image = new Image();
        image.src = src;
        image.onload = () => {
            const imgWidth = image.naturalWidth;
            const imgHeight = image.naturalHeight;
            const pdfWidth = options?.width || pdf.internal.pageSize.getWidth() - margin * 2.0;
            const pdfHeight = options?.height || (imgHeight * pdfWidth) / imgWidth;
            const x = options?.x || margin;
            const y = options?.y || yPos;
            const format = options?.format || 'PNG';
            const maintainAspectRatio = options?.maintainAspectRatio ?? true;

            if (maintainAspectRatio) {
                pdf.addImage(src, format, x, y, pdfWidth, pdfHeight);
            } else {
                pdf.addImage(src, format, x, y, pdfWidth, pdfHeight, undefined, 'FAST');
            }

            resolve(yPos + pdfHeight + 10);
        };
    });
};

export const addElementToPdf = async (
    pdf: jsPDF,
    element: HTMLElement,
    yPos: number,
    margin: number,
    scale: number,
    fixedWidth?: number,
    imageQuality?: number
): Promise<number> => {
    const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const pdfHeight = pdf.internal.pageSize.getHeight() - margin * 2;
    
    const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        logging: false,
        windowWidth: fixedWidth || 1500,
        width: fixedWidth || 1500,
        onclone: (doc) => {
            doc.querySelectorAll('.pdf-only').forEach((el: any) => (el.style.display = 'block'));
            doc.querySelectorAll('.screen-only').forEach((el: any) => (el.style.display = 'none'));
        }
    });

    const imageData = canvas.toDataURL('image/png', imageQuality);
    const elementHeight = (canvas.height * pdfWidth) / canvas.width;

    if (yPos + elementHeight > pdfHeight + margin) {
        pdf.addPage();
        yPos = margin;
    }

    pdf.addImage(imageData, 'PNG', margin, yPos, pdfWidth, elementHeight);
    return yPos + elementHeight + 4;
};