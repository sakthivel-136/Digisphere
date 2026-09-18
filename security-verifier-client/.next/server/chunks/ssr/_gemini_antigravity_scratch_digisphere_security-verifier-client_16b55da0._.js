module.exports=[24054,a=>{"use strict";let b={get:()=>null,set(a){},remove(){}},c=()=>null;a.s(["clearAuth",0,()=>{b.remove()},"getUser",0,c,"isAuthenticated",0,()=>!!b.get()&&!!c(),"tokenService",0,b])},47252,a=>{"use strict";a.s(["getApiUrl",0,()=>{let a=process.env.NEXT_PUBLIC_API_URL;return!a||a.includes("localhost")||a.includes("127.0.0.1")||a.includes("0.0.0.0")?"http://localhost:8000":a}])},18797,a=>{"use strict";let b=(0,a.i(13749).default)("eye",[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);a.s(["Eye",()=>b],18797)},46509,a=>{"use strict";var b=a.i(57818),c=a.i(10539),d=a.i(40381),e=a.i(13749);let f=(0,e.default)("shield-check",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);var g=a.i(18797);let h=(0,e.default)("eye-off",[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]),i=(0,e.default)("arrow-right",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]),j=[/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|TRUNCATE|REPLACE|MERGE)\b)/gi,/(--|;|\/\*|\*\/|xp_|0x[0-9a-f]+)/gi,/(\bOR\b\s+['"\d]|AND\s+['"\d])/gi,/(['"];\s*(SELECT|INSERT|DROP|UPDATE))/gi,/(\bWAITFOR\b|\bSLEEP\b|\bBENCHMARK\b)/gi],k=[/<script[\s\S]*?>[\s\S]*?<\/script>/gi,/javascript\s*:/gi,/on\w+\s*=\s*["'][^"']*["']/gi,/<[^>]*\s(on\w+)\s*=/gi,/data\s*:\s*text\/html/gi,/<iframe|<object|<embed|<applet/gi];function l(a){if("string"!=typeof a)return"";let b=a.trim().replace(/\s{2,}/g," ");return b.replace(/\0/g,"")}function m(a,b,c){let d=l(a),e=function(a,b,c=1,d=255){return a.length<c?`${b} must be at least ${c} character(s)`:a.length>d?`${b} must be at most ${d} characters`:null}(d,b,c?.min??1,c?.max??255);if(e)return e;let f=function(a,b="Field"){let c=l(a);for(let a of j)if(a.lastIndex=0,a.test(c))return`${b} contains invalid characters`;for(let a of k)if(a.lastIndex=0,a.test(c))return`${b} contains invalid content`;return null}(d,b);if(f)return f;if(c?.alphanumericId){let a=/^[a-zA-Z0-9_-]+$/.test(d)?null:`${b} must contain only letters, numbers, underscores or dashes`;if(a)return a}if(c?.nameOnly){let a=/^[a-zA-Z0-9\s.\-',]+$/.test(d)?null:`${b} contains unsupported characters`;if(a)return a}return null}var n=a.i(47252),o=a.i(24054);function p(){let a=(0,d.useRouter)(),[e,j]=(0,c.useState)(""),[k,p]=(0,c.useState)(""),[r,s]=(0,c.useState)(!1),[t,u]=(0,c.useState)(!1),[v,w]=(0,c.useState)(null),[x,y]=(0,c.useState)(!1),[z,A]=(0,c.useState)(null),B=(0,c.useRef)(null),C=(0,c.useRef)(null),D=(0,c.useRef)({tiltX:0,tiltY:0,gx:0,gy:0,inside:!1}),E=(0,c.useRef)(0);(0,c.useEffect)(()=>{let a=0,b=0,c=0,d=0,e=()=>{let{tiltX:f,tiltY:g,gx:h,gy:i,inside:j}=D.current;a+=(f-a)*.08,b+=(g-b)*.08,c+=(h-c)*.08,d+=(i-d)*.08;let k=B.current;k&&(k.style.transform=`perspective(1200px) rotateX(${a}deg) rotateY(${b}deg)`);let l=C.current;l&&(l.style.opacity=j?"1":"0",l.style.background=`radial-gradient(320px circle at ${c}px ${d}px, rgba(255,255,255,0.055), transparent 70%)`),E.current=requestAnimationFrame(e)};return E.current=requestAnimationFrame(e),()=>cancelAnimationFrame(E.current)},[]);let F=(0,c.useCallback)(a=>{let b=B.current.getBoundingClientRect(),c=b.width/2,d=b.height/2,e=a.clientX-b.left,f=a.clientY-b.top;D.current={tiltX:-((f-d)/d*3),tiltY:(e-c)/c*3,gx:e,gy:f,inside:!0}},[]),G=(0,c.useCallback)(()=>{D.current={tiltX:0,tiltY:0,gx:0,gy:0,inside:!1}},[]),H=async b=>{b.preventDefault(),u(!0),w(null);let c=m(e,"User ID",{min:1,max:50}),d=m(k,"Password",{min:1,max:100});if(c||d){w(c||d||"Invalid input"),u(!1);return}try{let b=(0,n.getApiUrl)(),c=await fetch(`${b}/auth/login`,{method:"POST",headers:{"Content-Type":"application/json",accept:"application/json"},body:JSON.stringify({user_id:e,user_pin:k})});if(!c.ok){let a=await c.json().catch(()=>({}));throw Error(a?.detail||"Invalid credentials")}let d=await c.json();localStorage.clear(),o.tokenService.set(d.access_token),localStorage.setItem("role",d.role),localStorage.setItem("name",l(d.name||"")),localStorage.setItem("adminName",l(d.name||"")),y(!0),setTimeout(()=>a.push("/dashboard"),900)}catch(a){w(a.message||"Login failed"),B.current?.classList.add("shake"),setTimeout(()=>B.current?.classList.remove("shake"),500)}finally{u(!1)}};return(0,b.jsxs)(b.Fragment,{children:[(0,b.jsxs)("div",{className:"fixed inset-0 z-0",style:{background:"radial-gradient(ellipse 80% 80% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 60%), linear-gradient(160deg, #05051e 0%, #080830 40%, #060622 100%)"},children:[(0,b.jsx)("div",{className:"absolute inset-0 opacity-[0.025]",style:{backgroundImage:"linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)",backgroundSize:"72px 72px"}}),(0,b.jsx)("div",{className:"ambient-glow glow-a"}),(0,b.jsx)("div",{className:"ambient-glow glow-b"})]}),(0,b.jsx)("div",{className:"relative z-10 min-h-screen flex items-center justify-center px-4",children:(0,b.jsxs)("div",{className:"w-full max-w-[400px]",children:[(0,b.jsxs)("div",{className:"flex flex-col items-center mb-8",children:[(0,b.jsxs)("div",{className:"relative mb-4",children:[(0,b.jsx)("div",{className:"absolute inset-0 rounded-2xl bg-indigo-500/30 blur-2xl scale-110"}),(0,b.jsx)("div",{className:"relative w-14 h-14 rounded-2xl flex items-center justify-center",style:{background:"linear-gradient(135deg,#4f46e5,#6366f1)"},children:(0,b.jsx)(f,{size:26,className:"text-white",strokeWidth:2})})]}),(0,b.jsx)("h1",{className:"text-[22px] font-bold text-white tracking-tight",children:"Pentagon Security"}),(0,b.jsx)("p",{className:"text-indigo-300/40 text-xs mt-1 tracking-wide",children:"Admin Portal"})]}),(0,b.jsxs)("div",{ref:B,onMouseMove:F,onMouseLeave:G,className:"relative rounded-2xl",style:{willChange:"transform",transition:"transform 0.05s linear"},children:[(0,b.jsx)("div",{ref:C,className:"absolute inset-0 rounded-2xl pointer-events-none z-10",style:{opacity:0,transition:"opacity 0.4s ease"}}),(0,b.jsx)("div",{className:"absolute inset-0 rounded-2xl",style:{background:"linear-gradient(135deg, rgba(99,102,241,0.35), rgba(255,255,255,0.04), rgba(99,102,241,0.15))",padding:"1px"},children:(0,b.jsx)("div",{className:"absolute inset-[1px] rounded-2xl",style:{background:"#07071f"}})}),(0,b.jsxs)("div",{className:"relative z-[2] rounded-2xl p-8",style:{background:"rgba(8,8,40,0.8)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)"},children:[x?(0,b.jsxs)("div",{className:"flex flex-col items-center py-10 gap-4",children:[(0,b.jsx)("div",{className:"w-14 h-14 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center",children:(0,b.jsx)("svg",{className:"w-7 h-7 text-emerald-400 check-anim",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.5,strokeLinecap:"round",strokeLinejoin:"round",children:(0,b.jsx)("polyline",{points:"20 6 9 17 4 12"})})}),(0,b.jsxs)("div",{className:"text-center",children:[(0,b.jsx)("p",{className:"text-white font-semibold",children:"Access granted"}),(0,b.jsx)("p",{className:"text-slate-500 text-xs mt-1",children:"Redirecting…"})]})]}):(0,b.jsxs)("form",{onSubmit:H,className:"space-y-5",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("p",{className:"text-sm font-semibold text-white/80 mb-1",children:"Sign in to continue"}),(0,b.jsx)("p",{className:"text-xs text-slate-500",children:"Enter your credentials to access the admin panel"})]}),(0,b.jsxs)("div",{className:"space-y-4 pt-1",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"block text-xs font-medium text-slate-400 mb-1.5",children:"User ID"}),(0,b.jsx)("input",{value:e,onChange:a=>j(a.target.value),onFocus:()=>A("id"),onBlur:()=>A(null),className:`w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-all duration-200 ${"id"===z?"border-indigo-500/60 bg-indigo-950/40 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]":"border-white/8 bg-white/[0.04] hover:bg-white/[0.06]"}`,style:{border:`1px solid ${"id"===z?"rgba(99,102,241,0.5)":"rgba(255,255,255,0.07)"}`},placeholder:"Enter your user ID",required:!0,autoComplete:"username"})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"block text-xs font-medium text-slate-400 mb-1.5",children:"Password"}),(0,b.jsxs)("div",{className:"relative",children:[(0,b.jsx)("input",{type:r?"text":"password",value:k,onChange:a=>p(a.target.value),onFocus:()=>A("pwd"),onBlur:()=>A(null),className:`w-full px-4 pr-11 py-2.5 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-all duration-200 ${"pwd"===z?"border-indigo-500/60 bg-indigo-950/40 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]":"border-white/8 bg-white/[0.04] hover:bg-white/[0.06]"}`,style:{border:`1px solid ${"pwd"===z?"rgba(99,102,241,0.5)":"rgba(255,255,255,0.07)"}`},placeholder:"••••••••",required:!0,autoComplete:"current-password"}),(0,b.jsx)("button",{type:"button",tabIndex:-1,onClick:()=>s(a=>!a),className:"absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors",children:r?(0,b.jsx)(h,{size:14}):(0,b.jsx)(g.Eye,{size:14})})]})]})]}),v&&(0,b.jsxs)("div",{className:"flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs text-rose-300",style:{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.15)"},children:[(0,b.jsx)("svg",{className:"w-3.5 h-3.5 flex-shrink-0",fill:"currentColor",viewBox:"0 0 20 20",children:(0,b.jsx)("path",{fillRule:"evenodd",d:"M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z",clipRule:"evenodd"})}),v]}),(0,b.jsxs)("button",{type:"submit",disabled:t||!e||!k,className:"sign-in-btn w-full relative overflow-hidden flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed",children:[(0,b.jsx)("span",{className:"btn-bg absolute inset-0"}),(0,b.jsx)("span",{className:"btn-shimmer absolute inset-0"}),(0,b.jsx)("span",{className:"relative z-10 flex items-center gap-2",children:t?(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)("span",{className:"w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"}),"Signing in…"]}):(0,b.jsxs)(b.Fragment,{children:["Sign in ",(0,b.jsx)(i,{size:14})]})})]})]}),(0,b.jsx)("div",{className:"mt-6 pt-5 border-t border-white/[0.05]",children:(0,b.jsxs)("p",{className:"text-center text-[11px] text-slate-600",children:["© ",new Date().getFullYear()," Pentagon Security Verifier"]})})]})]})]})}),(0,b.jsx)(q,{})]})}function q(){return(0,b.jsx)("style",{children:`
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
    `})}a.s(["default",()=>p],46509)}];

//# sourceMappingURL=_gemini_antigravity_scratch_digisphere_security-verifier-client_16b55da0._.js.map