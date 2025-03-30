# React PDF Generator Hook - react-pdfhook

![npm](https://img.shields.io/npm/v/react-pdfhook)
![license](https://img.shields.io/npm/l/react-pdfhook)
![downloads](https://img.shields.io/npm/dm/react-pdfhook)
![types](https://img.shields.io/npm/types/react-pdfhook)

A production-ready React hook for generating high-fidelity PDFs with advanced layout control and content targeting.

## Features

- **Precision PDF Generation**
  - Convert React components to pixel-perfect PDFs
  - Support for all HTML/CSS that html2canvas can render
  - Automatic and manual page break controls

- **Advanced Content Targeting**
  - Flexible selector system for specific elements
  - PDF-only content visibility (show in PDF but hide in browser)
  - Image handling with CORS support

- **Layout Control**
  - Fixed-width mode for consistent cross-device rendering
  - Responsive design preservation
  - Customizable margins and page formats

- **Optimized Performance**
  - Lightweight (~5kB gzipped)
  - Zero runtime dependencies
  - TypeScript-first design

## Installation

```bash
npm install react-pdfhook jspdf html2canvas
# or
yarn add react-pdfhook jspdf html2canvas
```

## Basic Usage

```jsx
import { usePdfGenerator } from 'react-pdfhook';

function DocumentGenerator() {
  const { generatePdf, pdfRef } = usePdfGenerator({
    fileName: 'document.pdf'
  });

  return (
    <div>
      <button onClick={() => generatePdf()}>Generate PDF</button>
      <div ref={pdfRef}>
        <h1>My Document</h1>
        <p>This content will appear in the PDF</p>
      </div>
    </div>
  );
}
```

## Advanced Usage

### 1. Targeted PDF Generation

```jsx
const handleDownload = async () => {
  await generatePdf([
    {
      selector: '/images/header.jpg',
      mapping: false,
      type: 'image',
      imageOptions: {
        width: 180, // mm
        maintainAspectRatio: true
      }
    },
    { 
      selector: '.main-content', 
      mapping: false,
      type: 'element' 
    },
    { 
      selector: '.data-table', 
      mapping: true, // Capture all matching tables
      type: 'element' 
    }
  ]);
};
```

### 2. PDF-Only Content

```jsx
<div ref={pdfRef}>
  {/* Visible in both browser and PDF */}
  <h1>Public Report</h1>
  
  {/* Hidden in browser, visible only in PDF */}
  <div className="pdf-only">
    <h2>Confidential Details</h2>
    <p>Only visible in the generated PDF</p>
  </div>
</div>
```

**Required CSS:**
```css
.pdf-only {
  display: none;
}

@media print {
  .pdf-only {
    display: block;
  }
}
```

### 3. Layout Control

```jsx
const { generatePdf } = usePdfGenerator({
  fixedWidth: 1200, // pixels (optimal for A4 width)
  scale: 1.5, // Quality/performance balance
  margin: { top: 20, right: 15, bottom: 20, left: 15 }, // mm
  pageBreak: {
    before: true,
    avoid: ['.keep-together'] // CSS selector of elements to keep together
  }
});
```

### 4. Image Handling

```jsx
// Local images (must be in public folder)
<img src="/images/logo.png" alt="Logo" />

// Remote images (require CORS)
<img 
  src="https://example.com/chart.png" 
  crossOrigin="anonymous"
  alt="Chart"
/>

```

## Complete API Reference

### Hook Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fileName` | string | 'document.pdf' | Output filename |
| `format` | string/array | 'a4' | Page size (a3,a4,letter or [w,h] in mm) |
| `orientation` | string | 'portrait' | 'portrait' or 'landscape' |
| `margin` | number/object | 0 | Margins in mm |
| `fixedWidth` | number | undefined | Constrained width in pixels |
| `scale` | number | 2 | Render quality multiplier |
| `pageBreak` | boolean/object | true | Auto page break config |
| `imageQuality` | number | 1 | Image quality (0-1) |
| `debug` | boolean | false | Enable debug logging |

### Content Configuration

```typescript
interface PdfContentItem {
  selector: string;       // CSS selector or image path
  mapping: boolean;      // true = all matches, false = first match
  type: 'element'|'image';
  imageOptions?: {        // Only for type: 'image'
    width?: number;      // mm
    height?: number;     // mm
    x?: number;          // mm
    y?: number;          // mm
    format?: 'JPEG'|'PNG';
    maintainAspectRatio?: boolean;
  };
}
```

## Best Practices

1. **For images**:
   - Place assets in `public` folder
   - Use absolute paths (`/images/photo.jpg`)
   - Set explicit dimensions in `imageOptions`

2. **For performance**:
   ```jsx
   {
     scale: 1, // Lower quality but faster
     imageQuality: 0.8,
     fixedWidth: 800 // Smaller fixed width
   }
   ```

3. **For complex layouts**:
   ```jsx
   // Add to elements that should stay together
   <div className="keep-together">
     <h2>Section Title</h2>
     <p>Content that shouldn't be split across pages</p>
   </div>
   ```

## Troubleshooting

**Issue** | **Solution**
---|---
Images missing | Verify paths and CORS headers
Content clipped | Increase margins or reduce fixedWidth
PDF-only content not showing | Check CSS and media queries
Performance problems | Reduce scale and imageQuality

## Changelog

**v1.0.0** (Current)
- Added advanced content targeting
- Improved image handling
- Enhanced TypeScript support
- Better layout preservation

## License

MIT © [Spexzee](https://github.com/spexzee)

---

**Like this package?** ⭐️ [Star the repo](https://github.com/spexzee/react-pdfhook)  
**Need help?** 📧 [Contact me](mailto:spexzee.abufxu69@gmail.com)  
**Found a bug?** 🐛 [Open an issue](https://github.com/spexzee/react-pdfhook/issues)