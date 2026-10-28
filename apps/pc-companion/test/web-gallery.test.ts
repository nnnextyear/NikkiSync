import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseManager } from '../../../packages/database/src/database-manager.ts'
import { WebGalleryRoutes } from '../src/web-gallery/WebGalleryRoutes.ts'
import { renderWebGalleryPage } from '../src/web-gallery/WebGalleryPage.ts'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { EventEmitter } from 'node:events'

const initialSql = readFileSync(
  new URL('../../../packages/database/migrations/0001_initial.sql', import.meta.url),
  'utf8'
)

test('renderWebGalleryPage generates responsive html with title', () => {
  const html = renderWebGalleryPage({ serverName: '测试相册' })
  assert.ok(html.includes('测试相册'))
  assert.ok(html.includes('viewport-fit=cover'))
  assert.ok(html.includes('filter-bar'))
  assert.ok(html.includes('gallery-grid'))
  assert.ok(html.includes('modal-overlay'))
})

test('WebGalleryRoutes handles /web and returns html', async () => {
  const db = new DatabaseManager(':memory:')
  db.initialize(initialSql)
  const routes = new WebGalleryRoutes(db, '大喵相机')

  assert.equal(routes.canHandle('/web'), true)
  assert.equal(routes.canHandle('/web/'), true)
  assert.equal(routes.canHandle('/web/index.html'), true)
  assert.equal(routes.canHandle('/gallery'), true)
  assert.equal(routes.canHandle('/gallery/'), true)
  assert.equal(routes.canHandle('/web/api/assets'), true)
  assert.equal(routes.canHandle('/other'), false)

  let statusCode = 0
  const headers: Record<string, string> = {}
  let responseData = ''

  const req = new EventEmitter() as unknown as IncomingMessage
  req.method = 'GET'

  const res = {
    writeHead(code: number, hdrs: Record<string, string>) {
      statusCode = code
      Object.assign(headers, hdrs)
    },
    end(data?: string | Buffer) {
      if (data) responseData += data.toString()
    }
  } as unknown as ServerResponse

  await routes.handle(req, res, new URL('http://127.0.0.1/web/index.html'))

  assert.equal(statusCode, 200)
  assert.equal(headers['Content-Type'], 'text/html; charset=utf-8')
  assert.ok(responseData.includes('大喵相机'))
  assert.ok(responseData.includes('formatSafeDate'))
})

test('WebGalleryRoutes handles OPTIONS preflight', async () => {
  const db = new DatabaseManager(':memory:')
  db.initialize(initialSql)
  const routes = new WebGalleryRoutes(db, '大喵相机')

  let statusCode = 0
  const headers: Record<string, string> = {}

  const req = new EventEmitter() as unknown as IncomingMessage
  req.method = 'OPTIONS'

  const res = {
    writeHead(code: number, hdrs: Record<string, string>) {
      statusCode = code
      Object.assign(headers, hdrs)
    },
    end() {}
  } as unknown as ServerResponse

  await routes.handle(req, res, new URL('http://127.0.0.1/web/api/assets'))

  assert.equal(statusCode, 204)
  assert.equal(headers['Access-Control-Allow-Origin'], '*')
  assert.ok(headers['Access-Control-Allow-Headers'].includes('Range'))
})

test('WebGalleryRoutes returns assets list JSON', async () => {
  const db = new DatabaseManager(':memory:')
  db.initialize(initialSql)
  const routes = new WebGalleryRoutes(db, '大喵相机')

  let statusCode = 0
  let responseData = ''

  const req = new EventEmitter() as unknown as IncomingMessage
  req.method = 'GET'

  const res = {
    writeHead(code: number) {
      statusCode = code
    },
    end(data?: string | Buffer) {
      if (data) responseData += data.toString()
    }
  } as unknown as ServerResponse

  await routes.handle(req, res, new URL('http://127.0.0.1/web/api/assets'))

  assert.equal(statusCode, 200)
  const json = JSON.parse(responseData)
  assert.ok(Array.isArray(json.assets))
})

test('renderWebGalleryPage escapes HTML and includes live controls', () => {
  const html = renderWebGalleryPage({ serverName: '<script>alert(1)</script>' })
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;') || html.includes('<script>alert(1)</script>'))
  assert.ok(html.includes('live-toggle-btn'))
  assert.ok(html.includes('escapeHtml'))
})
