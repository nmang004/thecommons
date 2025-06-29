import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/redis/cache'

interface ArticleData {
  id: string
  title: string
  abstract: string
  authors: Array<{
    name: string
    affiliation?: string
    orcid?: string
  }>
  content: string
  doi?: string
  publishedAt: string
  keywords: string[]
  fieldOfStudy: string
  citations?: Array<{
    id: string
    text: string
    url?: string
  }>
  figures?: Array<{
    id: string
    caption: string
    url: string
  }>
}

interface PDFOptions {
  format: 'a4' | 'letter'
  includeWatermark: boolean
  includeLineNumbers: boolean
  fontFamily: 'times' | 'helvetica' | 'palatino'
  fontSize: number
  margins: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

export class AcademicPDFGenerator {
  private static instance: AcademicPDFGenerator
  
  public static getInstance(): AcademicPDFGenerator {
    if (!AcademicPDFGenerator.instance) {
      AcademicPDFGenerator.instance = new AcademicPDFGenerator()
    }
    return AcademicPDFGenerator.instance
  }

  async generateArticlePDF(
    articleData: ArticleData,
    options: Partial<PDFOptions> = {}
  ): Promise<Buffer> {
    const cacheKey = `pdf:${articleData.id}:${JSON.stringify(options)}`
    
    // Try to get cached PDF
    const cached = await cache.get<string>(cacheKey)
    if (cached) {
      return Buffer.from(cached, 'base64')
    }

    const defaultOptions: PDFOptions = {
      format: 'a4',
      includeWatermark: false,
      includeLineNumbers: false,
      fontFamily: 'times',
      fontSize: 12,
      margins: {
        top: 72,
        bottom: 72,
        left: 72,
        right: 72
      },
      ...options
    }

    const htmlContent = this.generateHTMLContent(articleData, defaultOptions)
    const pdfBuffer = await this.convertHTMLToPDF(htmlContent, defaultOptions)
    
    // Cache the PDF for 24 hours
    await cache.set(cacheKey, pdfBuffer.toString('base64'), { 
      ttl: CACHE_TTL.VERY_LONG 
    })
    
    return pdfBuffer
  }

  private generateHTMLContent(article: ArticleData, options: PDFOptions): string {
    const { fontFamily, fontSize, includeLineNumbers } = options
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${article.title}</title>
      <style>
        @page {
          margin: ${options.margins.top}pt ${options.margins.right}pt ${options.margins.bottom}pt ${options.margins.left}pt;
          @top-center {
            content: "${article.title}";
            font-family: ${fontFamily}, serif;
            font-size: 10pt;
            color: #666;
          }
          @bottom-center {
            content: "Page " counter(page) " of " counter(pages);
            font-family: ${fontFamily}, serif;
            font-size: 10pt;
            color: #666;
          }
        }
        
        body {
          font-family: ${fontFamily}, serif;
          font-size: ${fontSize}pt;
          line-height: 1.6;
          color: #000;
          margin: 0;
          padding: 0;
        }
        
        .header {
          border-bottom: 2px solid #000;
          padding-bottom: 20pt;
          margin-bottom: 30pt;
        }
        
        .title {
          font-size: ${fontSize + 6}pt;
          font-weight: bold;
          margin-bottom: 20pt;
          text-align: center;
          line-height: 1.2;
        }
        
        .authors {
          text-align: center;
          margin-bottom: 15pt;
          font-size: ${fontSize - 1}pt;
        }
        
        .author {
          display: inline;
          margin-right: 10pt;
        }
        
        .affiliation {
          font-style: italic;
          font-size: ${fontSize - 2}pt;
          color: #666;
        }
        
        .metadata {
          margin-bottom: 20pt;
          font-size: ${fontSize - 1}pt;
          border: 1px solid #ccc;
          padding: 10pt;
          background-color: #f9f9f9;
        }
        
        .abstract {
          margin-bottom: 30pt;
        }
        
        .abstract-title {
          font-weight: bold;
          margin-bottom: 10pt;
          font-size: ${fontSize + 1}pt;
        }
        
        .abstract-content {
          text-align: justify;
          line-height: 1.5;
        }
        
        .keywords {
          margin-bottom: 30pt;
          font-size: ${fontSize - 1}pt;
        }
        
        .keywords-title {
          font-weight: bold;
          display: inline;
        }
        
        .content {
          text-align: justify;
          orphans: 3;
          widows: 3;
        }
        
        .content h1 {
          font-size: ${fontSize + 3}pt;
          font-weight: bold;
          margin-top: 30pt;
          margin-bottom: 15pt;
          page-break-after: avoid;
        }
        
        .content h2 {
          font-size: ${fontSize + 2}pt;
          font-weight: bold;
          margin-top: 25pt;
          margin-bottom: 12pt;
          page-break-after: avoid;
        }
        
        .content h3 {
          font-size: ${fontSize + 1}pt;
          font-weight: bold;
          margin-top: 20pt;
          margin-bottom: 10pt;
          page-break-after: avoid;
        }
        
        .content p {
          margin-bottom: 12pt;
          text-indent: 20pt;
        }
        
        .content p:first-child {
          text-indent: 0;
        }
        
        .figure {
          margin: 20pt 0;
          page-break-inside: avoid;
          text-align: center;
        }
        
        .figure img {
          max-width: 100%;
          height: auto;
        }
        
        .figure-caption {
          font-size: ${fontSize - 1}pt;
          margin-top: 10pt;
          font-weight: bold;
          text-align: left;
        }
        
        .citation {
          font-size: ${fontSize - 1}pt;
          margin-bottom: 8pt;
          text-indent: -20pt;
          margin-left: 20pt;
        }
        
        .references {
          margin-top: 40pt;
        }
        
        .references-title {
          font-size: ${fontSize + 2}pt;
          font-weight: bold;
          margin-bottom: 20pt;
          border-bottom: 1px solid #000;
          padding-bottom: 5pt;
        }
        
        ${includeLineNumbers ? `
        .content {
          counter-reset: line-number;
        }
        
        .content p::before {
          counter-increment: line-number;
          content: counter(line-number);
          position: absolute;
          left: 10pt;
          color: #999;
          font-size: ${fontSize - 2}pt;
        }
        ` : ''}
        
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 72pt;
          color: rgba(0, 0, 0, 0.1);
          z-index: -1;
          pointer-events: none;
        }
      </style>
    </head>
    <body>
      ${options.includeWatermark ? '<div class="watermark">PREPRINT</div>' : ''}
      
