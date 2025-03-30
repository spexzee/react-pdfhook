import { useRef, useCallback, RefObject } from 'react';
import jsPDF from 'jspdf';
import html2canvas, { Options as Html2CanvasOptions } from 'html2canvas';
import { PdfContentItem, PdfGeneratorOptions, UsePdfGeneratorReturn } from './types';

const usePdfGenerator = (
    options: PdfGeneratorOptions = {}
): UsePdfGeneratorReturn => {
    const pdfRef = useRef<HTMLDivElement>(null);

    // Enhanced image loader that handles both URLs and local paths
    const loadImage = async (source: string): Promise<string> => {
        // Convert local paths to absolute URLs
        if (!source.startsWith('http') && !source.startsWith('data:')) {
            // Remove leading slash if present (public folder is served at root)
            const cleanPath = source.startsWith('/') ? source.substring(1) : source;
            source = `${window.location.origin}/${cleanPath}`;
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';

            // Add timestamp to bypass cache
            const timestamp = new Date().getTime();
            const urlWithCacheBust = source.includes('?')
                ? `${source}&_=${timestamp}`
                : `${source}?_=${timestamp}`;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };

            img.onerror = (err) => {
                console.error('Image load error:', err);
                if (urlWithCacheBust !== source) {
                    img.src = source;
                } else {
                    reject(
                        new Error(`Failed to load image: ${source}. CORS might be blocked.`)
                    );
                }
            };

            img.src = urlWithCacheBust;

            // Handle cached images
            if (img.complete) {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            }
        });
    };

    const generatePdf = useCallback(
        async (content?: PdfContentItem[]) => {
            if (!pdfRef.current) {
                if (options.debug)
                    console.error('PDF ref is not attached to any element');
                return;
            }

            try {
                const {
                    fileName = 'document.pdf',
                    format = 'a4',
                    orientation = 'p',
                    margin = 0,
                    scale = 2,
                    pageBreak = true,
                    debug = false,
                    fixedWidth,
                    imageQuality = 1,
                } = options;

                // Calculate margins
                const marginValue = typeof margin === 'number' ? margin : 0;
                const marginTop =
                    typeof margin === 'number' ? margin : margin.top || marginValue;
                const marginRight =
                    typeof margin === 'number' ? margin : margin.right || marginValue;
                const marginBottom =
                    typeof margin === 'number' ? margin : margin.bottom || marginValue;
                const marginLeft =
                    typeof margin === 'number' ? margin : margin.left || marginValue;

                const pdf = new jsPDF(orientation, 'mm', format);
                const pdfPageWidth = pdf.internal.pageSize.getWidth();
                const effectivePdfWidth = fixedWidth
                    ? Math.min(fixedWidth, pdfPageWidth - marginLeft - marginRight)
                    : pdfPageWidth - marginLeft - marginRight;

                const pdfHeight =
                    pdf.internal.pageSize.getHeight() - marginTop - marginBottom;

                let yPos = marginTop;
                const elementsToProcess: (HTMLElement | string)[] = [];

                // Process content array or default to all children
                if (content?.length) {
                    for (const item of content) {
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

                for (const item of elementsToProcess) {
                    if (typeof item === 'string') {
                        // Handle image URL or local path
                        const imageItem = content?.find(
                            (c) => c.selector === item && c.type === 'image'
                        );
                        const {
                            width: desiredWidth = effectivePdfWidth,
                            height: desiredHeight,
                            x = marginLeft,
                            format = 'JPEG',
                            maintainAspectRatio = true,
                        } = imageItem?.imageOptions || {};

                        try {
                            const imageDataUrl = await loadImage(item);
                            const img = new Image();
                            img.src = imageDataUrl;

                            await new Promise<void>((resolve) => {
                                img.onload = () => resolve();
                                if (img.complete) resolve();
                            });

                            // Calculate dimensions
                            let finalWidth = desiredWidth;
                            let finalHeight =
                                desiredHeight ||
                                (maintainAspectRatio
                                    ? (img.naturalHeight * finalWidth) / img.naturalWidth
                                    : effectivePdfWidth);

                            if (maintainAspectRatio) {
                                const aspectRatio = img.naturalWidth / img.naturalHeight;

                                if (desiredWidth && !desiredHeight) {
                                    finalHeight = desiredWidth / aspectRatio;
                                } else if (!desiredWidth && desiredHeight) {
                                    finalWidth = desiredHeight * aspectRatio;
                                } else if (!desiredWidth && !desiredHeight) {
                                    finalWidth = Math.min(effectivePdfWidth, img.naturalWidth);
                                    finalHeight = finalWidth / aspectRatio;
                                }
                            }
                            if (
                                typeof finalWidth !== 'number' ||
                                typeof finalHeight !== 'number'
                            ) {
                                throw new Error('Invalid image dimensions');
                            }

                            // Add image to PDF
                            pdf.addImage(
                                imageDataUrl,
                                format === 'PNG' ? 'PNG' : 'JPEG',
                                x,
                                yPos,
                                finalWidth,
                                finalHeight
                            );

                            yPos += finalHeight + 10;

                            if (pageBreak && yPos > pdfHeight) {
                                pdf.addPage(format, orientation);
                                yPos = marginTop;
                            }
                        } catch (error) {
                            if (options.debug)
                                console.error('Error processing image:', item, error);
                            continue;
                        }
                    } else {
                        // Handle HTML element
                        const element = item as HTMLElement;
                        if (window.getComputedStyle(element).display === 'none') continue;

                        // Handle page breaks before element
                        if (
                            pageBreak &&
                            element.dataset.pdfBreak === 'before' &&
                            yPos > marginTop
                        ) {
                            pdf.addPage(format, orientation);
                            yPos = marginTop;
                        }

                        // Temporarily adjust element dimensions
                        const originalStyles = {
                            width: element.style.width,
                            minWidth: element.style.minWidth,
                            overflow: element.style.overflow,
                        };

                        // Convert fixedWidth from mm to px (1mm ≈ 3.78px)
                        const htmlWidth = fixedWidth ? fixedWidth * 3.78 : undefined;
                        if (htmlWidth) {
                            element.style.width = `${htmlWidth}px`;
                            element.style.minWidth = `${htmlWidth}px`;
                            element.style.overflow = 'hidden';
                        }

                        // Configure html2canvas options
                        const html2canvasOptions: Html2CanvasOptions = {
                            scale,
                            useCORS: true,
                            logging: debug,
                            windowWidth: htmlWidth || element.scrollWidth,
                            windowHeight: element.scrollHeight,
                            width: htmlWidth || element.scrollWidth,
                            height: element.scrollHeight,
                            scrollX: 0,
                            scrollY: 0,
                            x: 0,
                            y: 0,
                            backgroundColor: '#ffffff',
                            imageTimeout: 15000,
                            allowTaint: false,
                            ignoreElements: (_el: Element) => false,
                            foreignObjectRendering: false,
                            onclone: (doc: any) => {
                                doc.querySelectorAll('.pdf-only').forEach((el: any) => {
                                    (el as HTMLElement).style.display = 'block';
                                });
                                doc.querySelectorAll('.screen-only').forEach((el : any) => {
                                    (el as HTMLElement).style.display = 'none';
                                });
                            },
                        };

                        const canvas = await html2canvas(element, html2canvasOptions);

                        // Restore original styles
                        if (htmlWidth) {
                            element.style.width = originalStyles.width;
                            element.style.minWidth = originalStyles.minWidth;
                            element.style.overflow = originalStyles.overflow;
                        }

                        const imageData = canvas.toDataURL('image/png', imageQuality);
                        const imgWidth = effectivePdfWidth;
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;

                        // Handle multi-page content
                        if (imgHeight > pdfHeight) {
                            let remainingHeight = imgHeight;
                            let currentImageHeight = 0;

                            while (remainingHeight > 0) {
                                const availableHeight = pdfHeight - yPos;
                                const heightToAdd = Math.min(availableHeight, remainingHeight);

                                pdf.addImage({
                                    imageData,
                                    format: 'PNG',
                                    x: marginLeft,
                                    y: yPos,
                                    width: imgWidth,
                                    height: imgHeight,
                                    compression: 'FAST',
                                    rotation: 0,
                                    alias: undefined,
                                    // @ts-ignore - jsPDF types don't include these but they work
                                    sy: currentImageHeight,
                                    sWidth: canvas.width,
                                    sHeight: (heightToAdd / imgHeight) * canvas.height,
                                });

                                remainingHeight -= heightToAdd;
                                currentImageHeight += (heightToAdd / imgHeight) * canvas.height;

                                if (remainingHeight > 0) {
                                    pdf.addPage(format, orientation);
                                    yPos = marginTop;
                                } else {
                                    yPos += heightToAdd;
                                }
                            }
                        } else {
                            if (pageBreak && yPos + imgHeight > pdfHeight) {
                                pdf.addPage(format, orientation);
                                yPos = marginTop;
                            }

                            pdf.addImage({
                                imageData,
                                format: 'PNG',
                                x: marginLeft,
                                y: yPos,
                                width: imgWidth,
                                height: imgHeight,
                            });

                            yPos += imgHeight;
                        }

                        // Handle page breaks after element
                        if (pageBreak && element.dataset.pdfBreak === 'after') {
                            pdf.addPage(format, orientation);
                            yPos = marginTop;
                        }

                        // Add spacing between elements
                        yPos += 5;
                    }
                }

                pdf.save(fileName);

                const canvases = document.querySelectorAll('canvas[data-pdf-gen]');
                canvases.forEach((canvas) => canvas.remove());
            } catch (error) {
                if (options.debug) console.error('Error generating PDF:', error);
                throw error;
            }
        },
        [options]
    );

    return { generatePdf, pdfRef };
};

export default usePdfGenerator;
