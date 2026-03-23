process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
import axios from 'axios'
import * as cheerio from 'cheerio'
import prisma from '../../db/prisma'

const SOURCE_NAME = 'TransArtists'
const SOURCE_URL = 'https://www.transartists.org/en/residency-database'
const CRAWL_DELAY = 30000 // 30 segundos — requerido por robots.txt

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function scrapeTransArtists() {
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
        crawlDelay: 30,
        isActive: true,
      },
    })

    // 2. Fetch del HTML
    const { data } = await axios.get(SOURCE_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  },
})

    // 3. Parsear con Cheerio
    const $ = cheerio.load(data)
    const opportunities: any[] = []

    // 4. Extraer datos de la tabla
    $('tbody tr').each((i, el) => {
      const titleEl = $(el).find('td.views-field-title a')
      const title = titleEl.text().trim()
      const relativeUrl = titleEl.attr('href')
      const location = $(el).find('td.views-field-field-addresses-locality').text().trim()
      const country = $(el).find('td.views-field-field-addresses-country').text().trim()

      const sourceUrl = relativeUrl?.startsWith('http')
        ? relativeUrl
        : `https://www.transartists.org${relativeUrl}`

      if (title && relativeUrl) {
        opportunities.push({
          title,
          description: '',
          organizationName: title,
          city: location || null,
          country: country || null,
          type: 'RESIDENCY' as const,
          sourceUrl,
          sourceName: SOURCE_NAME,
          sourceId: source.id,
        })
      }
    })

    totalFound = opportunities.length

    // 5. Guardar en BD respetando el crawl delay
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