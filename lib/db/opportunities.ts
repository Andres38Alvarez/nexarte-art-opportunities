import prisma from './prisma'

export async function getOpportunities({
  page = 1,
  limit = 20,
  type,
  country,
}: {
  page?: number
  limit?: number
  type?: string
  country?: string
} = {}) {
  const where = {
    status: 'ACTIVE' as const,
    ...(type && { type: type as any }),
    ...(country && { country }),
  }

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      orderBy: { deadline: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.opportunity.count({ where }),
  ])

  return { opportunities, total, pages: Math.ceil(total / limit) }
}