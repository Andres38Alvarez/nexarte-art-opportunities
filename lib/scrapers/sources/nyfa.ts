process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
import axios from 'axios'
import * as cheerio from 'cheerio'
import prisma from '../../db/prisma'

const SOURCE_NAME = 'NYFA'
const SOURCE_URL = 'https://www.nyfa.org/opportunities/'
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const TYPE_MAP: Record<string, string> = {
  'grant': 'GRANT',
  'call for entry': 'OPEN_CALL',
  'open call': 'OPEN_CALL',
  'residency': 'RESIDENCY',
  'artist colony': 'RESIDENCY',
  'award': 'AWARD',
  'job': 'JOB',
  'fellowship': 'GRANT',
  'production services': 'FUNDING',
}

function mapType(typeText: string): string {
  const lower = typeText.toLowerCase()
  for (const [key, value] of Object.entries(TYPE_MAP)) {
    if (lower.includes(key)) return value
  }
  return 'OPEN_CALL'
}

export async function scrapeNYFA() {
  const startTime = Date.now()
  let totalFound = 0
  let totalNew = 0
  let errorMessage = null

  try {
    const source = await prisma.source.upsert({
      where: { name: SOURCE_NAME },
      update: { lastScrapedAt: new Date() },
      create: {
        name: SOURCE_NAME,
        url: SOURCE_URL,
        isDynamic: false,
        crawlDelay: 3,
        isActive: true,
      },
    })

    const { data } = await axios.get(SOURCE_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
  },
  timeout: 10000,
})

    const $ = cheerio.load(data)
    const opportunities: any[] = []

    $('.contentItem').each((i, el) => {
      const title = $(el).find('.itemTitle').text().trim()
      const organization = $(el).find('.companyName').text().trim()
      const dataId = $(el).attr('data-id')
      const dataTitle = $(el).attr('data-title')

      // Extraer ubicación y tipo del texto del item
      const fullText = $(el).text()
      const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0)

      let location = ''
      let typeText = ''

      lines.forEach(line => {
        if (line.includes(',') && !line.includes('Posted') && !line.includes('$')) {
          location = line
        }
        if (['Grant', 'Call for Entry', 'Open Call', 'Residency', 'Artist Colony', 'Award', 'Job', 'Fellowship', 'Production'].some(t => line.includes(t))) {
          typeText = line
        }
      })

      const sourceUrl = dataId
        ? `https://www.nyfa.org/opportunities/${dataId}`
        : ''

      if ((title || dataTitle) && dataId) {
        opportunities.push({
          title: title || dataTitle || '',
          description: '',
          organizationName: organization || title || '',
          location: location || null,
          country: location?.includes(',') ? 'United States' : null,
          type: mapType(typeText) as any,
          sourceUrl: `https://www.nyfa.org/opportunities/?id=${dataId}`,
          sourceName: SOURCE_NAME,
          sourceId: source.id,
        })
      }
    })

    totalFound = opportunities.length

    for (const opp of opportunities) {
      const existing = await prisma.opportunity.findUnique({
        where: { sourceUrl: opp.sourceUrl },
      })
      if (!existing) {
        await prisma.opportunity.create({ data: opp })
        totalNew++
      }
      await wait(100)
    }

    await prisma.scrapingLog.create({
      data: {
        sourceId: source.id,
        totalFound,
        totalNew,
        totalErrors: 0,
        successful: true,
        durationMs: Date.now() - startTime,
      },
    })

    return { success: true, totalFound, totalNew }

  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const source = await prisma.source.findUnique({ where: { name: SOURCE_NAME } })
    if (source) {
      await prisma.scrapingLog.create({
        data: {
          sourceId: source.id,
          totalFound,
          totalNew,
          totalErrors: 1,
          successful: false,
          errorMessage,
          durationMs: Date.now() - startTime,
        },
      })
    }
    return { success: false, error: errorMessage }
  }
}