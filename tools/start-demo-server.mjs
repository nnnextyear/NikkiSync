import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { renderWebGalleryPage } from '../apps/pc-companion/src/web-gallery/WebGalleryPage.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = parseInt(process.env.PORT || '8899', 10)

// 1. 创建临时演示资产文件（真实的合法高品质 PNG）
const tempDir = path.join(os.tmpdir(), 'nikkisync-demo-assets')
fs.mkdirSync(tempDir, { recursive: true })

const photoPath1 = path.join(tempDir, 'demo_nikki_01.jpg')
const photoPath2 = path.join(tempDir, 'demo_nikki_02.jpg')
const photoPath3 = path.join(tempDir, 'demo_nikki_03.jpg')
const motionVideoPath = path.join(tempDir, 'demo_live_video.mp4')
const motionVideoPath2 = path.join(tempDir, 'demo_live_video_02.mp4')

// 真实高质量暖暖图片候选路径
const realCandidate1 = 'C:/Users/admin/Pictures/Saved Pictures/R.jpg'
const realCandidate2 = 'C:/Users/admin/Pictures/Saved Pictures/96fe672c93eaf6aa11d29b3310f7cf5.jpg'
const realCandidate3 = 'D:/cc-connect-work/.cc-connect/images/img_1780202601456_0.jpg'

if (fs.existsSync(realCandidate1)) {
  fs.copyFileSync(realCandidate1, photoPath1)
} else {
  fs.writeFileSync(photoPath1, createRealPng(600, 800, [255, 192, 203], [255, 105, 180]))
}

if (fs.existsSync(realCandidate2)) {
  fs.copyFileSync(realCandidate2, photoPath2)
} else {
  fs.writeFileSync(photoPath2, createRealPng(600, 800, [218, 112, 214], [138, 43, 226]))
}

if (fs.existsSync(realCandidate3)) {
  fs.copyFileSync(realCandidate3, photoPath3)
} else {
  fs.writeFileSync(photoPath3, createRealPng(600, 800, [168, 230, 207], [86, 171, 145]))
}

const stat1 = fs.statSync(photoPath1)
const stat2 = fs.statSync(photoPath2)
const stat3 = fs.statSync(photoPath3)

// 真实可播放高兼容度标准 MP4 视频资源
const realMp4Candidate1 = 'D:/Anaconda3/envs/raganything/Lib/site-packages/gradio/media_assets/videos/world.mp4'
const realMp4Candidate2 = 'D:/Anaconda3/envs/raganything/Lib/site-packages/gradio/media_assets/videos/a.mp4'
const realMp4Candidate3 = 'C:/Users/admin/.vscode/extensions/openai.chatgpt-26.818.21641-win32-x64/webview/assets/codex-home-hero-light-Cyip34F2.mp4'

if (fs.existsSync(realMp4Candidate1)) {
  fs.copyFileSync(realMp4Candidate1, motionVideoPath)
} else if (fs.existsSync(realMp4Candidate3)) {
  fs.copyFileSync(realMp4Candidate3, motionVideoPath)
} else if (fs.existsSync(realMp4Candidate2)) {
  fs.copyFileSync(realMp4Candidate2, motionVideoPath)
}

if (fs.existsSync(realMp4Candidate2)) {
  fs.copyFileSync(realMp4Candidate2, motionVideoPath2)
} else {
  fs.copyFileSync(motionVideoPath, motionVideoPath2)
}

const statVideo1 = fs.statSync(motionVideoPath)
const statVideo2 = fs.statSync(motionVideoPath2)

