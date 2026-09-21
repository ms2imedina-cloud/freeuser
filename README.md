# Gulf Reverse Pro — Frontend + Backend (agent IA)

```
GitHub (code) ──► GitHub Pages = frontend (frontend/index.html)
              └─► Render       = backend  (backend/server.js) ──► Agent IA Claude + recherche web
```

GitHub Pages n héberge que du statique : le backend Node.js tourne sur Render (gratuit), déployé depuis votre dépôt GitHub.

## Comment ça marche
Le frontend appelle `POST /search`. Le backend :
1. valide le numéro (libphonenumber) ou l email (domaine MX) ;
2. lance l **agent IA** (Claude + outil de recherche web intégré) avec des règles strictes : sources publiques/professionnelles uniquement, aucune invention ;
3. **vérifie** le résultat : toute source que l agent n a pas réellement consultée est supprimée ; "Confirmé" exige 2 sources indépendantes ou un domaine de `TRUSTED_DOMAINS`, sinon "Probable" ; sans source valide → aucun résultat.

## 1. Code sur GitHub
```bash
git init && git add . && git commit -m "init"
git branch -M main
git remote add origin https://github.com/VOTRE-USER/gulf-reverse-pro.git
git push -u origin main
```
(dépôt privé recommandé)

## 2. Clé API Anthropic
https://console.anthropic.com → *API Keys* → créer une clé (`ANTHROPIC_API_KEY`) et ajouter du crédit.
Coût : tokens + recherches web (facturées à l usage). Le backend limite à 6 recherches/minute/IP.

## 3. Backend sur Render
1. https://render.com → *New → Blueprint* → choisir le dépôt (lit `render.yaml`).
2. Variables : `ALLOWED_ORIGIN` = `https://VOTRE-USER.github.io`, `ANTHROPIC_API_KEY`, `TRUSTED_DOMAINS` (optionnel, ex: `mci.gov.sa,moec.gov.ae`).
3. Testez `https://VOTRE-SERVICE.onrender.com/health` → `{"ok":true,"agent":true}`.
   (offre gratuite : réveil ~30 s ; une recherche agent dure 15–60 s)

## 4. Frontend sur GitHub Pages
*Settings → Pages → Source : GitHub Actions*. Chaque push sur `main` dans `frontend/` déploie via `.github/workflows/pages.yml`.

## 5. Brancher
Application → **Paramètres** : URL backend = URL Render, mode = **live** → *Tester*.

## Dev local
```bash
cd backend && cp .env.example .env   # remplir la clé
export $(grep -v "^#" .env | xargs) && npm run dev
```
`ALLOWED_ORIGIN=http://localhost:5500` + `npx serve frontend -p 5500` (`file://` est refusé par CORS).

## Sécurité et conformité
- Clés uniquement dans les variables Render, jamais dans le dépôt.
- Un numéro seul n identifie personne : seules des sources publiques explicites sont acceptées.
- Respectez la loi sénégalaise 2008-12 (CDP) et celles du pays ciblé (PDPL saoudienne, émiratie…) pour la prospection.
