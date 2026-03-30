import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''

  if (!query || query.length < 2) {
    return NextResponse.json({ opportunities: [] })
  }

  const opportunities = await prisma.opportunity.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { organizationName: { contains: query, mode: 'insensitive' } },
        { country: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
      status: 'ACTIVE',
    },
    take: 20,
    orderBy: { deadline: 'asc' },
  })

  return NextResponse.json({ opportunities })
}