'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { sanitize, fullValidate } from '@/app/lib/sanitize'
import { getApiUrl } from '@/app/utils/apiUrl'
import { tokenService } from '@/app/services/token.service'

export default function LoginPage() {
  const router = useRouter()

  const [userId, setUserId]      = useState('')
  const [password, setPassword]  = useState('')
  const [showPwd, setShowPwd]    = useState(false)
  const [loading, setLoading]    = useState(false)
  const [error, setError]        = useState<string | null>(null)
  const [success, setSuccess]    = useState(false)
  const [focused, setFocused]    = useState<'id' | 'pwd' | null>(null)

  const cardRef  = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ tiltX: 0, tiltY: 0, gx: 0, gy: 0, inside: false })
  const rafRef   = useRef<number>(0)

  /* ── gentle tilt on mouse move (RAF lerp) ── */
  useEffect(() => {
    let lTX = 0, lTY = 0, lGX = 0, lGY = 0
    const tick = () => {
      const { tiltX, tiltY, gx, gy, inside } = mouseRef.current
      const f = 0.08
      lTX += (tiltX - lTX) * f;  lTY += (tiltY - lTY) * f
      lGX += (gx - lGX) * f;     lGY += (gy - lGY) * f

      const card = cardRef.current
      if (card) card.style.transform = `perspective(1200px) rotateX(${lTX}deg) rotateY(${lTY}deg)`

      const glare = glareRef.current
      if (glare) {
        glare.style.opacity = inside ? '1' : '0'
        glare.style.background = `radial-gradient(320px circle at ${lGX}px ${lGY}px, rgba(255,255,255,0.055), transparent 70%)`
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current!.getBoundingClientRect()
    const cx = rect.width / 2, cy = rect.height / 2
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    mouseRef.current = {
      tiltX: ((y - cy) / cy) * -3,
      tiltY: ((x - cx) / cx) *  3,
      gx: x, gy: y, inside: true,
    }
  }, [])

  const onMouseLeave = useCallback(() => {
    mouseRef.current = { tiltX: 0, tiltY: 0, gx: 0, gy: 0, inside: false }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)

    // ── Input sanitization / injection guard ──
    const idErr  = fullValidate(userId,   'User ID',  { min: 1, max: 50 })
    const pwdErr = fullValidate(password, 'Password', { min: 1, max: 100 })
    if (idErr || pwdErr) {
      setError(idErr || pwdErr || 'Invalid input')
      setLoading(false)
      return
    }

    try {
      const apiUrl = getApiUrl()
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ user_id: userId, user_pin: password }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.detail || 'Invalid credentials')
      }
      const data = await res.json()
      localStorage.clear()
      tokenService.set(data.access_token)
      localStorage.setItem('role', data.role)
      localStorage.setItem('name', sanitize(data.name || ''))
      localStorage.setItem('adminName', sanitize(data.name || ''))
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 900)
    } catch (err: any) {
      setError(err.message || 'Login failed')
      cardRef.current?.classList.add('shake')
      setTimeout(() => cardRef.current?.classList.remove('shake'), 500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 80% 80% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 60%), linear-gradient(160deg, #05051e 0%, #080830 40%, #060622 100%)',
      }}>
        {/* subtle grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }} />

        {/* two soft ambient glows — very slow, barely visible */}
        <div className="ambient-glow glow-a" />
        <div className="ambient-glow glow-b" />
      </div>

      {/* ── PAGE ── */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-[400px]">

          {/* logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-2xl bg-indigo-500/30 blur-2xl scale-110" />
              <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)' }}>
                <ShieldCheck size={26} className="text-white" strokeWidth={2} />
              </div>
            </div>
            <h1 className="text-[22px] font-bold text-white tracking-tight">Pentagon Security</h1>
            <p className="text-indigo-300/40 text-xs mt-1 tracking-wide">Admin Portal</p>
          </div>

          {/* ── CARD ── */}
          <div
            ref={cardRef}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            className="relative rounded-2xl"
            style={{ willChange: 'transform', transition: 'transform 0.05s linear' }}
          >
            {/* glare */}
            <div ref={glareRef} className="absolute inset-0 rounded-2xl pointer-events-none z-10"
              style={{ opacity: 0, transition: 'opacity 0.4s ease' }} />

            {/* thin border */}
            <div className="absolute inset-0 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(255,255,255,0.04), rgba(99,102,241,0.15))', padding: '1px' }}>
              <div className="absolute inset-[1px] rounded-2xl" style={{ background: '#07071f' }} />
            </div>

            {/* card content */}
            <div className="relative z-[2] rounded-2xl p-8"
              style={{ background: 'rgba(8,8,40,0.8)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>

              {success ? (
                /* ── success ── */
                <div className="flex flex-col items-center py-10 gap-4">
                  <div className="w-14 h-14 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center">
                    <svg className="w-7 h-7 text-emerald-400 check-anim" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">Access granted</p>
                    <p className="text-slate-500 text-xs mt-1">Redirecting…</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-5">

                  <div>
                    <p className="text-sm font-semibold text-white/80 mb-1">Sign in to continue</p>
                    <p className="text-xs text-slate-500">Enter your credentials to access the admin panel</p>
                  </div>

                  <div className="space-y-4 pt-1">
                    {/* User ID */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">User ID</label>
                      <input
                        value={userId}
                        onChange={e => setUserId(e.target.value)}
                        onFocus={() => setFocused('id')}
                        onBlur={() => setFocused(null)}
                        className={`w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-all duration-200 ${
                          focused === 'id'
                            ? 'border-indigo-500/60 bg-indigo-950/40 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'
                            : 'border-white/8 bg-white/[0.04] hover:bg-white/[0.06]'
                        }`}
                        style={{ border: `1px solid ${focused === 'id' ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}` }}
                        placeholder="Enter your user ID"
                        required autoComplete="username"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                      <div className="relative">
                        <input
                          type={showPwd ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          onFocus={() => setFocused('pwd')}
                          onBlur={() => setFocused(null)}
                          className={`w-full px-4 pr-11 py-2.5 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-all duration-200 ${
                            focused === 'pwd'
                              ? 'border-indigo-500/60 bg-indigo-950/40 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'
                              : 'border-white/8 bg-white/[0.04] hover:bg-white/[0.06]'
                          }`}
                          style={{ border: `1px solid ${focused === 'pwd' ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}` }}
                          placeholder="••••••••"
                          required autoComplete="current-password"
                        />
                        <button type="button" tabIndex={-1}
                          onClick={() => setShowPwd(v => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
                          {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* error */}
                  {error && (
                    <div className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs text-rose-300"
                      style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  )}

                  {/* submit */}
                  <button type="submit" disabled={loading || !userId || !password}
                    className="sign-in-btn w-full relative overflow-hidden flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed">
                    <span className="btn-bg absolute inset-0" />
                    <span className="btn-shimmer absolute inset-0" />
                    <span className="relative z-10 flex items-center gap-2">
                      {loading
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
                        : <>Sign in <ArrowRight size={14} /></>}
                    </span>
                  </button>

                </form>
              )}

              <div className="mt-6 pt-5 border-t border-white/[0.05]">
                <p className="text-center text-[11px] text-slate-600">© {new Date().getFullYear()} Pentagon Security Verifier</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <Styles />
    </>
  )
}

function Styles() {
  return (
    <style>{`
      /* ambient background glows */
      .ambient-glow {
        position: absolute; border-radius: 50%;
        filter: blur(100px); pointer-events: none;
        animation: float 18s ease-in-out infinite alternate;
      }
      .glow-a {
        width: 500px; height: 500px;
        background: radial-gradient(circle, rgba(79,70,229,0.12), transparent 70%);
        top: -15%; left: -10%;
      }
      .glow-b {
        width: 400px; height: 400px;
        background: radial-gradient(circle, rgba(99,102,241,0.09), transparent 70%);
        bottom: -10%; right: -5%;
        animation-delay: -9s; animation-duration: 22s;
      }
      @keyframes float {
        0%   { transform: translate(0,0); }
        50%  { transform: translate(20px,-30px); }
        100% { transform: translate(-10px,20px); }
      }

      /* sign-in button */
      .sign-in-btn {
        box-shadow: 0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(99,102,241,0.25);
        transition: box-shadow 0.2s, transform 0.15s;
      }
      .sign-in-btn:not(:disabled):hover {
        box-shadow: 0 2px 6px rgba(0,0,0,0.4), 0 6px 24px rgba(99,102,241,0.4);
        transform: translateY(-1px);
      }
      .sign-in-btn:not(:disabled):active { transform: translateY(0); }

      .btn-bg {
        background: linear-gradient(135deg, #4338ca, #4f46e5, #6366f1);
        border-radius: 8px;
      }
      /* one-shot shimmer — no loop */
      .btn-shimmer {
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%);
        border-radius: 8px;
        transform: translateX(-100%);
        transition: transform 0.6s ease;
      }
      .sign-in-btn:not(:disabled):hover .btn-shimmer { transform: translateX(100%); }

      /* success checkmark */
      .check-anim {
        stroke-dasharray: 40;
        stroke-dashoffset: 40;
        animation: draw 0.45s ease 0.15s forwards;
      }
      @keyframes draw { to { stroke-dashoffset: 0; } }

      /* shake on error */
      @keyframes shake {
        0%,100% { transform: translateX(0) perspective(1200px); }
        20%,60% { transform: translateX(-5px) perspective(1200px); }
        40%,80% { transform: translateX( 5px) perspective(1200px); }
      }
      .shake { animation: shake 0.4s ease both; }

      /* autofill */
      input:-webkit-autofill, input:-webkit-autofill:focus {
        -webkit-text-fill-color: white;
        -webkit-box-shadow: 0 0 0 1000px #07071f inset;
        transition: background-color 5000s;
      }
      input::placeholder { color: rgba(148,163,184,0.3); }
    `}</style>
  )
}
