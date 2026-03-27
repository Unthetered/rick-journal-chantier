# Architecture — Journal de Chantier

**Version système :** 2.2.0
**Date :** 2026-03-27

---

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                        TERRAIN (mobile)                         │
│                                                                 │
│   Travailleur  ──dictée vocale──►  Claude.ai Project            │
│                                   (prompt journal-chantier)     │
│                                          │                      │
│                                    MCP Connector                │
└──────────────────────────────────────────┼──────────────────────┘
                                           │ HTTPS
                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE CLOUD                               │
│                                                                 │
│   Edge Function: journal-chantier-mcp                          │
│   ┌─────────────────────────────────────────────────────┐      │
│   │  MCP Server (McpServer + StreamableHTTPTransport)   │      │
│   │                                                     │      │
│   │  journal_get_or_create   → journal_journals         │      │
│   │  journal_log_activity    → journal_activities       │      │
│   │  journal_log_event       → journal_events           │      │
│   │  journal_log_quantity    → journal_quantities       │      │
│   │  journal_get_today       ← toutes les tables        │      │
│   └─────────────────────────────────────────────────────┘      │
│                          │                                      │
│                    Supabase DB (PostgreSQL)                     │
│   ┌─────────────────────────────────────────────────────┐      │
│   │  public.journal_journals                            │      │
│   │  public.journal_activities                          │      │
│   │  public.journal_events                              │      │
│   │  public.journal_quantities                          │      │
│   └─────────────────────────────────────────────────────┘      │
│                                                                 │
│   Supabase Storage (futur) — photos des événements             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    MAC TRISTAN (local)                          │
│                                                                 │
│   generate-rapport.js (Node.js + docx lib)                     │
│   ← données copiées depuis Claude / journal_get_today          │
│   → rapport-template.docx (logo, en-tête, 3 sections, annexes) │
└─────────────────────────────────────────────────────────────────┘
```

---

## Composants

### 1. Claude.ai Project (interface travailleur)

- **Type :** projet Claude.ai avec instructions personnalisées (prompt)
- **Accès :** claude.ai sur mobile ou web
- **Prompt :** `journal-chantier-prompt.md` (versionné dans ce repo)
- **Connecteur MCP :** URL `https://nfloyhivvvhfrwgqrvov.supabase.co/functions/v1/journal-chantier-mcp`
- **Auth :** aucune en Phase 1 (pilot), magic link prévu en Phase 2

### 2. Edge Function — journal-chantier-mcp

- **Runtime :** Deno (Supabase Edge Functions)
- **Repo :** `~/Developer/open-brain-functions/supabase/functions/journal-chantier-mcp/`
- **Librairies :** `@modelcontextprotocol/sdk`, `@hono/mcp`, `hono`, `zod`, `@supabase/supabase-js`
- **Protocole :** MCP over Streamable HTTP
- **URL déployée :** `https://nfloyhivvvhfrwgqrvov.supabase.co/functions/v1/journal-chantier-mcp`
- **Isolation :** fonction séparée de `open-brain-mcp` (accès Tristan seulement)

#### Outils MCP exposés

| Outil | Description | Table |
|-------|-------------|-------|
| `journal_get_or_create` | Crée ou récupère le journal du jour | `journal_journals` |
| `journal_log_activity` | Enregistre une activité (Section 1) | `journal_activities` |
| `journal_log_event` | Enregistre un événement (Section 2) | `journal_events` |
| `journal_log_quantity` | Enregistre une quantité (Section 3) | `journal_quantities` |
| `journal_get_today` | Lit toutes les entrées du jour | toutes |

### 3. Base de données PostgreSQL (Supabase)

Schéma public avec préfixe `journal_` (contrainte PostgREST — schémas custom non exposés par défaut).

```sql
public.journal_journals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE NOT NULL,
  project_name TEXT NOT NULL,
  created_by   TEXT NOT NULL,
  UNIQUE (date, project_name, created_by)
)

public.journal_activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id  UUID REFERENCES journal_journals(id),
  entry_time  TIMESTAMPTZ DEFAULT now(),
  content     TEXT NOT NULL,
  raw         TEXT          -- transcription brute optionnelle
)

public.journal_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id  UUID REFERENCES journal_journals(id),
  entry_time  TIMESTAMPTZ DEFAULT now(),
  title       TEXT NOT NULL,
  description TEXT,
  location    TEXT,
  has_photos  BOOLEAN DEFAULT false,
  photo_count INTEGER DEFAULT 0,
  photo_urls  TEXT[]
)

public.journal_quantities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id   UUID REFERENCES journal_journals(id),
  entry_time   TIMESTAMPTZ DEFAULT now(),
  entrepreneur TEXT,
  discipline   TEXT,
  item         TEXT NOT NULL,
  qty          NUMERIC,
  unit         TEXT
)
```

### 4. Script de rapport (local — Phase 1)

- **Fichier :** `assets/generate-rapport.js`
- **Runtime :** Node.js
- **Dépendance :** `docx` ^9.6.1
- **Output :** `assets/rapport-template.docx`
- **Contenu :** logo Maestro, adresse, bloc client, 3 sections, Annexe A (photos), pagination

> **Note Phase 2 :** Ce script deviendra une edge function `generate-rapport` qui retourne un lien de téléchargement DOCX directement depuis le chantier.

---

## Flux de données — session type

```
1. Travailleur ouvre Claude.ai → projet Journal de Chantier

2. Premier message → Claude appelle :
   journal_get_or_create(project_name="X", created_by="Éric")
   → retourne journal_id (UUID)

3. Pour chaque note dictée → Claude appelle :
   journal_log_activity(journal_id, content="texte corrigé", raw="dictée brute")
   → entry_time auto-généré par Supabase

4. Pour un événement → Claude pose 3 questions → appelle :
   journal_log_event(journal_id, title, description, location, has_photos, photo_count)

5. Pour une quantité → Claude pose 2 questions → appelle :
   journal_log_quantity(journal_id, entrepreneur, discipline, item, qty, unit)

6. "journal du jour" → Claude appelle :
   journal_get_today(journal_id) → retourne toutes les entrées formatées

7. "RAPPORT FINAL" → journal_get_today → Claude formate le rapport texte
   (Phase 2 : génération DOCX automatique)
```

---

## Décisions d'architecture

| Décision | Choix | Raison |
|----------|-------|--------|
| Stockage | Supabase (PostgreSQL) | Multi-utilisateurs, futur web app, pas de friction Google Drive |
| Schéma | `public` avec préfixe `journal_` | PostgREST n'expose pas les schémas custom par défaut |
| Auth Phase 1 | Aucune | Le connecteur Claude.ai ne supporte pas les headers custom; pilot limité |
| Auth Phase 2 | Magic link email | Sans friction pour les travailleurs terrain, pas de mot de passe |
| Photos | URLs Supabase Storage (pas de binary en DB) | Évite le gonflement de la DB |
| Fonction MCP | Séparée de open-brain-mcp | Isolation — Éric ne doit pas avoir accès aux outils personnels de Tristan |
| Rapport DOCX | Script local Phase 1 | Assez pour le pilot; edge function prévue Phase 2 |

---

## Dépendances et repos

| Composant | Repo | Deploy |
|-----------|------|--------|
| Prompt + assets | `~/Desktop/Rick` (ce repo) | Git push |
| Edge function MCP | `~/Developer/open-brain-functions` | `./deploy.sh` |
| Supabase project | `nfloyhivvvhfrwgqrvov` | Console Supabase |
