# PAGES — Signal Guard (web app, Chrome desktop 1440 × 900)

Source : `IDEE.md` (features), `SPEC.md` §2-3 (pipeline, seuil 70), `SCRIPT.md` (plans vidéo).
Statut : style **Relief** validé le 2026-11-18. Les quatre planches de `planches/relief/` sont **validées** (2026-11-18).

| # | Page | Rôle | Contenu clé | Plan vidéo | Statut |
|---|---|---|---|---|---|
| 1 | **Inbox** (page principale) | Montrer l'inférence hybride en une seconde : tout est scoré en local, seul le flaggé monte au cloud | Liste des 4 messages fictifs, jauge 0-100 par message, badge LOCAL + latence, marqueur CLOUD sur les messages ≥ 70, bouton « Score the inbox », compteur « N scored · M flagged », audit trail « X local analyses · Y cloud calls », seuil affiché (Remote Config) | 2, 3, 5 | **validée** · `relief/01-inbox.html` |
| 2 | **Message** | Expliquer une arnaque sans faire peur | Message complet, domaine expéditeur en pièce à conviction, signaux détectés localement (urgence, appel à l'action, lien masqué, allongement du domaine), badge LOCAL + latence, explication cloud (raisonnement affiché), réponse suggérée copiable | 4 | **validée** · `relief/02-message.html` |
| 3 | **Paste a message** | Prouver que l'outil marche sur un texte arbitraire | Champ de collage, état « analyse locale en cours », résultat local, escalade cloud si ≥ seuil ; fallback heuristique local en mode avion | — (option) | **validée** · `relief/03-paste.html` |
| 4 | **Dashboard** | Rendre l'impact et la frugalité cloud mesurables | Signalements, stats (analyses locales vs appels cloud, latences, répartition des niveaux) — données Firestore | 6 (option) | **validée** · `relief/04-dashboard.html` |

## Questions produit ouvertes (je ne tranche pas)

1. **Extension Chrome** (« scanne la sélection », `IDEE.md`) : faut-il une planche dédiée (popup de l'extension) ? Elle n'est pas dans la liste de départ.
2. **Authentication** (compte) : un écran de connexion est-il attendu dans la démo, ou le compte reste-t-il invisible (anonyme) ?
3. **Mode avion / fallback heuristique** : état à montrer sur la page Paste uniquement, ou aussi sur l'Inbox ?
4. **Inbox** : 4 messages (`SPEC.md`) suffisent-ils, ou en écrivez-vous d'autres ? Les planches utilisent les 4 existants, sans en inventer.
