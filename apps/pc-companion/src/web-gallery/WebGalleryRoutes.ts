import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { DatabaseManager } from '@nikkisync/database'
import { renderWebGalleryPage } from './WebGalleryPage.js'

function json(res: ServerResponse, status: number, body: unknown): void {
  const data = Buffer.from(JSON.stringify(body), 'utf8')
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': data.length,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  })
  res.end(data)
}

export class WebGalleryRoutes {
  private readonly database: DatabaseManager
  private readonly serverName: string

  constructor(
    database: DatabaseManager,
    serverName: string = '大喵相机助手'
  ) {
    this.database = database
    this.serverName = serverName
  }

  canHandle(pathname: string): boolean {
    return (
      pathname === '/web' ||
      pathname === '/web/' ||
      pathname.startsWith('/web/') ||
      pathname === '/gallery' ||
      pathname === '/gallery/'
    )
  }

  async handle(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
    try {
      // 0. 支持 OPTIONS 预检
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Range',
          'Access-Control-Max-Age': '86400'
        })
        res.end()
        return
      }

      const pathname = url.pathname.replace(/\/+$/, '') || '/'

      // 1. Web Gallery 主页
      if (pathname === '/web' || pathname === '/gallery' || pathname === '/web/index.html') {
        const page = renderWebGalleryPage({ serverName: this.serverName })
        const buffer = Buffer.from(page, 'utf8')
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Length': buffer.length,
          'Cache-Control': 'no-cache'
        })
        res.end(buffer)
        return
      }

      // 2. 资产列表 API
      if (pathname === '/web/api/assets' && req.method === 'GET') {
        const limitParam = parseInt(url.searchParams.get('limit') || '500', 10)
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 2000) : 500

        const rows = this.database.connection.prepare(`
          SELECT a.asset_id, a.asset_type, a.uid, a.captured_at, a.discovered_at, a.metadata_json,
                 (a.asset_type = 'motion_photo' OR EXISTS(SELECT 1 FROM resources r WHERE r.asset_id = a.asset_id AND r.role = 'source_motion')) AS has_motion
          FROM assets a
          WHERE a.asset_state IN ('ready', 'resolving')
          ORDER BY COALESCE(a.captured_at, a.discovered_at) DESC, a.asset_id ASC
          LIMIT ?
        `).all(limit) as Array<{
          asset_id: string
          asset_type: string
          uid: string | null
          captured_at: string | null
          discovered_at: string
          metadata_json: string | null
          has_motion: number
        }>

        const assets = rows.map(r => ({
          id: r.asset_id,
          type: r.asset_type,
          uid: r.uid,
          capturedAt: r.captured_at || r.discovered_at,
          hasMotion: Boolean(r.has_motion)
        }))

        json(res, 200, { assets })
        return
      }

      // 3. 单资产元数据详情 API: /web/api/assets/:id
      const detailMatch = /^\/web\/api\/assets\/([^/]+)$/.exec(pathname)
      if (detailMatch && req.method === 'GET') {
        const assetId = decodeURIComponent(detailMatch[1]!)
        const asset = this.database.connection.prepare(
          'SELECT * FROM assets WHERE asset_id = ?'
        ).get(assetId) as Record<string, unknown> | undefined

        if (!asset) {
          json(res, 404, { error: 'not_found' })
          return
        }

        const resources = this.database.connection.prepare(
          'SELECT resource_id, role, file_name, mime_type, size_bytes, width, height FROM resources WHERE asset_id = ?'
        ).all(assetId)

        let metadata = null
        if (asset.metadata_json) {
          try { metadata = JSON.parse(String(asset.metadata_json)) } catch {}
        }

        json(res, 200, {
          id: asset.asset_id,
          type: asset.asset_type,
          uid: asset.uid,
          capturedAt: asset.captured_at || asset.discovered_at,
          metadata,
          resources
        })
        return
      }

      // 4. 图片预览: /web/api/assets/:id/preview
      // 带 ?thumb=1 时优先取缩略图保障网格速度；未带时优先取全屏高清图保障画质
      const previewMatch = /^\/web\/api\/assets\/([^/]+)\/preview$/.exec(pathname)
      if (previewMatch && (req.method === 'GET' || req.method === 'HEAD')) {
        const assetId = decodeURIComponent(previewMatch[1]!)
        const isThumb = url.searchParams.has('thumb') || url.searchParams.has('thumbnail')
        const orderClause = isThumb
          ? `ORDER BY CASE role
              WHEN 'derived_thumbnail' THEN 1
              WHEN 'derived_preview' THEN 2
              WHEN 'source_low_quality' THEN 3
              WHEN 'source_primary' THEN 4
              WHEN 'source_high_quality' THEN 5
              ELSE 6 END ASC`
          : `ORDER BY CASE role
              WHEN 'derived_preview' THEN 1
              WHEN 'source_primary' THEN 2
              WHEN 'source_high_quality' THEN 3
              WHEN 'derived_thumbnail' THEN 4
              ELSE 5 END ASC`

        const resource = this.database.connection.prepare(`
          SELECT * FROM resources
          WHERE asset_id = ? AND stable_state <> 'missing'
            AND role IN ('derived_thumbnail', 'derived_preview', 'source_low_quality', 'source_primary', 'source_high_quality', 'unknown')
          ${orderClause}
          LIMIT 1
        `).get(assetId) as { source_path: string; mime_type: string; size_bytes: number } | undefined

        if (!resource) {
          json(res, 404, { error: 'not_found' })
          return
        }

        await this.streamFile(resource.source_path, resource.mime_type || 'image/jpeg', req, res)
        return
      }

    // 5. 原图下载: /web/api/assets/:id/download (优先高清原片)
    const downloadMatch = /^\/web\/api\/assets\/([^/]+)\/download$/.exec(pathname)
    if (downloadMatch && (req.method === 'GET' || req.method === 'HEAD')) {
      const assetId = decodeURIComponent(downloadMatch[1]!)
      const resource = this.database.connection.prepare(`
        SELECT * FROM resources
        WHERE asset_id = ? AND stable_state <> 'missing'
          AND role IN ('source_high_quality', 'source_primary', 'source_low_quality', 'unknown')
        ORDER BY CASE role
          WHEN 'source_high_quality' THEN 1
          WHEN 'source_primary' THEN 2
          WHEN 'source_low_quality' THEN 3
          ELSE 4 END ASC
        LIMIT 1
      `).get(assetId) as { source_path: string; mime_type: string; file_name: string } | undefined

      if (!resource) {
        json(res, 404, { error: 'not_found' })
        return
      }

      await this.streamFile(
        resource.source_path,
        resource.mime_type || 'image/jpeg',
        req,
        res,
        resource.file_name || `${assetId}.jpg`
      )
      return
    }

    // 6. 动态视频流/下载: /web/api/assets/:id/video
    const videoMatch = /^\/web\/api\/assets\/([^/]+)\/video$/.exec(pathname)
    if (videoMatch && (req.method === 'GET' || req.method === 'HEAD')) {
      const assetId = decodeURIComponent(videoMatch[1]!)
      const resource = this.database.connection.prepare(`
        SELECT * FROM resources
        WHERE asset_id = ? AND stable_state <> 'missing'
          AND role IN ('source_motion', 'motion_video')
        LIMIT 1
      `).get(assetId) as { source_path: string; mime_type: string; file_name: string } | undefined

      if (!resource) {
        json(res, 404, { error: 'not_found' })
        return
      }

      const isDownload = url.searchParams.has('download')
      await this.streamFile(
        resource.source_path,
        resource.mime_type || 'video/mp4',
        req,
        res,
        isDownload ? (resource.file_name || `${assetId}.mp4`) : undefined
      )
      return
    }

      json(res, 404, { error: 'not_found' })
    } catch {
      json(res, 400, { error: 'bad_request' })
    }
  }

  private async streamFile(
    filePath: string,
    mimeType: string,
    req: IncomingMessage,
    res: ServerResponse,
    downloadFilename?: string
  ): Promise<void> {
    try {
      const fileStat = await stat(filePath)
      if (!fileStat.isFile()) {
        json(res, 404, { error: 'not_found' })
        return
      }

      const totalSize = fileStat.size
      const rangeHeader = req.headers.range

      const baseHeaders: Record<string, string | number> = {
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*'
      }

      if (downloadFilename) {
        const safeAscii = downloadFilename.replace(/[^\x20-\x7E]/g, '_')
        const utf8Encoded = encodeURIComponent(downloadFilename)
        baseHeaders['Content-Disposition'] = `attachment; filename="${safeAscii}"; filename*=UTF-8''${utf8Encoded}`
      }

      // Handle HTTP Range for smooth video seeking & iOS Safari playback (RFC 7233 compliant)
      if (rangeHeader && rangeHeader.startsWith('bytes=')) {
        const rawRange = rangeHeader.replace(/^bytes=/, '').trim()
        const [startStr, endStr] = rawRange.split('-')
        let start: number
        let end: number

        if (!startStr && endStr) {
          // Suffix byte range: bytes=-500 (last 500 bytes)
          const suffixLength = parseInt(endStr, 10)
          if (isNaN(suffixLength) || suffixLength <= 0) {
            res.writeHead(416, { 'Content-Range': `bytes */${totalSize}`, 'Access-Control-Allow-Origin': '*' })
            res.end()
            return
          }
          start = Math.max(0, totalSize - suffixLength)
          end = totalSize - 1
        } else if (startStr && !endStr) {
          // Open range: bytes=500- (from 500 to end of file)
          start = parseInt(startStr, 10)
          end = totalSize - 1
        } else if (startStr && endStr) {
          // Closed range: bytes=100-500
          start = parseInt(startStr, 10)
          end = parseInt(endStr, 10)
        } else {
          res.writeHead(416, { 'Content-Range': `bytes */${totalSize}`, 'Access-Control-Allow-Origin': '*' })
          res.end()
          return
        }

        if (isNaN(start) || isNaN(end) || start < 0 || start >= totalSize || end >= totalSize || start > end) {
          res.writeHead(416, {
            'Content-Range': `bytes */${totalSize}`,
            'Content-Type': mimeType,
            'Access-Control-Allow-Origin': '*'
          })
          res.end()
          return
        }

        const chunkSize = end - start + 1
        res.writeHead(206, {
          ...baseHeaders,
          'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          'Content-Length': chunkSize
        })

        if (req.method === 'HEAD') {
          res.end()
          return
        }

        const stream = createReadStream(filePath, { start, end })
        stream.on('error', () => {
          if (!res.headersSent) res.writeHead(500)
          res.end()
        })
        res.on('close', () => stream.destroy())
        stream.pipe(res)
        return
      }

      // Full content response
      res.writeHead(200, {
        ...baseHeaders,
        'Content-Length': totalSize
      })

      if (req.method === 'HEAD') {
        res.end()
        return
      }

      const stream = createReadStream(filePath)
      stream.on('error', () => {
        if (!res.headersSent) res.writeHead(500)
        res.end()
      })
      res.on('close', () => stream.destroy())
      stream.pipe(res)
    } catch {
      json(res, 404, { error: 'file_unreadable' })
    }
  }
}
