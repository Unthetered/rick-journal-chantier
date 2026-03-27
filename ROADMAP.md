# Roadmap — Journal de Chantier

**Dernière mise à jour :** 2026-03-27

---

## Phase 1 — Pilot terrain (état actuel ✅)

Objectif : tester le flux complet avec Éric sur un vrai chantier, sans friction d'installation.

### Livré
- [x] Prompt Claude.ai versionné (3 sections : Activités, Événements, Quantités)
- [x] Lexique avec conversions automatiques (FC, FP, ANC, OC, BT, PSS, ÉPI)
- [x] Stockage Supabase via MCP edge function (`journal-chantier-mcp`)
- [x] 5 outils MCP : get_or_create, log_activity, log_event, log_quantity, get_today
- [x] Multi-chantiers (project_name + created_by par session)
- [x] Template rapport DOCX — logo Maestro, adresse, 3 sections, Annexe A photos, pagination
- [x] Guide d'onboarding pour Éric (MD + PDF)
- [x] Documentation : README, ARCHITECTURE, ROADMAP, BUG-LOG

### Limitations connues Phase 1
- Pas d'auth : n'importe qui avec l'URL MCP peut écrire dans la DB
- Rapport DOCX généré manuellement sur le Mac de Tristan (pas depuis le terrain)
- Photos : URL stockées en DB mais upload non encore câblé
- Pas d'interface pour corriger ou supprimer une entrée

---

## Phase 2 — Auth + Rapport automatique

Objectif : chaque travailleur a son propre accès sécurisé; le rapport DOCX est généré depuis le terrain.

### À livrer
- [ ] **Auth magic link** — email → lien → session JWT Supabase
  - Web app minimaliste (Next.js ou simple HTML) pour le login
  - Connecteur Claude.ai configuré avec le JWT de session
- [ ] **Edge function `generate-rapport`**
  - Appelle `journal_get_today` en interne
  - Génère le DOCX (port de `generate-rapport.js` en Deno/TypeScript)
  - Retourne un lien de téléchargement Supabase Storage
  - Accessible via outil MCP `journal_generate_report`
- [ ] **Upload photos** depuis Claude.ai
  - Outil MCP `journal_upload_photo` → Supabase Storage
  - URL stockée dans `journal_events.photo_urls`

---

## Phase 3 — Web app de consultation

Objectif : Tristan (et les chargés de projet) peuvent naviguer et exporter les journaux depuis un dashboard.

### À livrer
- [ ] Dashboard web — liste des journaux par chantier et par date
- [ ] Visualisation d'un journal (3 sections, photos)
- [ ] Export DOCX / PDF depuis le web
- [ ] Correction / suppression d'entrées
- [ ] Gestion des utilisateurs (ajouter un travailleur)

---

## Phase 4 — Intégrations

- [ ] Intégration CRM — remplir le bloc client automatiquement
- [ ] Intégration agenda — associer des journaux à des projets actifs
- [ ] Rapports hebdomadaires agrégés

---

## Décisions reportées

| Sujet | Status | Note |
|-------|--------|------|
| Hébergement web app Phase 2 | Non décidé | Vercel ou Supabase hosting |
| Format export alternatif (PDF natif) | Non décidé | Après Phase 2 |
| Notifications (fin de journée, rapport manqué) | Non décidé | Phase 3+ |
