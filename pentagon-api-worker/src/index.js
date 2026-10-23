import { SignJWT, jwtVerify } from "jose";

// Generate a secret key from your env variable
async function getKey(secret) {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ── LOGIN ──────────────────────────────────────────
    if (path === "/api/login" && request.method === "POST") {
      const { user_id, user_pin } = await request.json();

      if (!user_id || !user_pin) {
        return new Response(
          JSON.stringify({ error: "user_id and user_pin are required" }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Query D1 for the user
      const stmt = env.DB.prepare(
        "SELECT user_id, user_pin, name, role, is_active FROM login_info WHERE user_id = ?"
      ).bind(user_id);

      const user = await stmt.first();

      if (!user) {
        return new Response(
          JSON.stringify({ error: "Invalid user ID or PIN" }),
          { status: 401, headers: corsHeaders }
        );
      }

      if (!user.is_active) {
        return new Response(
          JSON.stringify({ error: "Account is inactive" }),
          { status: 403, headers: corsHeaders }
        );
      }

      // Verify PIN (plain text comparison — see note below)
      if (user.user_pin !== user_pin) {
        return new Response(
          JSON.stringify({ error: "Invalid user ID or PIN" }),
          { status: 401, headers: corsHeaders }
        );
      }

      // ── Shift Authorization Enforcement for Security Guards ──
      if ((user.role || "").toUpperCase() === "SECURITY") {
        try {
          const secStmt = env.DB.prepare(
            "SELECT factory FROM security_users WHERE security_id = ?"
          ).bind(user.user_id);
          const secRow = await secStmt.first();
          const guardFactory = secRow?.factory || "F001";

          // Calculate current IST time (UTC + 5:30)
          const now = new Date();
          const istOffset = 5.5 * 60 * 60 * 1000;
          const istDate = new Date(now.getTime() + istOffset);
          const hours = String(istDate.getUTCHours()).padStart(2, "0");
          const minutes = String(istDate.getUTCMinutes()).padStart(2, "0");
          const nowTimeStr = `${hours}:${minutes}`;

          const shiftsStmt = env.DB.prepare(
            "SELECT id, shift_name, start_time, end_time FROM shifts WHERE factory_code = ? AND is_active = 1"
          ).bind(guardFactory);
          const { results: factoryShifts } = await shiftsStmt.all();

          let matchedShift = null;
          for (const s of (factoryShifts || [])) {
            const st = s.start_time;
            const et = s.end_time;
            if (st < et) {
              if (st <= nowTimeStr && nowTimeStr < et) {
                matchedShift = s;
                break;
              }
            } else {
              if (nowTimeStr >= st || nowTimeStr < et) {
                matchedShift = s;
                break;
              }
            }
          }

          if (matchedShift) {
            const allocStmt = env.DB.prepare(
              "SELECT security_id FROM shift_allocations WHERE shift_id = ?"
            ).bind(matchedShift.id);
            const { results: allocations } = await allocStmt.all();

            if (allocations && allocations.length > 0) {
              const allocatedIds = allocations.map((a) => a.security_id);
              if (!allocatedIds.includes(user.user_id)) {
                return new Response(
                  JSON.stringify({
                    error: `Access Denied: You are not assigned to ${matchedShift.shift_name} (${matchedShift.start_time} to ${matchedShift.end_time}). Only assigned guards may log in.`
                  }),
                  { status: 403, headers: corsHeaders }
                );
              }
            }
          }
        } catch (shiftErr) {
          console.warn("Shift check bypass on error:", shiftErr);
        }
      }

      // Issue JWT
      const key = await getKey(env.JWT_SECRET);
      const token = await new SignJWT({
        user_id: user.user_id,
        name: user.name,
        role: user.role,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("8h")
        .setIssuer("security-rounds")
        .sign(key);

      return new Response(
        JSON.stringify({
          token,
          user: {
            user_id: user.user_id,
            name: user.name,
            role: user.role,
          },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // ── LOGOUT ──────────────────────────────────────────
    if (path === "/api/logout" && request.method === "POST") {
      // JWTs are stateless — logout is handled client-side by deleting the token.
      // Optionally, you can add the token to a denylist in KV if you need
      // server-side invalidation. For now, just return success.
      return new Response(
        JSON.stringify({ message: "Logged out successfully" }),
        { status: 200, headers: corsHeaders }
      );
    }

    // ── AUTHENTICATED ENDPOINT EXAMPLE ──────────────────
    if (path === "/api/me" && request.method === "GET") {
      const auth = request.headers.get("Authorization");
      if (!auth || !auth.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Missing token" }),
          { status: 401, headers: corsHeaders }
        );
      }

      const token = auth.replace("Bearer ", "");
      try {
        const key = await getKey(env.JWT_SECRET);
        const { payload } = await jwtVerify(token, key, {
          issuer: "security-rounds",
        });
        return new Response(
          JSON.stringify({ user: payload }),
          { status: 200, headers: corsHeaders }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired token" }),
          { status: 401, headers: corsHeaders }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: corsHeaders }
    );
  },
};
