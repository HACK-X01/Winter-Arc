import { Flame } from 'lucide-react'

export default function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-night-950 text-white">
      <Flame size={64} className="flame-pulse text-flame-500" strokeWidth={2.5} />
      <h1
        className="mt-5 text-2xl font-extrabold tracking-tight"
        style={{ animation: 'page-enter 0.6s ease-out 0.3s both' }}
      >
        Winter Arc Tracker
      </h1>
      <p
        className="mt-2 text-sm text-white/50"
        style={{ animation: 'page-enter 0.6s ease-out 0.5s both' }}
      >
        loading...
      </p>
      <div className="mt-12 flex gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-flame-500/60 skeleton" style={{ animationDelay: '0s' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-flame-500/60 skeleton" style={{ animationDelay: '0.2s' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-flame-500/60 skeleton" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  )
}
