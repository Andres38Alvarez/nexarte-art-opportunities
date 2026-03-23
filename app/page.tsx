import { getOpportunities } from '@/lib/db/opportunities'

export default async function HomePage() {
  const { opportunities, total } = await getOpportunities({ limit: 20 })

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Art Opportunities</h1>
        <p className="text-gray-500">
          {total} opportunities worldwide
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {opportunities.map((opp) => (
          <div
            key={opp.id}
            className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
              {opp.type.replace('_', ' ')}
            </span>

            <h2 className="text-lg font-semibold mt-2 mb-1">
              {opp.title}
            </h2>

            <p className="text-sm text-gray-500 mb-3">
              {opp.organizationName}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              {opp.country && (
                <span>{opp.country}</span>
              )}
              {opp.deadline && (
                <span>Deadline: {new Date(opp.deadline).toLocaleDateString('en-GB')}</span>
              )}
              <span>{opp.sourceName}</span>
            </div>

            
              <a href={opp.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-sm text-indigo-600 hover:underline"
            >View opportunity</a>
          </div>
        ))}
      </div>
    </main>
  )
}