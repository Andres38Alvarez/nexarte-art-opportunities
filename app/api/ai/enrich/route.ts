import { NextResponse } from 'next/server'
import { enrichOpportunity } from '@/lib/ai/extractor'
import prisma from '@/lib/db/prisma'

// ---------- Función de reintento con backoff exponencial ----------
async function enrichWithRetry(title: string, description: string, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    const result = await enrichOpportunity(title, description)
    if (result.success) return result

    // Solo reintentar si el error es por rate limit
    const errorMsg = result.error?.toLowerCase() || ''
    if (errorMsg.includes('rate-limited') || errorMsg.includes('rate limit')) {
      const wait = Math.pow(2, i) * 1000 + Math.random() * 1000 // 1s, 2s, 4s...
      console.log(`Rate limit hit. Retry ${i + 1}/${maxRetries} after ${Math.round(wait)}ms`)
      await new Promise(resolve => setTimeout(resolve, wait))
      continue
    }
    // Otros errores (JSON inválido, modelo no disponible, etc.) no reintentar
    return result
  }
  return { success: false, error: 'Max retries exceeded for rate limit' }
}
// ----------------------------------------------------------------

export async function GET() {
  // Obtener oportunidades que aún no han sido enriquecidas
  const opportunities = await prisma.opportunity.findMany({
    where: { enrichedByAI: false },
    take: 5, // Procesar de 5 en 5 para no sobrecargar
  })

  if (opportunities.length === 0) {
    return NextResponse.json({ message: 'All opportunities are already enriched' })
  }

  const results = []

  for (const opp of opportunities) {
    // ✅ Usar la función con reintentos en lugar de la llamada directa
    const result = await enrichWithRetry(opp.title, opp.description || opp.title)

    if (result.success && result.data) {
      await prisma.opportunity.update({
        where: { id: opp.id },
        data: {
          disciplines: result.data.disciplines,
          benefits: result.data.benefits,
          requirements: result.data.requirements.nationality || result.data.requirements.careerStage
            ? `Nationality: ${result.data.requirements.nationality || 'Open'} | Career: ${result.data.requirements.careerStage || 'All levels'}`
            : null,
          type: result.data.correctedType,
          description: result.data.summary,
          enrichedByAI: true,
        },
      })
      results.push({ id: opp.id, title: opp.title, success: true })
    } else {
      results.push({ id: opp.id, title: opp.title, success: false, error: result.error })
    }

    // Pausa entre requests para no exceder el rate limit (ya lo maneja el retry, pero es buena práctica)
    await new Promise(resolve => setTimeout(resolve, 8000)) // 8 segundos entre oportunidades
  }

  return NextResponse.json({
    message: `Enriched ${results.filter(r => r.success).length} of ${opportunities.length} opportunities`,
    results,
  })
}
