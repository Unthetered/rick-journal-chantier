# Bug Log — Journal de Chantier

Bugs rencontrés, diagnostiqués et résolus durant le développement.
Format : date · symptôme · cause · fix.

---

## 2026-03-27

---

### BUG-001 — Logo absent du rapport DOCX

**Symptôme :** Le fichier `rapport-template.docx` généré n'affichait pas le logo Maestro.

**Cause :** Le script `generate-rapport.js` référençait le fichier logo avec `type: "png"`, mais le fichier était un JPEG (renommé depuis `signal-2026-03-27-131950.jpeg`).

**Fix :**
- Renommé le fichier : `signal-2026-03-27-131950.jpeg` → `logo-maestro.jpeg`
- Corrigé dans le script : `type: "png"` → `type: "jpg"`

**Fichiers touchés :** `assets/generate-rapport.js`, `assets/logo-maestro.jpeg`

---

### BUG-002 — Erreur Supabase : schéma custom inaccessible

**Symptôme :** L'edge function retournait `"Invalid schema: journal"` lors des appels DB.

**Cause :** Le code utilisait `.schema("journal").from(table)` pour accéder à un schéma Postgres custom. PostgREST (la couche API de Supabase) n'expose pas les schémas custom par défaut — seul `public` est accessible sans configuration supplémentaire.

**Fix :**
- Déplacé toutes les tables vers le schéma `public`
- Ajouté le préfixe `journal_` à chaque table pour éviter les conflits : `journals` → `journal_journals`, etc.
- Corrigé le code : `supabase.from('journal_${table}')` au lieu de `.schema("journal").from(table)`

**Fichiers touchés :** `supabase/functions/journal-chantier-mcp/index.ts`, migration SQL Supabase

---

### BUG-003 — Incohérence de nommage : table `journals` vs `journal_journals`

**Symptôme :** Lors de la migration, la table parent `journals` existait déjà mais sous le nom `journals` (sans préfixe), alors que les tables enfants avaient été créées avec le préfixe `journal_`.

**Cause :** Migration partielle — la table parent avait été créée dans une tentative précédente sans préfixe.

**Fix :**
```sql
ALTER TABLE public.journals RENAME TO journal_journals;
```

**Fichiers touchés :** Migration SQL Supabase

---

### BUG-004 — Auth header non supporté par le connecteur Claude.ai

**Symptôme :** Impossible de configurer un header `x-journal-key` dans l'interface de configuration des connecteurs de Claude.ai — le champ n'existe pas dans l'UI.

**Cause :** L'interface de connecteurs MCP de Claude.ai ne permet pas d'ajouter des headers custom au moment de la configuration (Phase 1 pilot).

**Fix :**
- Supprimé la vérification du header `x-journal-key` dans l'edge function pour le pilot Phase 1
- Noté comme dette technique — auth via JWT Supabase (magic link) prévu en Phase 2

**Impact sécurité :** L'URL MCP est non authentifiée. Acceptable pour un pilot interne limité. À corriger impérativement avant déploiement élargi.

**Fichiers touchés :** `supabase/functions/journal-chantier-mcp/index.ts`

---

### BUG-005 — Adresse Maestro sous le logo au lieu d'à côté

**Symptôme :** Dans le rapport DOCX, l'adresse de l'entreprise apparaissait sous le logo, prenant trop de hauteur dans l'en-tête.

**Cause :** L'adresse était dans un paragraphe séparé après l'image, pas dans une structure à deux colonnes.

**Fix :** Restructuré l'en-tête avec une table imbriquée à 2 colonnes :
- Colonne gauche : image logo (113×111 pt)
- Colonne droite : nom + adresse (alignés en haut à gauche)

**Fichiers touchés :** `assets/generate-rapport.js`

---

### BUG-006 — Numéro de projet dans l'en-tête du rapport

**Symptôme :** Le champ "No. projet" apparaissait dans l'en-tête du rapport — non désiré.

**Cause :** Présent dans la version initiale du script de génération.

**Fix :** Supprimé la ligne "No. projet" de l'en-tête. Conservé uniquement : date et nom du chantier.

**Fichiers touchés :** `assets/generate-rapport.js`

---

## Dettes techniques connues

| ID | Description | Priorité | Phase cible |
|----|-------------|----------|-------------|
| DT-001 | Aucune auth sur l'endpoint MCP — URL publique | Haute | Phase 2 |
| DT-002 | Rapport DOCX généré manuellement (script local) | Moyenne | Phase 2 |
| DT-003 | Upload photos non câblé (URLs stockées mais aucun mécanisme d'upload) | Moyenne | Phase 2 |
| DT-004 | Impossible de corriger ou supprimer une entrée via Claude | Basse | Phase 3 |
| DT-005 | Pas de pagination sur `journal_get_today` (risque si journal très long) | Basse | Phase 3 |
