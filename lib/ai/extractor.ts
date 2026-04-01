import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import { z } from 'zod'

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
})

const OpportunitySchema = z.object({
  disciplines: z.array(z.string()).describe('Artistic disciplines e.g. Painting, Photography, Digital Art, Dance, Music, Theater, Film, Sculpture, Writing'),
  benefits: z.object({
    fee: z.string().nullable().describe('Monetary fee or stipend e.g. "1000 USD"'),
    accommodation: z.boolean().describe('Whether accommodation is provided'),
    meals: z.boolean().describe('Whether meals are provided'),
    transport: z.boolean().describe('Whether transport is covered'),
    studio: z.boolean().describe('Whether a studio space is provided'),
  }),
  requirements: z.object({
    nationality: z.string().nullable().describe('Nationality requirements if any'),
    careerStage: z.string().nullable().describe('Career stage e.g. emerging, mid-career, established'),
    ageLimit: z.string().nullable().describe('Age limit if any'),
  }),
  correctedType: z.enum(['OPEN_CALL', 'RESIDENCY', 'GRANT', 'AWARD', 'JOB', 'FUNDING']).describe('The correct type of this opportunity'),
  summary: z.string().describe('A clean 2-3 sentence summary in English'),
})

export async function enrichOpportunity(title: string, description: string) {
  try {
    const { text } = await generateText({
      model: openrouter('meta-llama/llama-3.2-3b-instruct:free'),
      prompt: `Analyze this art opportunity and return ONLY a valid JSON object, no markdown, no explanation.

Title: ${title}
Description: ${description || title}

Return exactly this JSON structure:
{
  "disciplines": ["array of artistic disciplines mentioned"],
  "benefits": {
    "fee": "monetary amount or null",
    "accommodation": true or false,
    "meals": true or false,
    "transport": true or false,
    "studio": true or false
  },
  "requirements": {
    "nationality": "nationality requirement or null",
    "careerStage": "emerging/mid-career/established or null",
    "ageLimit": "age limit or null"
  },
  "correctedType": "RESIDENCY or GRANT or OPEN_CALL or AWARD or JOB or FUNDING",
  "summary": "2-3 sentence summary in English"
}`,
    })

     // Extraer el primer JSON válido
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON object found in response')
    const cleaned = jsonMatch[0]
    const data = JSON.parse(cleaned)
    
    // Validar con Zod
    const validated = OpportunitySchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

