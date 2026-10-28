/**
 * NikkiSync Web Gallery - Standalone Responsive Photo Gallery for Mobile & Desktop Browsers
 * Designed for iPhone Safari, iPad, Android, and Desktop browsers.
 */

export function renderWebGalleryPage(options: {
  title?: string
  serverName?: string
  assetsCount?: number
  baseUrl?: string
} = {}): string {
  const title = options.title ?? '大喵相册 · Momo Gallery'
  const serverName = options.serverName ?? '大喵相机助手'

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="大喵相册">
  <meta name="theme-color" content="#FFF8F0">
  <title>${title}</title>
  <style>
    :root {
      --background: #FFF8F0;
      --surface: #FFFCF7;
      --text: #59475E;
      --secondary: #8C7588;
      --brand: #D780AA;
      --brand-hover: #C66D98;
      --primary: #F6BCC0;
      --primary-foreground: #62425A;
      --tint: #FBE6ED;
      --tint-hover: #F8D9E4;
      --accent: #7B5068;
      --border: #EED5DD;
      --card-bg: rgba(255, 252, 247, 0.88);
      --glass-shadow: 0 8px 32px rgba(98, 66, 90, 0.06);
      --radius: 18px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      background: var(--background);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", "Microsoft YaHei", sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      padding-bottom: env(safe-area-inset-bottom, 20px);
    }

    .ambient {
      position: fixed;
      inset: 0;
      pointer-events: none;
      background: radial-gradient(circle at 15% 10%, #F5DCE5 0%, transparent 45%),
                  radial-gradient(circle at 85% 85%, #FAE6DF 0%, transparent 50%),
                  var(--background);
      z-index: -1;
    }

    header {
      position: sticky;
      top: 0;
      z-index: 20;
      padding: calc(env(safe-area-inset-top, 12px) + 8px) 16px 12px;
      background: rgba(255, 248, 240, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(238, 213, 221, 0.6);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .brand-area {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-logo {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: var(--tint);
      display: grid;
      place-items: center;
      font-size: 18px;
      color: var(--brand);
      box-shadow: 0 2px 8px rgba(215, 128, 170, 0.15);
    }
    .brand-text h1 {
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -0.3px;
      color: var(--text);
    }
    .brand-text p {
      font-size: 11px;
      color: var(--secondary);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--accent);
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #83A094;
    }

    /* UID / Account selector */
    .filter-bar {
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }
    .filter-bar::-webkit-scrollbar { display: none; }
    .filter-pill {
      flex: none;
      padding: 6px 14px;
      border-radius: 16px;
      font-size: 12px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .filter-pill.active {
      background: var(--brand);
      color: #fff;
      border-color: var(--brand);
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(215, 128, 170, 0.25);
    }

    /* Grid Layout */
    main {
      flex: 1;
      padding: 10px 14px 40px;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    @media (min-width: 640px) {
      .gallery-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
    }
    @media (min-width: 1024px) {
      .gallery-grid { grid-template-columns: repeat(4, 1fr); gap: 20px; }
    }

    .photo-card {
      position: relative;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      cursor: pointer;
      box-shadow: var(--glass-shadow);
      transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease;
      aspect-ratio: 9 / 16;
      display: flex;
      flex-direction: column;
    }
    .photo-card:active {
      transform: scale(0.97);
    }
    .photo-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      background: #f0e6e9;
      transition: opacity 0.3s ease;
    }
    .live-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(40, 20, 35, 0.65);
      color: #FFF;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding: 3px 8px;
      border-radius: 12px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .live-badge::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #F6BCC0;
    }
    .photo-info-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 24px 10px 10px;
      background: linear-gradient(to top, rgba(30, 20, 28, 0.75) 0%, transparent 100%);
      color: #fff;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 11px;
    }
    .photo-date {
      opacity: 0.9;
      font-variant-numeric: tabular-nums;
    }

    /* Modal Viewer */
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 100;
      background: rgba(20, 15, 22, 0.94);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      display: none;
      flex-direction: column;
      touch-action: none;
    }
    .modal-overlay.active {
      display: flex;
    }

    .modal-header {
      padding: calc(env(safe-area-inset-top, 12px) + 6px) 16px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #fff;
      z-index: 10;
    }
    .modal-close, .modal-action-btn {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #fff;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 18px;
      cursor: pointer;
    }

    .modal-viewport {
      flex: 1;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-viewport img, .modal-viewport video {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      user-select: none;
      border-radius: 6px;
    }
    .live-toggle-btn {
      position: absolute;
      bottom: 24px;
      padding: 8px 18px;
      border-radius: 20px;
      background: rgba(30, 20, 28, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.35);
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      z-index: 10;
      transition: all 0.2s;
    }
    .live-toggle-btn:active {
      transform: scale(0.95);
    }

    .modal-nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(30, 20, 28, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      font-size: 26px;
      line-height: 1;
      display: grid;
      place-items: center;
      cursor: pointer;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 15;
      transition: all 0.2s;
      user-select: none;
    }
    .modal-nav-btn:hover {
      background: rgba(30, 20, 28, 0.8);
      transform: translateY(-50%) scale(1.08);
    }
    .modal-nav-btn.prev {
      left: 12px;
    }
    .modal-nav-btn.next {
      right: 12px;
    }
    @media (max-width: 600px) {
      .modal-nav-btn {
        width: 36px;
        height: 36px;
        font-size: 20px;
        background: rgba(30, 20, 28, 0.35);
      }
      .modal-nav-btn.prev { left: 8px; }
      .modal-nav-btn.next { right: 8px; }
    }

    .modal-sheet {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(255, 252, 247, 0.96);
      backdrop-filter: blur(25px);
      -webkit-backdrop-filter: blur(25px);
      border-top: 1px solid var(--border);
      border-radius: 24px 24px 0 0;
      padding: 16px 20px calc(env(safe-area-inset-bottom, 16px) + 16px);
      color: var(--text);
      max-height: 65vh;
      overflow-y: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.15, 0.9, 0.2, 1);
      z-index: 110;
      box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15);
    }
    .modal-sheet.open {
      transform: translateY(0);
    }
    .sheet-handle {
      width: 36px;
      height: 4px;
      background: var(--border);
      border-radius: 2px;
      margin: 0 auto 14px;
    }

    .sheet-section {
      margin-bottom: 16px;
    }
    .sheet-section h3 {
      font-size: 13px;
      font-weight: 700;
      color: var(--accent);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .outfit-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .outfit-tag {
      background: var(--tint);
      color: var(--accent);
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid var(--border);
    }

    .camera-params-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      font-size: 12px;
    }
    .param-item {
      background: rgba(255, 255, 255, 0.6);
      padding: 8px 10px;
      border-radius: 10px;
      border: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
    }
    .param-label { color: var(--secondary); }
    .param-val { font-weight: 600; color: var(--text); }

    .sheet-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    .btn {
      flex: 1;
      padding: 12px;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: var(--brand);
      color: #fff;
    }
    .btn-primary:active { background: var(--brand-hover); }
    .btn-secondary {
      background: var(--tint);
      color: var(--accent);
      border: 1px solid var(--border);
    }
    .btn-secondary:active { background: var(--tint-hover); }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: var(--secondary);
    }
    .empty-state span {
      font-size: 40px;
      display: block;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <div class="ambient" aria-hidden="true"></div>

  <header>
    <div class="brand-area">
      <div class="brand-logo">🌸</div>
      <div class="brand-text">
        <h1>${serverName}</h1>
        <p>无线图库 · 免装 App 直连</p>
      </div>
    </div>
    <div class="header-actions">
      <div class="chip">
        <span class="status-dot"></span>
        <span id="photo-count-text">加载中...</span>
      </div>
    </div>
  </header>

  <div class="filter-bar" id="filter-bar">
    <button class="filter-pill active" data-uid="">全部照片</button>
  </div>

  <main>
    <div class="gallery-grid" id="gallery-grid"></div>
    <div class="empty-state" id="empty-state" style="display: none;">
      <span>📷</span>
      <p>相册空空如也，拍张照片试试吧~</p>
    </div>
  </main>

  <!-- Fullscreen Modal Viewer -->
  <div class="modal-overlay" id="modal-overlay">
    <div class="modal-header">
      <button class="modal-close" id="modal-close-btn">✕</button>
      <div id="modal-title-text" style="font-size: 13px; opacity: 0.9;"></div>
      <button class="modal-action-btn" id="modal-info-btn">ℹ️</button>
    </div>
    <div class="modal-viewport" id="modal-viewport">
      <button class="modal-nav-btn prev" id="modal-prev-btn" aria-label="上一张">‹</button>
      <img id="modal-img" src="" alt="预览图">
      <video id="modal-video" src="" playsinline webkit-playsinline="true" x5-playsinline="true" loop muted controls style="display: none;"></video>
      <button class="modal-nav-btn next" id="modal-next-btn" aria-label="下一张">›</button>
      <button class="live-toggle-btn" id="live-toggle-btn" style="display: none;">
        <span>▶ 播放实况</span>
      </button>
    </div>

    <div class="modal-sheet" id="modal-sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-section" id="sheet-outfit-section">
        <h3>👗 穿搭部件</h3>
        <div class="outfit-tags" id="sheet-outfit-tags"></div>
      </div>
      <div class="sheet-section" id="sheet-camera-section">
        <h3>📷 拍摄参数</h3>
        <div class="camera-params-grid" id="sheet-camera-grid"></div>
      </div>
      <div class="sheet-actions">
        <button class="btn btn-secondary" id="btn-download-video" style="display: none;">🎬 保存实况视频</button>
        <button class="btn btn-primary" id="btn-download-original">💾 保存原图</button>
      </div>
    </div>
  </div>

  <script type="module">
    function escapeHtml(str) {
      if (str === null || str === undefined) return ''
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    }

    function formatSafeDate(dateStr) {
      if (!dateStr) return ''
      try {
        const safe = String(dateStr).trim().replace(' ', 'T')
        const d = new Date(safe)
        if (isNaN(d.getTime())) return String(dateStr).split(' ')[0] || ''
        return d.toLocaleDateString()
      } catch {
        return ''
      }
    }

    function triggerDownload(url, filename) {
      const a = document.createElement('a')
      a.href = url
      if (filename) a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => a.remove(), 1000)
    }

    let allAssets = []
    let currentAsset = null
    let activeUid = ''
    let isPlayingLive = false

    const grid = document.getElementById('gallery-grid')
    const filterBar = document.getElementById('filter-bar')
    const countText = document.getElementById('photo-count-text')
    const emptyState = document.getElementById('empty-state')

    const modalOverlay = document.getElementById('modal-overlay')
    const modalImg = document.getElementById('modal-img')
    const modalVideo = document.getElementById('modal-video')
    const modalTitle = document.getElementById('modal-title-text')
    const modalSheet = document.getElementById('modal-sheet')
    const liveToggleBtn = document.getElementById('live-toggle-btn')
    const outfitSection = document.getElementById('sheet-outfit-section')
    const outfitTags = document.getElementById('sheet-outfit-tags')
    const cameraGrid = document.getElementById('sheet-camera-grid')
    const btnDownloadVideo = document.getElementById('btn-download-video')
    const btnDownloadOriginal = document.getElementById('btn-download-original')

    async function loadAssets() {
      try {
        const res = await fetch('/web/api/assets')
        if (!res.ok) throw new Error('网络请求失败')
        const data = await res.json()
        allAssets = data.assets || []

        countText.textContent = \`\${allAssets.length} 张照片\`
        buildFilters(allAssets)
        renderGrid()
      } catch (err) {
        countText.textContent = '获取失败'
        console.error(err)
      }
    }

    function buildFilters(assets) {
      const uids = new Set()
      assets.forEach(a => { if (a.uid) uids.add(a.uid) })
      if (uids.size > 1) {
        filterBar.innerHTML = '<button class="filter-pill active" data-uid="">全部照片</button>'
        uids.forEach(uid => {
          const btn = document.createElement('button')
          btn.className = 'filter-pill'
          btn.dataset.uid = uid
          btn.textContent = 'UID: ' + uid
          filterBar.appendChild(btn)
        })
      }
    }

    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-pill')
      if (!btn) return
      filterBar.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      activeUid = btn.dataset.uid || ''
      renderGrid()
    })

    function renderGrid() {
      grid.innerHTML = ''
      const filtered = activeUid ? allAssets.filter(a => a.uid === activeUid) : allAssets
      if (filtered.length === 0) {
        emptyState.style.display = 'block'
        return
      }
      emptyState.style.display = 'none'

      filtered.forEach(asset => {
        const card = document.createElement('div')
        card.className = 'photo-card'

        const isLive = asset.hasMotion || asset.isLive
        const dateStr = formatSafeDate(asset.capturedAt)
        const uidLabel = asset.uid ? 'UID ' + escapeHtml(asset.uid) : ''
        const safeId = encodeURIComponent(asset.id)

        card.innerHTML = \`
          \${isLive ? '<div class="live-badge">LIVE</div>' : ''}
          <img src="/web/api/assets/\${safeId}/preview?thumb=1" alt="照片" loading="lazy" onerror="this.style.opacity='0.4'">
          <div class="photo-info-bar">
            <span class="photo-date">\${escapeHtml(dateStr)}</span>
            <span>\${uidLabel}</span>
          </div>
        \`
        card.addEventListener('click', () => openPhotoModal(asset))
        grid.appendChild(card)
      })
    }

    function toggleLiveVideo() {
      if (!currentAsset || !(currentAsset.hasMotion || currentAsset.isLive)) return
      isPlayingLive = !isPlayingLive
      if (isPlayingLive) {
        modalImg.style.display = 'none'
        modalVideo.style.display = 'block'
        modalVideo.muted = true
        modalVideo.playsInline = true
        const videoUrl = '/web/api/assets/' + encodeURIComponent(currentAsset.id) + '/video'
        if (!modalVideo.src || !modalVideo.src.endsWith(videoUrl)) {
          modalVideo.src = videoUrl
          modalVideo.load()
        }
        modalVideo.currentTime = 0
        modalVideo.onerror = (err) => {
          console.error('Video playback error:', err)
          modalVideo.style.display = 'none'
          modalImg.style.display = 'block'
          isPlayingLive = false
          liveToggleBtn.innerHTML = '<span>▶ 播放实况</span>'
        }
        const p = modalVideo.play()
        if (p !== undefined) {
          p.catch(e => {
            console.warn('Auto-play blocked, retrying muted:', e)
            modalVideo.muted = true
            modalVideo.play().catch(retryErr => console.error('Play retry error:', retryErr))
          })
        }
        liveToggleBtn.innerHTML = '<span>⏸ 查看封面</span>'
      } else {
        modalVideo.pause()
        modalVideo.style.display = 'none'
        modalImg.style.display = 'block'
        liveToggleBtn.innerHTML = '<span>▶ 播放实况</span>'
      }
    }

    liveToggleBtn.addEventListener('click', toggleLiveVideo)
    modalImg.addEventListener('click', () => {
      if (currentAsset && (currentAsset.hasMotion || currentAsset.isLive)) {
        toggleLiveVideo()
      }
    })

    function getVisibleAssets() {
      return activeUid ? allAssets.filter(a => a.uid === activeUid) : allAssets
    }

    function navigateModal(step) {
      const list = getVisibleAssets()
      if (list.length === 0 || !currentAsset) return
      const idx = list.findIndex(a => a.id === currentAsset.id)
      if (idx === -1) return
      let nextIdx = idx + step
      if (nextIdx < 0) nextIdx = list.length - 1
      if (nextIdx >= list.length) nextIdx = 0
      openPhotoModal(list[nextIdx])
    }

    async function openPhotoModal(asset) {
      currentAsset = asset
      isPlayingLive = false

      const visibleList = getVisibleAssets()
      const currentIdx = visibleList.findIndex(a => a.id === asset.id)
      const countPrefix = currentIdx >= 0 ? '(' + (currentIdx + 1) + '/' + visibleList.length + ') ' : ''
      modalTitle.textContent = countPrefix + (formatSafeDate(asset.capturedAt) || '照片详情')

      modalImg.style.display = 'block'
      modalVideo.style.display = 'none'
      modalVideo.pause()
      modalVideo.removeAttribute('src')
      modalVideo.load()
      modalImg.src = \`/web/api/assets/\${encodeURIComponent(asset.id)}/preview\`
      modalSheet.classList.remove('open')

      const isLive = asset.hasMotion || asset.isLive
      if (isLive) {
        liveToggleBtn.style.display = 'inline-flex'
        liveToggleBtn.innerHTML = '<span>▶ 播放实况</span>'
        btnDownloadVideo.style.display = 'inline-flex'
        btnDownloadVideo.onclick = () => {
          triggerDownload(\`/web/api/assets/\${encodeURIComponent(asset.id)}/video?download=1\`, \`\${asset.id}.mp4\`)
        }
      } else {
        liveToggleBtn.style.display = 'none'
        btnDownloadVideo.style.display = 'none'
      }

      btnDownloadOriginal.onclick = () => {
        triggerDownload(\`/web/api/assets/\${encodeURIComponent(asset.id)}/download\`, \`\${asset.id}.jpg\`)
      }

      modalOverlay.classList.add('active')
      document.body.style.overflow = 'hidden'

      // Load Metadata with race condition guard
      const requestedId = asset.id
      try {
        const res = await fetch(\`/web/api/assets/\${encodeURIComponent(requestedId)}\`)
        if (res.ok) {
          const detail = await res.json()
          if (currentAsset && currentAsset.id === requestedId) {
            renderDetailSheet(detail)
          }
        }
      } catch (e) {
        console.error('Failed to load detail', e)
      }
    }

    function renderDetailSheet(detail) {
      outfitTags.innerHTML = ''
      cameraGrid.innerHTML = ''

      const clothes = detail.metadata?.dressing?.clothes || detail.metadata?.clothes || []
      if (Array.isArray(clothes) && clothes.length > 0) {
        outfitSection.style.display = 'block'
        clothes.forEach(c => {
          const tag = document.createElement('span')
          tag.className = 'outfit-tag'
          const name = typeof c === 'string' ? c : (c.name || (c.id ? '部件 ' + c.id : '未知服饰'))
          tag.textContent = name
          outfitTags.appendChild(tag)
        })
      } else {
        outfitSection.style.display = 'none'
      }

      const cam = detail.metadata?.camera || {}
      const apertureVal = cam.apertureSection !== undefined ? 'f/' + cam.apertureSection : (cam.aperture !== undefined ? 'f/' + cam.aperture : null)
      const weatherVal = detail.metadata?.photography?.weather || detail.metadata?.environment?.weather || null
      const items = [
        ['焦距', cam.focalLength ? cam.focalLength + 'mm' : null],
        ['光圈', apertureVal],
        ['曝光', cam.exposure !== undefined ? cam.exposure : null],
        ['对比度', cam.contrast !== undefined ? cam.contrast : null],
        ['饱和度', cam.saturation !== undefined ? cam.saturation : null],
        ['天气', weatherVal]
      ].filter(item => item[1] !== null)

      if (items.length > 0) {
        items.forEach(([label, val]) => {
          const el = document.createElement('div')
          el.className = 'param-item'
          el.innerHTML = \`<span class="param-label">\${escapeHtml(label)}</span><span class="param-val">\${escapeHtml(String(val))}</span>\`
          cameraGrid.appendChild(el)
        })
      } else {
        cameraGrid.innerHTML = '<p style="color:var(--secondary);font-size:12px;">暂无拍摄参数信息</p>'
      }
    }

    document.getElementById('modal-close-btn').addEventListener('click', closeModal)
    document.getElementById('modal-info-btn').addEventListener('click', () => {
      modalSheet.classList.toggle('open')
    })
    document.getElementById('modal-prev-btn').addEventListener('click', (e) => {
      e.stopPropagation()
      navigateModal(-1)
    })
    document.getElementById('modal-next-btn').addEventListener('click', (e) => {
      e.stopPropagation()
      navigateModal(1)
    })

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay || e.target === document.getElementById('modal-viewport')) {
        closeModal()
      }
    })

    // 键盘快捷键：Esc 退出，← 上一张，→ 下一张
    window.addEventListener('keydown', (e) => {
      if (!modalOverlay.classList.contains('active')) return
      if (e.key === 'Escape') closeModal()
      if (e.key === 'ArrowLeft') navigateModal(-1)
      if (e.key === 'ArrowRight') navigateModal(1)
    })

    // 移动端触摸手势：左右滑动切换照片
    let touchStartX = 0
    let touchStartY = 0
    const viewport = document.getElementById('modal-viewport')
    viewport.addEventListener('touchstart', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        touchStartX = e.changedTouches[0].screenX
        touchStartY = e.changedTouches[0].screenY
      }
    }, { passive: true })

    viewport.addEventListener('touchend', (e) => {
      if (!e.changedTouches || !e.changedTouches[0]) return
      const dx = e.changedTouches[0].screenX - touchStartX
      const dy = e.changedTouches[0].screenY - touchStartY
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx > 0) navigateModal(-1) // 右滑 -> 上一张
        else navigateModal(1)         // 左滑 -> 下一张
      }
    }, { passive: true })

    function closeModal() {
      modalOverlay.classList.remove('active')
      modalSheet.classList.remove('open')
      document.body.style.overflow = ''
      isPlayingLive = false
      modalVideo.pause()
      modalVideo.removeAttribute('src')
      modalVideo.load()
      currentAsset = null
      liveToggleBtn.innerHTML = '<span>▶ 播放实况</span>'
    }

    loadAssets()
  </script>
</body>
</html>`
}
