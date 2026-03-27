# Specs — Rapport de Fin de Journée

**Version:** 1.0.0
**Statut:** En cours de définition

---

## Format de sortie cible
- **Format :** .docx
- **Générateur :** À définir (python-docx via script, ou outil Claude)

---

## En-tête (page 1)

| Zone             | Contenu                          | Statut         |
|------------------|----------------------------------|----------------|
| Haut gauche      | Logo de la compagnie             | À intégrer     |
| Sous logo        | Adresse de la compagnie          | À définir      |
| Haut droite      | Date du rapport                  | Auto           |
| Haut droite      | Nom du chantier / No. de projet  | Auto           |

---

## Bloc Client

| Champ            | Source actuelle   | Source future      |
|------------------|-------------------|--------------------|
| Nom du contact   | Saisie manuelle   | CRM (à intégrer)   |
| Adresse          | Saisie manuelle   | CRM (à intégrer)   |
| No. de contrat   | Saisie manuelle   | CRM (à intégrer)   |

---

## Corps du rapport

### Section 1 — Activités
Liste chronologique de toutes les entrées de la journée.

### Section 2 — Événements
Chaque événement sur sa propre zone avec :
- Horodatage
- Description
- Emplacement
- Référence photos (les photos sont attachées séparément)

### Section 3 — Quantités
Tableau récapitulatif :
| Heure | Item | Quantité | Unité |

---

## Pied de page
- Nom et signature du responsable de chantier
- Date
- "Rapport généré le [date] — [Nom de la compagnie]"

---

## Informations compagnie

- **Nom :** Maestro Mobilité
- **Adresse :** 7441 rue Boyer, Montréal, Québec, H2R 2R9
- **Logo :** `assets/logo-maestro.png` (fond blanc, PNG)

## À définir
- [ ] Template Word de base (.dotx)
- [ ] Champs CRM à connecter (éventuellement)