// 2. 模拟暖暖相册数据库数据
const MOCK_ASSETS = [
  {
    id: 'nikki_live_01',
    type: 'motion_photo',
    uid: '2033886',
    capturedAt: '2026-10-28 15:30:20',
    hasMotion: true,
    metadata: {
      camera: { focalLength: 85, apertureSection: 1.8, exposure: 0.3, contrast: 10, saturation: 5 },
      dressing: {
        suitName: '蹦跳计划',
        clothes: [
          { name: '蹦跳帽子', id: '10419' },
          { name: '星光连身裙', id: '10420' },
          { name: '小熊软糖鞋', id: '10421' }
        ]
      },
      photography: { weather: '微风晴空' }
    },
    resources: [
      { role: 'source_primary', file_name: 'nikki_live_01.jpg', mime_type: 'image/jpeg', size_bytes: stat1.size, path: photoPath1 },
      { role: 'source_motion', file_name: 'nikki_live_01.mp4', mime_type: 'video/mp4', size_bytes: statVideo1.size, path: motionVideoPath }
    ]
  },
  {
    id: 'nikki_photo_02',
    type: 'motion_photo',
    uid: '2033886',
    capturedAt: '2026-10-27 19:10:05',
    hasMotion: true,
    metadata: {
      camera: { focalLength: 50, apertureSection: 2.8, exposure: 0 },
      dressing: {
        suitName: '奇迹之冠',
        clothes: [
          { name: '辉光之羽', id: '20001' },
          { name: '月华织梦长裙', id: '20002' }
        ]
      },
      photography: { weather: '夜景月色' }
    },
    resources: [
      { role: 'source_primary', file_name: 'nikki_photo_02.jpg', mime_type: 'image/jpeg', size_bytes: stat2.size, path: photoPath2 },
      { role: 'source_motion', file_name: 'nikki_photo_02.mp4', mime_type: 'video/mp4', size_bytes: statVideo2.size, path: motionVideoPath2 }
    ]
  },
  {
    id: 'nikki_photo_03',
    type: 'photo',
    uid: '9988776',
    capturedAt: '2026-10-26 11:20:00',
    hasMotion: false,
    metadata: {
      camera: { focalLength: 35, apertureSection: 4.0 },
      dressing: {
        clothes: [
          { name: '旅行初心衬衫', id: '30001' }
        ]
      }
    },
    resources: [
      { role: 'source_primary', file_name: 'nikki_photo_03.jpg', mime_type: 'image/jpeg', size_bytes: stat3.size, path: photoPath3 }
    ]
  }
]

function json(res, status, body) {
  const data = Buffer.from(JSON.stringify(body), 'utf8')
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': data.length,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  })
  res.end(data)
}

