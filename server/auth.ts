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

export function setupAuth(app: Express) {
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

  app.get("/api/auth/me", (req, res) => {
    console.log("[auth] /me - cookies:", req.headers.cookie, "sessionID:", req.sessionID, "isAuthenticated:", req.isAuthenticated && req.isAuthenticated());
    if (!req.isAuthenticated || !req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as PublicUser;
    res.json(user);
  });
}

export function ensureAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ message: "Unauthorized" });
}
