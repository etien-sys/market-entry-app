export default function Background() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
    }}>
      {/* Purple radial glow — top center */}
      <div style={{
        position: 'absolute', top: '-180px', left: '50%', transform: 'translateX(-50%)',
        width: '900px', height: '700px',
        background: 'radial-gradient(ellipse at center, rgba(124,111,224,0.09) 0%, transparent 65%)',
      }} />

      {/* Warm amber glow — bottom right, evokes UAE desert/dusk */}
      <div style={{
        position: 'absolute', bottom: '-120px', right: '-80px',
        width: '600px', height: '500px',
        background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.04) 0%, transparent 70%)',
      }} />

      {/* Islamic 8-pointed star geometric lattice */}
      <svg
        width="100%" height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.045, position: 'absolute', inset: 0 }}
      >
        <defs>
          <pattern id="khatam" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            {/* Outer octagon */}
            <polygon
              points="30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30"
              fill="none" stroke="#9d94f0" strokeWidth="0.4"
            />
            {/* Inner 8-pointed star (khatam) */}
            <polygon
              points="50,10 57,31 78,24 65,40 88,50 65,60 78,76 57,69 50,90 43,69 22,76 35,60 12,50 35,40 22,24 43,31"
              fill="none" stroke="#9d94f0" strokeWidth="0.8"
            />
            {/* Small center diamond */}
            <polygon
              points="50,38 58,50 50,62 42,50"
              fill="none" stroke="#9d94f0" strokeWidth="0.4"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#khatam)" />
      </svg>

      {/* Subtle Burj Khalifa silhouette — bottom right, very faint */}
      <svg
        viewBox="0 0 200 400"
        style={{
          position: 'absolute', bottom: 0, right: '8%',
          height: '55vh', width: 'auto',
          opacity: 0.025,
          fill: '#9d94f0',
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Simplified Burj Khalifa silhouette */}
        <path d="
          M98,0 L102,0
          L103,30 L108,32 L110,60 L106,62
          L107,100 L112,104 L114,140 L108,144
          L110,180 L116,186 L118,220 L112,224
          L114,260 L120,268 L122,300 L116,304
          L118,340 L130,350 L135,380 L130,382
          L70,382 L65,380 L70,350 L82,340
          L84,304 L78,300 L80,268 L86,260
          L88,224 L82,220 L84,186 L90,180
          L92,144 L86,140 L88,104 L93,100
          L94,62 L90,60 L92,32 L97,30
          Z
        " />
        {/* Spire tip */}
        <path d="M99,0 L100,-20 L101,0 Z" />
      </svg>
    </div>
  );
}
