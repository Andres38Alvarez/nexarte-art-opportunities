'use client'
import { useState, useEffect } from 'react'

const TYPES = [
  { value: '', label: 'All types' },
  { value: 'RESIDENCY', label: 'Residency' },
  { value: 'GRANT', label: 'Grant' },
  { value: 'OPEN_CALL', label: 'Open Call' },
  { value: 'AWARD', label: 'Award' },
  { value: 'JOB', label: 'Job' },
  { value: 'FUNDING', label: 'Funding' },
]

const TYPE_COLORS: Record<string, string> = {
  RESIDENCY: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  GRANT: 'text-violet-400 border-violet-400/30 bg-violet-400/10',
  OPEN_CALL: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  AWARD: 'text-pink-400 border-pink-400/30 bg-pink-400/10',
  JOB: 'text-green-400 border-green-400/30 bg-green-400/10',
  FUNDING: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
}

export default function OpportunityFilters() {
  const [type, setType] = useState('')
  const [country, setCountry] = useState('')
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const fetchOpportunities = async (t: string, c: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (t) params.set('type', t)
      if (c) params.set('country', c)
      params.set('page', p.toString())
      const res = await fetch(`/api/opportunities?${params}`)
      const data = await res.json()
      setOpportunities(data.opportunities || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOpportunities(type, country, page)
  }, [type, country, page])

  const handleTypeChange = (newType: string) => {
    setType(newType)
    setPage(1)
  }

  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCountry(e.target.value)
    setPage(1)
  }

  return (
    <div>
      {/* Filtros */}
      <div style={{display:'flex', flexWrap:'wrap', gap:'1rem', alignItems:'center', marginBottom:'2rem'}}>
        {/* Tipo */}
        <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTypeChange(t.value)}
              style={{
                padding:'0.375rem 0.875rem',
                borderRadius:'9999px',
                fontSize:'0.75rem',
                fontWeight:'600',
                border:'1px solid',
                cursor:'pointer',
                transition:'all 0.2s',
                ...(type === t.value
                  ? {background:'white', color:'#080808', borderColor:'white'}
                  : {background:'transparent', color:'rgba(255,255,255,0.4)', borderColor:'rgba(255,255,255,0.1)'}
                )
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* País */}
        <input
          type="text"
          placeholder="Filter by country..."
          value={country}
          onChange={handleCountryChange}
          style={{
            background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'9999px',
            padding:'0.375rem 1rem',
            color:'white',
            fontSize:'0.75rem',
            outline:'none',
            width:'160px',
          }}
        />

        {/* Total */}
        <span style={{color:'rgba(255,255,255,0.3)', fontSize:'0.75rem', marginLeft:'auto'}}>
          {loading ? '...' : `${total} results`}
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{textAlign:'center', padding:'4rem', color:'rgba(255,255,255,0.3)'}}>
          Loading...
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1rem'}}>
          {opportunities.map((opp) => (
            <a key={opp.id} href={opp.sourceUrl} target="_blank" rel="noopener noreferrer" style={{display:'block', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'1rem', padding:'1.25rem', textDecoration:'none', transition:'all 0.3s'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem'}}>
                <span className={`text-[10px] font-bold tracking-widest uppercase border px-2 py-1 rounded-full ${TYPE_COLORS[opp.type] || 'text-white/40 border-white/10 bg-white/5'}`}>
                  {opp.type.replace('_', ' ')}
                </span>
                <span style={{color:'rgba(255,255,255,0.2)', fontSize:'0.75rem'}}>{opp.sourceName}</span>
              </div>
              <h2 style={{fontWeight:'700', color:'rgba(255,255,255,0.9)', fontSize:'1rem', lineHeight:'1.4', marginBottom:'0.5rem', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>
                {opp.title}
              </h2>
              <p style={{color:'rgba(255,255,255,0.4)', fontSize:'0.875rem', marginBottom:'1rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                {opp.organizationName}
              </p>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'1rem', borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                <span style={{fontSize:'0.75rem', color:'rgba(255,255,255,0.3)'}}>{opp.country || ''}</span>
                {opp.deadline && (
                  <span style={{fontSize:'0.75rem', color:'rgba(255,255,255,0.3)'}}>{new Date(opp.deadline).toLocaleDateString('en-GB')}</span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Paginación */}
      {pages > 1 && (
        <div style={{display:'flex', justifyContent:'center', gap:'0.5rem', marginTop:'2rem'}}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{padding:'0.5rem 1rem', borderRadius:'0.5rem', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', cursor:'pointer', opacity: page === 1 ? 0.3 : 1}}
          >
            Prev
          </button>
          <span style={{padding:'0.5rem 1rem', color:'rgba(255,255,255,0.4)', fontSize:'0.875rem'}}>
            {page} / {pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            style={{padding:'0.5rem 1rem', borderRadius:'0.5rem', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', cursor:'pointer', opacity: page === pages ? 0.3 : 1}}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}