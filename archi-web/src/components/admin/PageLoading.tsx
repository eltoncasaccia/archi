function Bone({ w, h = 14, opacity = 1 }: { w: string | number; h?: number; opacity?: number }) {
  return (
    <div style={{
      width: w, height: h,
      background: 'var(--paper-3)', borderRadius: 2,
      animation: 'oaPulse 1.4s ease-in-out infinite',
      opacity,
    }} />
  )
}

export function PageLoading() {
  return (
    <div style={{ padding: '24px 40px 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header skeleton */}
      <div style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Bone w={120} h={11} />
        <Bone w={240} h={28} />
      </div>

      {/* Content rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
        <Bone w="60%" h={14} />
        <Bone w="85%" h={14} opacity={0.85} />
        <Bone w="72%" h={14} opacity={0.7} />
        <Bone w="90%" h={14} opacity={0.55} />
        <Bone w="50%" h={14} opacity={0.4} />
      </div>
    </div>
  )
}
