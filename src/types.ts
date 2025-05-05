import { RefObject } from "react";

  export interface ImageOptions {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    format?: 'JPEG' | 'PNG';
    maintainAspectRatio?: boolean;
  };
  export interface PdfContentItem {
    selector: string;
    mapping: boolean;
    type: 'element' | 'image';
    imageOptions?: ImageOptions
  }
  
  export interface PdfGeneratorOptions {
    fileName?: string;
    format?: 'a4' | 'letter' | 'a3' | [number, number];
    orientation?: 'p' | 'portrait' | 'l' | 'landscape';
    margin?:
      | number
      | { top?: number; right?: number; bottom?: number; left?: number };
    scale?: number;
    pageBreak?: boolean;
    debug?: boolean;
    fixedWidth?: number;
    imageQuality?: number;
    compressPdf?: boolean;
  }

  export type UsePdfGeneratorReturn = {
    generatePdf: (content: PdfContentItem[]) => Promise<void>;
    pdfRef: RefObject<HTMLDivElement | null> | null;
  };