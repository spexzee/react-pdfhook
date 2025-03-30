import { RefObject } from "react";

export interface PageBreakOptions {
    before?: boolean;
    after?: boolean;
    avoid?: string[];
  }
  
  export interface PdfContentItem {
    selector: string;
    mapping: boolean;
    type: 'element' | 'image';
    imageOptions?: {
      width?: number;
      height?: number;
      x?: number;
      y?: number;
      format?: 'JPEG' | 'PNG';
      maintainAspectRatio?: boolean;
    };
  }
  
  export interface PdfGeneratorOptions {
    fileName?: string;
    format?: 'a4' | 'letter' | 'a3' | [number, number];
    orientation?: 'p' | 'portrait' | 'l' | 'landscape';
    margin?:
      | number
      | { top?: number; right?: number; bottom?: number; left?: number };
    scale?: number;
    pageBreak?: boolean | PageBreakOptions;
    debug?: boolean;
    fixedWidth?: number;
    imageQuality?: number;
  }

  export type UsePdfGeneratorReturn = {
    generatePdf: (content: PdfContentItem[]) => Promise<void>;
    pdfRef: RefObject<HTMLDivElement | null> | null;
  };