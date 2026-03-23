process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
import axios from 'axios'
import * as cheerio from 'cheerio'
import prisma from '../../db/prisma'

const SOURCE_NAME = 'ResArtis'
const SOURCE_URL = 'https://resartis.org/listings/'
const CRAWL_DELAY = 3000 // 3 segundos entre requests

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function scrapeResArtis() {
  const startTime = Date.now()
  let totalFound = 0
  let totalNew = 0
  let errorMessage = null

  try {
    // 1. Asegurarse que la fuente existe en la BD
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

    // 2. Fetch del HTML
    const { data } = await axios.get(SOURCE_URL, {
      headers: {
        'User-Agent': 'ArtOpportunities/1.0 (contact@artopportunities.com)',
      },
    })

    // 3. Parsear con Cheerio
    const $ = cheerio.load(data)
    const opportunities: any[] = []

    // 4. Extraer datos — ajustar selectores según HTML real de ResArtis
    $('article, .listing-item, .member-card').each((i, el) => {
      const title = $(el).find('h2, h3, .title').first().text().trim()
      const location = $(el).find('.location, .country').first().text().trim()
      const relativeUrl = $(el).find('a').first().attr('href')
      const sourceUrl = relativeUrl?.startsWith('http')
        ? relativeUrl
        : `https://resartis.org${relativeUrl}`

      if (title && relativeUrl) {
        opportunities.push({
          title,
          description: '',
          organizationName: title,
          country: location || null,
          type: 'RESIDENCY' as const,
          sourceUrl,
          sourceName: SOURCE_NAME,
          sourceId: source.id,
        })
      }
    })

    totalFound = opportunities.length

    // 5. Guardar en BD evitando duplicados
    for (const opp of opportunities) {
      const existing = await prisma.opportunity.findUnique({
        where: { sourceUrl: opp.sourceUrl },
      })

      if (!existing) {
        await prisma.opportunity.create({ data: opp })
        totalNew++
      }

      await wait(100) // pequeña pausa entre inserts
    }

    // 6. Guardar log exitoso
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

    // Guardar log de error
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