async function streamFile(filePath, mimeType, req, res, downloadFilename) {
  try {
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) {
      json(res, 404, { error: 'file_not_found' })
      return
    }

    const totalSize = fileStat.size
    const rangeHeader = req.headers.range

    const baseHeaders = {
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

    // RFC 7233 范围播放 (iOS Safari / WebKit 必备)
    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const rawRange = rangeHeader.replace(/^bytes=/, '').trim()
      const [startStr, endStr] = rawRange.split('-')
      let start, end

      if (!startStr && endStr) {
        const suffixLength = parseInt(endStr, 10)
        start = Math.max(0, totalSize - suffixLength)
        end = totalSize - 1
      } else {
        start = parseInt(startStr, 10)
        end = endStr ? parseInt(endStr, 10) : totalSize - 1
      }

      if (start >= totalSize) {
        res.writeHead(416, {
          'Content-Range': `bytes */${totalSize}`,
          'Content-Type': mimeType,
          'Access-Control-Allow-Origin': '*'
        })
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

// 3. 路由处理
async function handleRequest(req, res, url) {
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

  // 主页
  if (pathname === '/web' || pathname === '/gallery' || pathname === '/web/index.html') {
    const page = renderWebGalleryPage({ serverName: '大喵相册 · 本地体验版' })
    const buffer = Buffer.from(page, 'utf8')
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache'
    })
    res.end(buffer)
    return
  }

  // 资产列表
  if (pathname === '/web/api/assets' && req.method === 'GET') {
    const assets = MOCK_ASSETS.map(a => ({
      id: a.id,
      type: a.type,
      uid: a.uid,
      capturedAt: a.capturedAt,
      hasMotion: a.hasMotion
    }))
    json(res, 200, { assets })
    return
  }

  // 详情
  const detailMatch = /^\/web\/api\/assets\/([^/]+)$/.exec(pathname)
  if (detailMatch && req.method === 'GET') {
    const assetId = decodeURIComponent(detailMatch[1])
    const asset = MOCK_ASSETS.find(a => a.id === assetId)
    if (!asset) {
      json(res, 404, { error: 'not_found' })
      return
    }
    json(res, 200, {
      id: asset.id,
      type: asset.type,
      uid: asset.uid,
      capturedAt: asset.capturedAt,
      metadata: asset.metadata,
      resources: asset.resources.map(r => ({
        role: r.role,
        file_name: r.file_name,
        mime_type: r.mime_type,
        size_bytes: r.size_bytes
      }))
    })
    return
  }

  // 图片预览
  const previewMatch = /^\/web\/api\/assets\/([^/]+)\/preview$/.exec(pathname)
  if (previewMatch && (req.method === 'GET' || req.method === 'HEAD')) {
    const assetId = decodeURIComponent(previewMatch[1])
    const asset = MOCK_ASSETS.find(a => a.id === assetId)
    const resItem = asset?.resources.find(r => r.role === 'source_primary')
    if (!resItem) {
      json(res, 404, { error: 'not_found' })
      return
    }
    await streamFile(resItem.path, resItem.mime_type, req, res)
    return
  }

  // 视频原件 / 播放
  const videoMatch = /^\/web\/api\/assets\/([^/]+)\/video$/.exec(pathname)
  if (videoMatch && (req.method === 'GET' || req.method === 'HEAD')) {
    const assetId = decodeURIComponent(videoMatch[1])
    const asset = MOCK_ASSETS.find(a => a.id === assetId)
    const resItem = asset?.resources.find(r => r.role === 'source_motion')
    if (!resItem) {
      json(res, 404, { error: 'not_found' })
      return
    }
    const isDownload = url.searchParams.get('download') === '1'
    await streamFile(resItem.path, resItem.mime_type, req, res, isDownload ? resItem.file_name : undefined)
    return
  }

  // 原始大图下载
  const downloadMatch = /^\/web\/api\/assets\/([^/]+)\/download$/.exec(pathname)
  if (downloadMatch && req.method === 'GET') {
    const assetId = decodeURIComponent(downloadMatch[1])
    const asset = MOCK_ASSETS.find(a => a.id === assetId)
    const resItem = asset?.resources.find(r => r.role === 'source_primary')
    if (!resItem) {
      json(res, 404, { error: 'not_found' })
      return
    }
    await streamFile(resItem.path, resItem.mime_type, req, res, resItem.file_name)
    return
  }

  json(res, 404, { error: 'not_found' })
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`)
    await handleRequest(req, res, url)
  } catch (err) {
    json(res, 400, { error: 'bad_request' })
  }
})

function getLocalIp() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return '127.0.0.1'
}

const localIp = getLocalIp()

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n======================================================')
  console.log('🌸 大喵相册 Web 版 · 本地全功能测试服务已成功启动！')
  console.log('======================================================\n')
  console.log(`💻 电脑浏览器直接打开：   http://localhost:${PORT}/web/`)
  console.log(`📱 手机 (同一Wi-Fi) 打开： http://${localIp}:${PORT}/web/\n`)
  console.log('👉 可在此体验验证的所有功能：')
  console.log('  1. 缩略图瀑布流（真实彩色高清大图已就位）')
  console.log('  2. 点击单张照片打开全屏高清大图')
  console.log('  3. 实况照片切换「▶ 播放实况」与「⏸ 查看封面」')
  console.log('  4. 点击右上角「ℹ️」查看游戏内穿搭、套装、相机焦距/光圈/天气')
  console.log('  5. 键盘左右箭头 (← / →) 或手机屏幕左右滑动自由切图')
  console.log('  6. 点击「💾 保存原图」测试无损下载')
  console.log('  7. 顶部 UID 标签过滤切换好友相册')
  console.log('\n按 Ctrl + C 即可退出并停止演示服务。\n')
})
