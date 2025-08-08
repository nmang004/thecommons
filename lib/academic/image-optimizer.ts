import { cache, CACHE_TTL } from '@/lib/redis/cache'
import * as crypto from 'crypto'

interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png' | 'avif'
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  background?: string
  progressive?: boolean
  preserveMetadata?: boolean
}

interface AcademicImageMetadata {
  width: number
  height: number
  format: string
  size: number
  hasAlpha: boolean
  colorSpace?: string
  dpi?: number
  caption?: string
  altText?: string
  figureNumber?: string
  experimentalConditions?: string[]
}

export class AcademicImageOptimizer {
  private static instance: AcademicImageOptimizer
  
  public static getInstance(): AcademicImageOptimizer {
    if (!AcademicImageOptimizer.instance) {
      AcademicImageOptimizer.instance = new AcademicImageOptimizer()
    }
    return AcademicImageOptimizer.instance
  }

  async optimizeImage(
    imageBuffer: Buffer,
    options: ImageOptimizationOptions = {}
  ): Promise<{
    buffer: Buffer
    metadata: AcademicImageMetadata
    optimizationRatio: number
  }> {
    const cacheKey = `img:${this.generateImageHash(imageBuffer)}:${JSON.stringify(options)}`
    
    // Try to get cached optimized image
    const cached = await cache.get<{
      buffer: string
      metadata: AcademicImageMetadata
      optimizationRatio: number
    }>(cacheKey)
    
    if (cached) {
      return {
        buffer: Buffer.from(cached.buffer, 'base64'),
        metadata: cached.metadata,
        optimizationRatio: cached.optimizationRatio
      }
    }

    const defaultOptions: Required<ImageOptimizationOptions> = {
      width: 1200,
      height: 800,
      quality: 85,
      format: 'webp',
      fit: 'inside',
      background: 'white',
      progressive: true,
      preserveMetadata: true,
      ...options
    }

    try {
      // Get original metadata
      const originalMetadata = await this.getImageMetadata(imageBuffer)
      
      // Optimize the image
      const optimizedBuffer = await this.processImage(imageBuffer, defaultOptions)
      const optimizedMetadata = await this.getImageMetadata(optimizedBuffer)
      
      // Calculate optimization ratio
      const optimizationRatio = (originalMetadata.size - optimizedMetadata.size) / originalMetadata.size
      
      const result = {
        buffer: optimizedBuffer,
        metadata: optimizedMetadata,
        optimizationRatio
      }
      
      // Cache the optimized image for 7 days
      await cache.set(cacheKey, {
        buffer: optimizedBuffer.toString('base64'),
        metadata: optimizedMetadata,
        optimizationRatio
      }, { ttl: CACHE_TTL.VERY_LONG })
      
      return result
    } catch (error) {
      console.error('Image optimization error:', error)
      throw new Error('Failed to optimize image')
    }
  }

  async optimizeForWebDisplay(imageBuffer: Buffer): Promise<{
    webp: Buffer
    jpeg: Buffer
    metadata: AcademicImageMetadata
  }> {
    const [webpResult, jpegResult] = await Promise.all([
      this.optimizeImage(imageBuffer, {
        format: 'webp',
        quality: 85,
        width: 1200,
        progressive: true
      }),
      this.optimizeImage(imageBuffer, {
        format: 'jpeg',
        quality: 90,
        width: 1200,
        progressive: true
      })
    ])

    return {
      webp: webpResult.buffer,
      jpeg: jpegResult.buffer,
      metadata: webpResult.metadata
    }
  }

  async optimizeForPrint(imageBuffer: Buffer, _dpi: number = 300): Promise<Buffer> {
    // For print, we want high quality and preserve original dimensions
    const result = await this.optimizeImage(imageBuffer, {
      format: 'png', // PNG for print to preserve quality
      quality: 95,
      fit: 'inside',
      preserveMetadata: true
    })

    return result.buffer
  }

