import { NextResponse } from 'next/server'
import { enrichOpportunity } from '@/lib/ai/extractor'
import prisma from '@/lib/db/prisma'

export async function GET() {
  // Obtener oportunidades que aún no han sido enriquecidas
  const opportunities = await prisma.opportunity.findMany({
    where: { enrichedByAI: false },
    take: 10, // Procesar de 10 en 10 para no sobrecargar
  })

  if (opportunities.length === 0) {
    return NextResponse.json({ message: 'All opportunities are already enriched' })
  }

  const results = []

  for (const opp of opportunities) {
    const result = await enrichOpportunity(opp.title, opp.description || opp.title)

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

    // Pausa entre requests para no exceder el rate limit
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return NextResponse.json({
    message: `Enriched ${results.filter(r => r.success).length} of ${opportunities.length} opportunities`,
    results,
  })
}
