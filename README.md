# Journal de Chantier — Agent Claude

Système de journal de chantier basé sur Claude.ai.
Conçu pour une utilisation mobile sur le terrain, avec notes vocales.

---

## Structure du repo

```
rick-journal-chantier/
├── journal-chantier-prompt.md   # Prompt versionné à coller dans Claude.ai Projects
├── lexique.md                   # Abréviations et termes techniques
├── specs/
│   └── rapport-format.md        # Specs du rapport de fin de journée
└── README.md
```

---

## Démarrage rapide

1. Ouvrir **Claude.ai → Projects → [Nom du chantier]**
2. Coller le contenu du bloc de code dans `journal-chantier-prompt.md` dans les instructions du projet
3. Sur le terrain : dicter une note vocale → Claude formate et horodate
4. Fin de journée : dire **"RAPPORT FINAL"** → Claude génère le rapport

---

## Types d'entrées

| Déclencheur            | Section       | Ce que Claude fait                              |
|------------------------|---------------|--------------------------------------------------|
| (message normal)       | Activités     | Formate + horodate                              |
| `ÉVÉNEMENT` / `EVENT`  | Événements    | Pose 3 questions : description, lieu, photos    |
| `QUANTITÉ` / `QTÉ`     | Quantités     | Pose 2 questions : item facturable, quantité    |
| `RAPPORT FINAL`        | —             | Génère le rapport complet de la journée         |

---

## Roadmap

- [x] v1.0 — Prompt de base, notes vocales, horodatage
- [x] v2.0 — 3 sections, commandes vocales, lexique, rapport fin de journée
- [ ] v3.0 — Stockage persistant (Google Drive ou repo Git par chantier)
- [ ] v4.0 — Rapport .docx avec logo, en-tête compagnie, infos client
- [ ] v5.0 — Intégration CRM pour infos client automatiques
- [ ] v6.0 — Interface web pour navigation et modification des entrées

---

## Mettre à jour le prompt

Voir les instructions en bas de `journal-chantier-prompt.md`.
Toujours versionner + pousser avant de notifier l'équipe.