  async generateThumbnails(imageBuffer: Buffer, sizes: number[] = [150, 300, 600]): Promise<{
    [size: number]: Buffer
  }> {
    const thumbnails: { [size: number]: Buffer } = {}
    
    await Promise.all(
      sizes.map(async (size) => {
        const result = await this.optimizeImage(imageBuffer, {
          width: size,
          height: size,
          fit: 'cover',
          format: 'webp',
          quality: 80
        })
        thumbnails[size] = result.buffer
      })
    )

    return thumbnails
  }

  async optimizeForFigures(imageBuffer: Buffer, figureType: 'chart' | 'photo' | 'diagram' | 'microscopy'): Promise<{
    web: Buffer
    print: Buffer
    thumbnail: Buffer
    metadata: AcademicImageMetadata
  }> {
    let webOptions: ImageOptimizationOptions
    let printOptions: ImageOptimizationOptions

    switch (figureType) {
      case 'chart':
        webOptions = { format: 'png', quality: 95, width: 800 }
        printOptions = { format: 'png', quality: 100 }
        break
      case 'photo':
        webOptions = { format: 'webp', quality: 85, width: 1200 }
        printOptions = { format: 'jpeg', quality: 95 }
        break
      case 'diagram':
        webOptions = { format: 'png', quality: 90, width: 1000 }
        printOptions = { format: 'png', quality: 100 }
        break
      case 'microscopy':
        webOptions = { format: 'jpeg', quality: 90, width: 1200 }
        printOptions = { format: 'jpeg', quality: 98 }
        break
      default:
        webOptions = { format: 'webp', quality: 85, width: 1200 }
        printOptions = { format: 'jpeg', quality: 95 }
    }

    const [webResult, printResult, thumbnailResult] = await Promise.all([
      this.optimizeImage(imageBuffer, webOptions),
      this.optimizeImage(imageBuffer, printOptions),
      this.optimizeImage(imageBuffer, {
        width: 300,
        height: 200,
        fit: 'cover',
        format: 'webp',
        quality: 80
      })
    ])

    return {
      web: webResult.buffer,
      print: printResult.buffer,
      thumbnail: thumbnailResult.buffer,
      metadata: webResult.metadata
    }
  }

  private async processImage(
    buffer: Buffer,
    _options: Required<ImageOptimizationOptions>
  ): Promise<Buffer> {
    // In a real implementation, you would use a library like Sharp
    // For this example, we'll simulate image processing
    
    try {
      // This is a placeholder - in production you would use:
      // const sharp = require('sharp')
      // let pipeline = sharp(buffer)
      // 
      // if (options.width || options.height) {
      //   pipeline = pipeline.resize(options.width, options.height, {
      //     fit: options.fit,
      //     background: options.background
      //   })
      // }
      // 
      // switch (options.format) {
      //   case 'webp':
      //     pipeline = pipeline.webp({ quality: options.quality, progressive: options.progressive })
      //     break
      //   case 'jpeg':
      //     pipeline = pipeline.jpeg({ quality: options.quality, progressive: options.progressive })
      //     break
      //   case 'png':
      //     pipeline = pipeline.png({ quality: options.quality, progressive: options.progressive })
      //     break
      //   case 'avif':
      //     pipeline = pipeline.avif({ quality: options.quality })
      //     break
      // }
      // 
      // if (!options.preserveMetadata) {
      //   pipeline = pipeline.withMetadata(false)
      // }
      // 
      // return await pipeline.toBuffer()
      
      // For now, return a simulated smaller buffer
      const originalSize = buffer.length
      const compressionRatio = 0.7 // Simulate 30% compression
      const simulatedSize = Math.floor(originalSize * compressionRatio)
      
      return Buffer.alloc(simulatedSize, buffer.slice(0, Math.min(simulatedSize, originalSize)))
    } catch (error) {
      console.error('Image processing error:', error)
      throw new Error('Failed to process image')
    }
  }

