process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
import axios from 'axios'
import * as cheerio from 'cheerio'
import prisma from '../../db/prisma'

const SOURCE_NAME = 'ACA'
const SOURCE_URL = 'https://artistcommunities.org/directory/open-calls'
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function scrapeACA() {
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })

    const $ = cheerio.load(data)
    const opportunities: any[] = []

    $('tbody tr').each((i, el) => {
      const titleEl = $(el).find('td.views-field-label a, td.views-field-title a')
      const title = titleEl.text().trim()
      const relativeUrl = titleEl.attr('href')
      const deadline = $(el).find('td.views-field-field-deadline').text().trim()
      const location = $(el).last().text().trim()

      const sourceUrl = relativeUrl?.startsWith('http')
        ? relativeUrl
        : `https://artistcommunities.org${relativeUrl}`

      if (title && relativeUrl) {
        opportunities.push({
          title,
          description: '',
          organizationName: title.split('|')[0]?.trim() || title,
          deadline: deadline ? new Date(deadline) : null,
          location: location || null,
          type: 'RESIDENCY' as const,
          sourceUrl,
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