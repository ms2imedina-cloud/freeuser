import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { analysePhone } from "./phone.js";
import { checkEmail } from "./email.js";
import { runAgent, normUrl } from "./agent.js";

const app = express();
app.set("trust proxy", 1);

// CORS : n autorise que votre site GitHub Pages (ex: https://monuser.github.io)
const origins = (process.env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: origins.length ? origins : false }));
app.use(express.json({ limit: "10kb" }));
// Chaque recherche coûte de l argent (agent IA) : limite volontairement basse
app.use(rateLimit({ windowMs: 60_000, limit: 6, standardHeaders: true, legacyHeaders: false }));

const TRUSTED = (process.env.TRUSTED_DOMAINS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };
const isTrusted = (host) => TRUSTED.some((d) => host === d || host.endsWith("." + d));
const cut = (v, n = 160) => String(v ?? "").slice(0, n);

const MODES = ["phone", "name", "email", "company", "registry", "project"];

app.get("/health", (_req, res) => res.json({ ok: true, agent: !!process.env.ANTHROPIC_API_KEY, time: new Date().toISOString() }));

app.post("/search", async (req, res) => {
  const { mode, query, country = "", sector = "" } = req.body || {};
  if (!MODES.includes(mode) || typeof query !== "string" || !query.trim() || query.length > 200) {
    return res.status(400).json({ error: "Requête invalide" });
  }
  const q = query.trim();

  try {
    let hint = "", forced = {};
    if (mode === "phone") {
      const p = analysePhone(q, country);
      if (!p) return res.json({ results: [], note: "Numéro invalide" });
      hint = `numéro normalisé ${p.e164} (${p.intl}), pays ${p.country}, type ${p.type || "inconnu"}`;
      forced = { phone: p.e164, country: p.country };
    } else if (mode === "email") {
      const e = await checkEmail(q);
      if (!e) return res.status(400).json({ error: "Email invalide" });
      if (!e.mxOk) return res.json({ results: [], note: "Domaine email sans serveur de messagerie" });
      hint = `domaine ${e.domain} valide (MX ok)`;
    }

    const agent = await runAgent({ mode, query: q, country, sector, hint });

    const results = [];
    for (const x of agent.results.slice(0, 5)) {
      // Anti-hallucination : on ne garde que les sources réellement consultées par l agent
      const srcs = (Array.isArray(x.sources) ? x.sources : []).filter((s) => s && agent.retrieved.has(normUrl(s.url)));
      if (!srcs.length) continue;
      const hosts = new Set(srcs.map((s) => hostOf(s.url)));
      const confirmed = x.confidence === "confirmed" && (hosts.size >= 2 || srcs.some((s) => isTrusted(hostOf(s.url))));
      results.push({
        name: cut(x.name, 120) || "Sans nom",
        arabic: cut(x.arabic, 120),
        country: forced.country || cut(x.country, 2).toUpperCase() || country,
        company: cut(x.company),
        role: cut(x.role),
        phone: forced.phone || cut(x.phone, 40),
        email: cut(x.email, 120),
        website: cut(x.website || srcs[0].url, 300),
        sector: cut(x.sector, 80) || sector,
        confidence: confirmed ? "confirmed" : "probable",
        sources: [...hosts].filter(Boolean),
      });
    }
    res.json({ results, note: agent.note });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: "Erreur de l agent IA" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Backend prêt sur le port " + port));