  private async getImageMetadata(buffer: Buffer): Promise<AcademicImageMetadata> {
    // In a real implementation, you would extract actual metadata
    // For this example, we'll return simulated metadata
    
    return {
      width: 1200,
      height: 800,
      format: 'webp',
      size: buffer.length,
      hasAlpha: false,
      colorSpace: 'sRGB',
      dpi: 72
    }
  }

  private generateImageHash(buffer: Buffer): string {
    // Generate a simple hash for caching purposes
    return crypto.createHash('md5').update(buffer).digest('hex').substring(0, 16)
  }

  async validateAcademicImage(buffer: Buffer): Promise<{
    valid: boolean
    issues: string[]
    recommendations: string[]
  }> {
    const metadata = await this.getImageMetadata(buffer)
    const issues: string[] = []
    const recommendations: string[] = []

    // Check resolution
    if (metadata.width < 300 || metadata.height < 300) {
      issues.push('Image resolution is too low for publication quality')
      recommendations.push('Use images with minimum 300x300 pixels')
    }

    // Check DPI for print
    if (metadata.dpi && metadata.dpi < 300) {
      issues.push('DPI is too low for print publication')
      recommendations.push('Use images with at least 300 DPI for print quality')
    }

    // Check file size
    const sizeMB = metadata.size / (1024 * 1024)
    if (sizeMB > 10) {
      issues.push('Image file size is very large')
      recommendations.push('Consider compressing the image to reduce file size')
    }

    // Check aspect ratio for common figure types
    const aspectRatio = metadata.width / metadata.height
    if (aspectRatio < 0.5 || aspectRatio > 3) {
      recommendations.push('Consider adjusting aspect ratio for better display')
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations
    }
  }

  async extractImageText(_buffer: Buffer): Promise<string[]> {
    // In a real implementation, you would use OCR
    // For this example, return empty array
    return []
  }

  async generateImagePreview(buffer: Buffer, previewType: 'thumbnail' | 'watermarked' | 'blurred'): Promise<Buffer> {
    switch (previewType) {
      case 'thumbnail':
        const thumbnail = await this.optimizeImage(buffer, {
          width: 200,
          height: 150,
          fit: 'cover',
          format: 'webp',
          quality: 75
        })
        return thumbnail.buffer

      case 'watermarked':
        // Add watermark for preview
        return this.addWatermark(buffer, 'PREVIEW')

      case 'blurred':
        // Apply blur effect for preview
        return this.applyBlur(buffer, 5)

      default:
        return buffer
    }
  }

  private async addWatermark(buffer: Buffer, _text: string): Promise<Buffer> {
    // In production, use Sharp or similar to add watermark
    // For now, return original buffer
    return buffer
  }

  private async applyBlur(buffer: Buffer, _radius: number): Promise<Buffer> {
    // In production, use Sharp or similar to apply blur
    // For now, return original buffer
    return buffer
  }

  async getOptimizationReport(originalBuffer: Buffer, optimizedBuffer: Buffer): Promise<{
    originalSize: number
    optimizedSize: number
    compressionRatio: number
    qualityScore: number
    formatRecommendation: string
  }> {
    const originalMetadata = await this.getImageMetadata(originalBuffer)
    const optimizedMetadata = await this.getImageMetadata(optimizedBuffer)

    const compressionRatio = (originalMetadata.size - optimizedMetadata.size) / originalMetadata.size
    
    // Simple quality score based on compression ratio
    const qualityScore = Math.max(0, Math.min(100, 100 - (compressionRatio * 50)))

    let formatRecommendation = 'webp'
    if (originalMetadata.hasAlpha) {
      formatRecommendation = 'png'
    } else if (originalMetadata.width > 2000 || originalMetadata.height > 2000) {
      formatRecommendation = 'jpeg'
    }

    return {
      originalSize: originalMetadata.size,
      optimizedSize: optimizedMetadata.size,
      compressionRatio,
      qualityScore,
      formatRecommendation
    }
  }
}

export const imageOptimizer = AcademicImageOptimizer.getInstance()