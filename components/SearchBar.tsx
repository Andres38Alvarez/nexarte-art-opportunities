'use client'
import { useState, useCallback } from 'react'

const TYPE_COLORS: Record<string, string> = {
  RESIDENCY: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  GRANT: 'text-violet-400 border-violet-400/30 bg-violet-400/10',
  OPEN_CALL: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  AWARD: 'text-pink-400 border-pink-400/30 bg-pink-400/10',
  JOB: 'text-green-400 border-green-400/30 bg-green-400/10',
  FUNDING: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = useCallback(async () => {
    if (!query || query.length < 2) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.opportunities || [])
    } catch (e) {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div style={{maxWidth:'42rem', margin:'0 auto 4rem'}}>
      {/* Input */}
      <div style={{display:'flex', alignItems:'center', gap:'0.75rem', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'1rem', padding:'1rem 1.25rem'}}>
        <svg style={{width:'20px', height:'20px', color:'rgba(255,255,255,0.3)', flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search residencies, grants, open calls..."
          style={{background:'transparent', color:'white', outline:'none', width:'100%', fontSize:'1rem', border:'none'}}
        />
        <button
          onClick={handleSearch}
          style={{flexShrink:0, background:'linear-gradient(to right, #8b5cf6, #06b6d4)', color:'white', fontSize:'0.875rem', fontWeight:'600', padding:'0.5rem 1rem', borderRadius:'0.75rem', border:'none', cursor:'pointer'}}
        >
          {loading ? '...' : 'Search'}
        </button>
      </div>

      {/* Resultados */}
      {searched && (
        <div style={{marginTop:'1rem', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'1rem', overflow:'hidden'}}>
          {results.length === 0 ? (
            <div style={{padding:'2rem', textAlign:'center', color:'rgba(255,255,255,0.3)'}}>
              No results found for "{query}"
            </div>
          ) : (
            <div>
              <div style={{padding:'0.75rem 1.25rem', borderBottom:'1px solid rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.3)', fontSize:'0.75rem'}}>
                {results.length} results for "{query}"
              </div>
              {results.map((opp) => (
                <a key={opp.id} href={opp.sourceUrl} target="_blank" rel="noopener noreferrer" style={{display:'block', padding:'1rem 1.25rem', borderBottom:'1px solid rgba(255,255,255,0.04)', textDecoration:'none', transition:'background 0.2s'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.25rem'}}>
                    <span className={`text-[10px] font-bold tracking-widest uppercase border px-2 py-1 rounded-full ${TYPE_COLORS[opp.type] || 'text-white/40 border-white/10 bg-white/5'}`}>
                      {opp.type.replace('_', ' ')}
                    </span>
                    {opp.country && <span style={{color:'rgba(255,255,255,0.3)', fontSize:'0.75rem'}}>{opp.country}</span>}
                  </div>
                  <div style={{color:'rgba(255,255,255,0.9)', fontWeight:'600', fontSize:'0.95rem'}}>{opp.title}</div>
                  <div style={{color:'rgba(255,255,255,0.4)', fontSize:'0.8rem', marginTop:'0.25rem'}}>{opp.organizationName}</div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}