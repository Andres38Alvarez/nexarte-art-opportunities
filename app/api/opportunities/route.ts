import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || ''
  const country = searchParams.get('country') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 24

  const where: any = { status: 'ACTIVE' }
  if (type) where.type = type
  if (country) where.country = { contains: country, mode: 'insensitive' }

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      orderBy: { deadline: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.opportunity.count({ where }),
  ])

  return NextResponse.json({ opportunities, total, pages: Math.ceil(total / limit) })
}