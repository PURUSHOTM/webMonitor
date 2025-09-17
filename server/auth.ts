import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { db, schema } from "./db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import MemoryStoreFactory from "memorystore";

const MemoryStore = MemoryStoreFactory(session);

type PublicUser = { id: string; email: string };

async function findUserByEmail(email: string) {
  const res = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  return res[0];
}

async function findUserById(id: string) {
  const res = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return res[0];
}

function hashPassword(password: string, salt?: string) {
  const usedSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, usedSalt, 64).toString("hex");
  return { salt: usedSalt, hash };
}

function verifyPassword(password: string, salt: string, expectedHash: string) {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
}

// Simple HMAC token implementation to avoid cookie/session issues across proxies.
function createToken(payload: string, secret: string, expiresInSeconds = 60 * 60 * 24 * 30) {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const data = `${payload}.${expires}`;
  const sig = crypto.createHmac("sha256", secret).update(data).digest("hex");
  return `${Buffer.from(data).toString("base64")}.${sig}`;
}

function verifyToken(token: string, secret: string) {
  try {
    const [b64, sig] = token.split(".");
    const data = Buffer.from(b64, "base64").toString("utf8");
    const expectedSig = crypto.createHmac("sha256", secret).update(data).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sig))) return null;
    const [payload, expiresStr] = data.split(".");
    const expires = parseInt(expiresStr, 10);
    if (Math.floor(Date.now() / 1000) > expires) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

export function setupAuth(app: Express) {
  // When running behind a proxy (platforms like Fly), enable trust proxy so
  // secure and other proxy-dependent checks work correctly.
  try {
    app.set("trust proxy", 1);
  } catch (e) {
    // noop
  }

  const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({ checkPeriod: 86400000 }),
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      },
    }),
  );

  passport.use(
    new LocalStrategy({ usernameField: "email", passwordField: "password" }, async (email, password, done) => {
      try {
        const user = await findUserByEmail(email.toLowerCase());
        if (!user) return done(null, false, { message: "Invalid credentials" });
        const ok = verifyPassword(password, user.passwordSalt, user.passwordHash);
        if (!ok) return done(null, false, { message: "Invalid credentials" });
        return done(null, { id: user.id, email: user.email } as PublicUser);
      } catch (e) {
        return done(e);
      }
    }),
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await findUserById(id);
      if (!user) return done(null, false);
      return done(null, { id: user.id, email: user.email } as PublicUser);
    } catch (e) {
      return done(e);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
      const existing = await findUserByEmail(email.toLowerCase());
      if (existing) return res.status(400).json({ message: "Email already in use" });
      const { salt, hash } = hashPassword(password);
      const inserted = await db
        .insert(schema.users)
        .values({ email: email.toLowerCase(), passwordHash: hash, passwordSalt: salt })
        .returning();
      const newUser = { id: inserted[0].id, email: inserted[0].email } as PublicUser;
      req.login(newUser, (err) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        // Ensure session is saved to store before sending response
        req.session?.save((saveErr) => {
          if (saveErr) return res.status(500).json({ message: "Login failed" });
          return res.json(newUser);
        });
      });
    } catch (e: any) {
      return res.status(500).json({ message: e.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err, user: PublicUser | false, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Unauthorized" });
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        // debug log - show incoming cookies and session id
        console.log("[auth] login - incoming cookies:", req.headers.cookie, "sessionID before save:", req.sessionID);
        req.session?.save((saveErr) => {
          if (saveErr) {
            console.error("[auth] session save error:", saveErr);
            return next(saveErr);
          }
          console.log("[auth] login - session saved, sessionID:", req.sessionID);
          try {
            const sc = res.getHeader("set-cookie");
            console.log("[auth] login - set-cookie header:", sc);
          } catch (e) {
            console.warn("[auth] could not read set-cookie header", e);
          }
          // respond with user and session id for debugging (non-sensitive)
          return res.json({ user, sessionID: req.sessionID });
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      req.session?.destroy(() => {
        res.json({ ok: true });
      });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    console.log("[auth] /me - cookies:", req.headers.cookie, "sessionID:", req.sessionID, "isAuthenticated:", req.isAuthenticated && req.isAuthenticated());

    // Check Authorization Bearer token first
    const authHeader = (req.headers.authorization || "") as string;
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const secret = process.env.SESSION_SECRET || "";
      const payload = verifyToken(token, secret);
      if (payload) {
        const user = await findUserById(payload);
        if (user) return res.json({ id: user.id, email: user.email });
      }
    }

    if (!req.isAuthenticated || !req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as PublicUser;
    res.json(user);
  });
}

export function ensureAuth(req: Request, res: Response, next: NextFunction) {
  // Allow bearer token or session cookie
  const authHeader = (req.headers.authorization || "") as string;
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const secret = process.env.SESSION_SECRET || "";
    const payload = verifyToken(token, secret);
    if (payload) {
      // attach user id to req for downstream
      (req as any).user = { id: payload };
      return next();
    }
  }

  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ message: "Unauthorized" });
}
