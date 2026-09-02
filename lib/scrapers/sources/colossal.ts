process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
import axios from 'axios'
import * as cheerio from 'cheerio'
import prisma from '../../db/prisma'

const SOURCE_NAME = 'Colossal'
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// URLs mensuales de Colossal
const MONTHLY_URLS = [
  'https://www.thisiscolossal.com/2026/03/april-2026-opportunities-for-artists/',
  'https://www.thisiscolossal.com/2026/02/march-2026-opportunities-open-calls-residencies-grants/',
  'https://www.thisiscolossal.com/2026/01/february-2026-artist-open-calls-residencies-grants/',
]

// Order matters here: detectType() returns on the FIRST match, and falls
// back to OPEN_CALL if nothing else matches. 'open call' used to be checked
// first, which meant almost everything on Colossal's combined "Open Calls,
// Grants, Fellowships, Residencies and Awards" pages got tagged OPEN_CALL
// before ever reaching the more specific keywords below — GRANT/AWARD/JOB/
// FUNDING never got a chance to match. Check the specific categories first
// and only fall back to OPEN_CALL (the function's default return) when none
// of them apply.
const TYPE_MAP: Record<string, string> = {
  'fellowship': 'GRANT',
  'grant': 'GRANT',
  'funding': 'FUNDING',
  'award': 'AWARD',
  'prize': 'AWARD',
  'job': 'JOB',
  'residenc': 'RESIDENCY',
}

function detectType(heading: string, title: string): string {
  const text = (heading + ' ' + title).toLowerCase()
  for (const [key, value] of Object.entries(TYPE_MAP)) {
    if (text.includes(key)) return value
  }
  return 'OPEN_CALL'
}

function extractDeadline(text: string): Date | null {
  const match = text.match(/Deadline:\s*([^.]+)/i)
  if (!match) return null
  try {
    const dateStr = match[1].trim()
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

function extractCountry(title: string): string | null {
  const match = title.match(/\(([^)]+)\)\s*$/)
  if (!match) return null
  const location = match[1]
  if (location === 'International') return null
  if (location === 'U.S.' || location === 'U.S') return 'United States'
  return location
}

export async function scrapeColossal() {
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
        url: MONTHLY_URLS[0],
        isDynamic: false,
        crawlDelay: 3,
        isActive: true,
      },
    })
    const opportunities: any[] = []

    for (const url of MONTHLY_URLS) {
      try {
        const { data } = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        })

        const $ = cheerio.load(data)
        const content = $('.entry-content')
        let currentHeading = 'Open Calls'

        content.children().each((i, el) => {
          const tag = el.tagName?.toLowerCase()

          // Detectar sección actual (h2, h3)
          if (tag === 'h2' || tag === 'h3') {
            currentHeading = $(el).text().trim()
            return
          }

          // Procesar párrafos con oportunidades
          if (tag === 'p') {
            const link = $(el).find('a').first()
            const title = link.text().trim()
            const href = link.attr('href')
            const fullText = $(el).text().trim()
            const strongText = $(el).find('strong').text().trim()

            if (!title || !href || href.includes('thisiscolossal.com')) return
            if (title.length < 5) return

            const deadline = extractDeadline(strongText || fullText)
            const country = extractCountry(title)
            const type = detectType(currentHeading, title)
            const description = fullText.replace(title, '').trim().slice(0, 500)

            totalFound++

            const opp = {
              title: title.replace(/\s*\([^)]*\)\s*$/, '').trim(),
              description,
              organizationName: title.replace(/\s*\([^)]*\)\s*$/, '').trim(),
              country,
              deadline,
              type: type as any,
              sourceUrl: href,
              sourceName: SOURCE_NAME,
              sourceId: source.id,
            }

            opportunities.push(opp)
          }
        })

        await wait(2000)
      } catch (e) {
        console.error(`Error scraping ${url}:`, e)
      }
    }

    

    for (const opp of opportunities) {
      const existing = await prisma.opportunity.findUnique({
        where: { sourceUrl: opp.sourceUrl },
      })
      if (!existing) {
        try {
          await prisma.opportunity.create({ data: opp })
          totalNew++
        } catch (e) {
          // skip duplicates
        }
      }
      await wait(50)
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