declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: {
      PDFFormatVersion: string;
      IsAcroFormPresent: boolean;
      IsXFAPresent: boolean;
      [key: string]: string | boolean | number;
    };
    metadata: Record<string, unknown>;
    version: string;
  }

  interface ParseOptions {
    pagerender?: (pageData: unknown) => string;
    max?: number;
    version?: string;
  }

  function parse(dataBuffer: ArrayBuffer | Buffer, options?: ParseOptions): Promise<PDFData>;
  export = parse;
}

declare module 'pdf-table-extractor' {
  interface TableData {
    page: number;
    tables: Array<Array<Array<string>>>;
  }

  interface ParseResult {
    pageTables: TableData[];
  }

  function parse(dataBuffer: ArrayBuffer | Buffer): Promise<ParseResult>;
  export = { parse };
}

declare module 'pdfjs-dist' {
  interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  interface PDFPageProxy {
    getTextContent(): Promise<TextContent>;
  }

  interface TextContent {
    items: TextItem[];
  }

  interface TextItem {
    str: string;
    transform: number[];
    width: number;
    height: number;
    dir: string;
  }

  interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }

  interface GetDocumentParams {
    data: ArrayBuffer | Uint8Array;
    url?: string;
    cMapUrl?: string;
    cMapPacked?: boolean;
  }

  interface GlobalWorkerOptions {
    workerSrc: string;
  }

  const GlobalWorkerOptions: GlobalWorkerOptions;
  
  function getDocument(params: GetDocumentParams): PDFDocumentLoadingTask;
  
  export {
    getDocument,
    GlobalWorkerOptions,
    PDFDocumentProxy,
    PDFPageProxy,
    TextContent,
    TextItem
  };
}

declare module 'pdfjs-dist/build/pdf.worker.entry' {
  const worker: string;
  export default worker;
} 