      <div class="header">
        <div class="title">${article.title}</div>
        
        <div class="authors">
          ${article.authors.map(author => `
            <span class="author">${author.name}</span>${author.affiliation ? `<span class="affiliation">${author.affiliation}</span>` : ''}
          `).join(', ')}
        </div>
        
        <div class="metadata">
          <strong>Field of Study:</strong> ${article.fieldOfStudy}<br>
          <strong>Published:</strong> ${new Date(article.publishedAt).toLocaleDateString()}<br>
          ${article.doi ? `<strong>DOI:</strong> ${article.doi}<br>` : ''}
          <strong>Generated:</strong> ${new Date().toLocaleDateString()}
        </div>
      </div>
      
      <div class="abstract">
        <div class="abstract-title">Abstract</div>
        <div class="abstract-content">${article.abstract}</div>
      </div>
      
      <div class="keywords">
        <span class="keywords-title">Keywords:</span> ${article.keywords.join(', ')}
      </div>
      
      <div class="content">
        ${this.processContentForPDF(article.content, article.figures)}
      </div>
      
      ${article.citations && article.citations.length > 0 ? `
      <div class="references">
        <div class="references-title">References</div>
        ${article.citations.map((citation, index) => `
          <div class="citation">[${index + 1}] ${citation.text}</div>
        `).join('')}
      </div>
      ` : ''}
    </body>
    </html>
    `
  }

  private processContentForPDF(content: string, figures?: ArticleData['figures']): string {
    let processedContent = content
    
    // Replace figure placeholders with actual figures
    if (figures) {
      figures.forEach(figure => {
        const placeholder = `{{figure:${figure.id}}}`
        const figureHtml = `
          <div class="figure">
            <img src="${figure.url}" alt="${figure.caption}" />
            <div class="figure-caption">Figure ${figure.id}: ${figure.caption}</div>
          </div>
        `
        processedContent = processedContent.replace(placeholder, figureHtml)
      })
    }
    
    // Convert markdown-style formatting to HTML
    processedContent = processedContent
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<)/, '<p>')
      .replace(/(?<!>)$/, '</p>')
    
    return processedContent
  }

  private async convertHTMLToPDF(html: string, options: PDFOptions): Promise<Buffer> {
    // In a real implementation, you would use a library like Puppeteer or Playwright
    // For this example, we'll simulate PDF generation
    
    try {
      // This is a placeholder - in production you would use:
      // const puppeteer = require('puppeteer')
      // const browser = await puppeteer.launch()
      // const page = await browser.newPage()
      // await page.setContent(html)
      // const pdf = await page.pdf({
      //   format: options.format,
      //   printBackground: true,
      //   margin: {
      //     top: `${options.margins.top}pt`,
      //     bottom: `${options.margins.bottom}pt`,
      //     left: `${options.margins.left}pt`,
      //     right: `${options.margins.right}pt`
      //   }
      // })
      // await browser.close()
      // return pdf
      
      // For now, return a placeholder buffer
      return Buffer.from(`PDF content for article would be generated here. HTML length: ${html.length}`)
    } catch (error) {
      console.error('PDF generation error:', error)
      throw new Error('Failed to generate PDF')
    }
  }

  async generateCitationPDF(citations: Array<{
    title: string
    authors: string[]
    journal: string
    year: string
    doi?: string
  }>): Promise<Buffer> {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bibliography</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; }
        .citation { margin-bottom: 12pt; text-indent: -20pt; margin-left: 20pt; }
        .title { font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>References</h1>
      ${citations.map((citation, index) => `
        <div class="citation">
          [${index + 1}] ${citation.authors.join(', ')}. 
          <span class="title">${citation.title}</span> 
          ${citation.journal}, ${citation.year}.
          ${citation.doi ? ` DOI: ${citation.doi}` : ''}
        </div>
      `).join('')}
    </body>
    </html>
    `
    
    return this.convertHTMLToPDF(html, {
      format: 'a4',
      includeWatermark: false,
      includeLineNumbers: false,
      fontFamily: 'times',
      fontSize: 12,
      margins: { top: 72, bottom: 72, left: 72, right: 72 }
    })
  }

  async invalidatePDFCache(articleId: string): Promise<void> {
    // Invalidate all PDF variants for this article
    const patterns = [
      `pdf:${articleId}:*`
    ]
    
    for (const pattern of patterns) {
      await cache.flush(pattern)
    }
  }
}

export const pdfGenerator = AcademicPDFGenerator.getInstance()