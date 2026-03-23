import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

const OpportunitySchema = z.object({
  disciplines: z.array(z.string()).describe('Artistic disciplines mentioned e.g. Painting, Photography, Digital Art, Dance, Music, Theater, Film, Sculpture, Writing'),
  benefits: z.object({
    fee: z.string().nullable().describe('Monetary fee or stipend offered e.g. "1000 USD", "500 EUR"'),
    accommodation: z.boolean().describe('Whether accommodation is provided'),
    meals: z.boolean().describe('Whether meals are provided'),
    transport: z.boolean().describe('Whether transport is covered'),
    studio: z.boolean().describe('Whether a studio space is provided'),
  }),
  requirements: z.object({
    nationality: z.string().nullable().describe('Nationality requirements if any'),
    careerStage: z.string().nullable().describe('Career stage required e.g. emerging, mid-career, established'),
    ageLimit: z.string().nullable().describe('Age limit if any'),
  }),
  correctedType: z.enum(['OPEN_CALL', 'RESIDENCY', 'GRANT', 'AWARD', 'JOB', 'FUNDING']).describe('The correct type of this opportunity'),
  summary: z.string().describe('A clean 2-3 sentence summary in English'),
})

export async function enrichOpportunity(title: string, description: string) {
  try {
    const { object } = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: OpportunitySchema,
      prompt: `
        Analyze this art opportunity and extract structured information.
        
        Title: ${title}
        Description: ${description}
        
        Extract all relevant information. If something is not mentioned, use null or false.
        For disciplines, be specific and use standard art discipline names.
        For the summary, write a clean concise description in English.
      `,
    })

    return { success: true, data: object }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}