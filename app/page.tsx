import { getOpportunities } from '@/lib/db/opportunities'

const TYPE_COLORS: Record<string, string> = {
  RESIDENCY: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  GRANT: 'text-violet-400 border-violet-400/30 bg-violet-400/10',
  OPEN_CALL: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  AWARD: 'text-pink-400 border-pink-400/30 bg-pink-400/10',
  JOB: 'text-green-400 border-green-400/30 bg-green-400/10',
  FUNDING: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  TOOL: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
}

export default async function HomePage() {
  const { opportunities, total } = await getOpportunities({ limit: 24 })

  return (
    <main style={{minHeight:'100vh', background:'#080808', color:'white', width:'100%'}}>

      {/* Header */}
      <header style={{borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'1rem 0'}}>
        <div className="container-main" style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
            <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'linear-gradient(to right, #8b5cf6, #06b6d4)'}}></div>
            <span style={{fontWeight:'bold', color:'white'}}>NEXARTE</span>
            <span style={{color:'rgba(255,255,255,0.3)', fontSize:'0.875rem'}}>opportunities</span>
          </div>
          <span style={{color:'rgba(255,255,255,0.3)', fontSize:'0.75rem'}}>{total} opportunities worldwide</span>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-section">
        <div className="container-main">
          <div style={{display:'inline-block', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', border:'1px solid rgba(255,255,255,0.1)', padding:'0.25rem 0.75rem', borderRadius:'9999px', marginBottom:'1.5rem'}}>
            For artists navigating the AI era
          </div>
          <h1 style={{fontSize:'clamp(3rem, 8vw, 5rem)', fontWeight:'900', letterSpacing:'-0.05em', lineHeight:'1', marginBottom:'1.5rem'}}>
            Your next
            <span style={{display:'block', background:'linear-gradient(to right, #a78bfa, #22d3ee, #fb923c)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>
              opportunity
            </span>
            awaits
          </h1>
          <p style={{color:'rgba(255,255,255,0.4)', fontSize:'1.125rem', maxWidth:'36rem', margin:'0 auto 2.5rem'}}>
            Residencies, grants, open calls and more — curated globally for artists who create with their hands and their vision.
          </p>

          {/* Buscador */}
          <div style={{maxWidth:'42rem', margin:'0 auto 4rem'}}>
            <div style={{display:'flex', alignItems:'center', gap:'0.75rem', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'1rem', padding:'1rem 1.25rem'}}>
              <svg style={{width:'20px', height:'20px', color:'rgba(255,255,255,0.3)', flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search residencies, grants, open calls..." style={{background:'transparent', color:'white', outline:'none', width:'100%', fontSize:'1rem', border:'none'}} />
              <button style={{flexShrink:0, background:'linear-gradient(to right, #8b5cf6, #06b6d4)', color:'white', fontSize:'0.875rem', fontWeight:'600', padding:'0.5rem 1rem', borderRadius:'0.75rem', border:'none', cursor:'pointer'}}>Search</button>
            </div>
          </div>

          {/* Estadísticas */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'1.5rem', maxWidth:'32rem', margin:'0 auto'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'2rem', fontWeight:'900', background:'linear-gradient(to right, #a78bfa, #22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>{total}+</div>
              <div style={{color:'rgba(255,255,255,0.3)', fontSize:'0.75rem', marginTop:'0.25rem', letterSpacing:'0.05em'}}>Opportunities</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'2rem', fontWeight:'900', background:'linear-gradient(to right, #22d3ee, #fb923c)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>50+</div>
              <div style={{color:'rgba(255,255,255,0.3)', fontSize:'0.75rem', marginTop:'0.25rem', letterSpacing:'0.05em'}}>Countries</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'2rem', fontWeight:'900', background:'linear-gradient(to right, #fb923c, #f472b6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>7</div>
              <div style={{color:'rgba(255,255,255,0.3)', fontSize:'0.75rem', marginTop:'0.25rem', letterSpacing:'0.05em'}}>Categories</div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="grid-section">
        <div className="container-main">
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
        </div>
      </section>

    </main>
  )
}