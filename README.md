# Journal de Chantier — Agent Claude

Système de journal de chantier basé sur Claude.ai pour Maestro Mobilité.
Conçu pour une utilisation mobile sur le terrain, avec notes vocales et stockage persistant.

---

## Démarrage rapide

**Pour un travailleur (première fois) :** voir `onboarding-eric.md`

**Pour chaque journée :**
1. Ouvrir le projet **Journal de Chantier** dans Claude.ai
2. Envoyer : `Bonjour, je suis [Nom], chantier [Nom du chantier]`
3. Dicter les notes au fil de la journée
4. Fin de journée : `RAPPORT FINAL`

---

## Commandes disponibles

| Message envoyé         | Action                                              |
|------------------------|-----------------------------------------------------|
| (texte normal)         | Entrée Activité — horodatée, corrigée, sauvegardée  |
| `ÉVÉNEMENT`            | Lance le dialogue événement (description, lieu, photos) |
| `QUANTITÉ` / `QTÉ`     | Lance le dialogue quantité (item, qté, unité)       |
| `journal du jour`      | Affiche toutes les entrées du jour                  |
| `RAPPORT FINAL`        | Génère le rapport structuré de la journée           |

---

## Structure du repo

```
rick-journal-chantier/
├── README.md                    # Ce fichier
├── ARCHITECTURE.md              # Diagramme système, flux de données
├── ROADMAP.md                   # Phases, statut, prochaines étapes
├── BUG-LOG.md                   # Bugs rencontrés et résolus
├── journal-chantier-prompt.md   # Prompt versionné Claude.ai (source de vérité)
├── lexique.md                   # Abréviations et termes techniques
├── onboarding-eric.md           # Guide d'installation pour les travailleurs
├── onboarding-eric.pdf          # Version PDF du guide
└── assets/
    ├── generate-rapport.js      # Script Node.js → génère rapport-template.docx
    ├── logo-maestro.jpeg        # Logo Maestro Mobilité (fond blanc)
    └── rapport-template.docx   # Dernier rapport généré (output)
```

**Edge function (repo séparé) :**
```
~/Developer/open-brain-functions/supabase/functions/journal-chantier-mcp/
├── index.ts       # Serveur MCP — 5 outils journal
└── deno.json
```

---

## Mettre à jour le prompt

Voir les instructions en bas de `journal-chantier-prompt.md`.
Incrémenter la version → commit → push → notifier l'équipe.

---

## Générer un rapport DOCX

```bash
cd /Users/tpoupart/Desktop/Rick/assets
node generate-rapport.js
# → produit rapport-template.docx dans assets/
```

Pré-requis : `npm install` (installe la dépendance `docx`).

---

## Déployer la fonction edge

```bash
cd ~/Developer/open-brain-functions
./deploy.sh
```

---

## Contacts

- **Tristan Poupart** — Maestro Mobilité, architecte du système
