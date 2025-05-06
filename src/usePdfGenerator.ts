import { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import { convertImagetoDataURL, addCustomImagetoPDF, addElementToPdf } from './utils/PDFUtils';
import { PdfContentItem, PdfGeneratorOptions } from './types';


const usePdfGenerator = (options: PdfGeneratorOptions) => {
    const {
        fileName = 'document.pdf',
        format = 'a4',
        orientation = 'p',
        margin = 5,
        scale = 2,
        pageBreak = true,
        debug = false,
        fixedWidth,
        imageQuality,
        compressPdf = true
    } = options;

    const pdfRef = useRef<HTMLDivElement | null | any>(null);
    const [pdfLoading, setPdfLoading] = useState(false);

    const generatePdf = async (elements: PdfContentItem[]) => {
        try {
            setPdfLoading(true);
            if (!pdfRef.current) return;

            const pdf = new jsPDF(orientation, 'mm', format, compressPdf);
            const marginValue = typeof margin === 'number' ? margin : margin.top || 0;
            let yPos = marginValue;

            const elementsToProcess: (HTMLElement | string)[] = [];

            if (elements?.length) {
                for (const item of elements) {
                    if (item.type === 'image') {
                        elementsToProcess.push(item.selector);
                    } else if (item.mapping) {
                        const matches = Array.from(
                            document.querySelectorAll(item.selector)
                        ) as HTMLElement[];
                        elementsToProcess.push(...matches);
                    } else {
                        const element = document.querySelector(
                            item.selector
                        ) as HTMLElement | null;
                        if (element) elementsToProcess.push(element);
                    }
                }
            } else {
                elementsToProcess.push(
                    ...(Array.from(pdfRef.current.children) as HTMLElement[])
                );
            }

            for (const element of elementsToProcess) {
                if (typeof element === 'string') {
                    const imageDataUrl = await convertImagetoDataURL(element);
                    yPos = await addCustomImagetoPDF(pdf, imageDataUrl, yPos, marginValue);
                } else {
                    yPos = await addElementToPdf(
                        pdf,
                        element,
                        yPos,
                        marginValue,
                        scale,
                        fixedWidth,
                        imageQuality
                    );
                }

                if (pageBreak && yPos > pdf.internal.pageSize.getHeight() - marginValue) {
                    pdf.addPage();
                    yPos = marginValue;
                }
            }

            const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
            pdf.save(finalFileName);
        } catch (error) {
            if (debug) console.error('Error generating PDF:', error);
            throw error;
        } finally {
            setPdfLoading(false);
        }
    };

    const exportToPdf  = async () => {
        try {
            setPdfLoading(true);
            if (!pdfRef.current) return;

            const pdf = new jsPDF(orientation, 'mm', format, compressPdf);
            const marginValue = typeof margin === 'number' ? margin : margin.top || 5;
            let yPos = marginValue;

            const elementsToProcess = Array.from(pdfRef.current.children) as HTMLElement[];
            
            for (const element of elementsToProcess) {
                const subChildren = Array.from(element.children) as HTMLElement[];
                
                if (subChildren.length === 0) {
                    yPos = await addElementToPdf(
                        pdf, 
                        element, 
                        yPos, 
                        marginValue, 
                        scale, 
                        fixedWidth, 
                        imageQuality
                    );
                } else {
                    for (const subChild of subChildren) {
                        yPos = await addElementToPdf(
                            pdf, 
                            subChild, 
                            yPos, 
                            marginValue, 
                            scale, 
                            fixedWidth, 
                            imageQuality
                        );
                    }
                }
            }

            const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
            pdf.save(finalFileName);
        } catch (error) {
            if (debug) console.error('Error generating PDF', error);
            throw error;
        } finally {
            setPdfLoading(false);
        }
    };

    return { generatePdf, pdfRef, pdfLoading, exportToPdf  };
};

export default usePdfGenerator;