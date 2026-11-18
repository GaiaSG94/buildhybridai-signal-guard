# IDEE — buildhybridai-signal-guard (Web/Chrome)

Extrait de `../../IDEES.md` (ébauche 5 retenue R1 ; **re-plateformée Android → Web/Chrome en R2, 2026-11-17** : aucun téléphone du duo n'est dans la liste ML Kit des appareils Gemini Nano). Critères : `../../../criteres/index.json#buildhybridai-2026` + `../../FICHE.md` + `CRITERES.md` (généré).

## Pitch (1 phrase)

Boîte de réception de démonstration où Gemini Nano 4 **score localement** chaque message (jauge de risque 0-100) et où le cloud Gemini n'intervient que sur les messages signalés — pour expliquer l'arnaque et rédiger une réponse.

## Problème / cible

Le phishing et les arnaques par message/mail sont massifs, et envoyer ses messages à un service cloud pour les analyser contredit la finalité de l'outil. Cible : personnes qui reçoivent SMS/e-mails de fraudeurs et qui veulent un avis local, immédiat, sans exposition.

## Features

- Inbox de démonstration (jeu de messages **fictifs** écrits à la main, aucun vrai SMS/PII) + champ « coller un message » + extension Chrome qui scanne la sélection.
- Scoring local par message : jauge de risque 0-100, détection d'urgence, d'appel à l'action, de lien masqué, d'allongement du nom de domaine (badge LOCAL + latence).
- Le cloud n'est appelé que pour les messages au-dessus du seuil (Remote Config) : explication de l'arnaque + réponse suggérée (raisonnement affiché, pas un verdict opaque).
- Tableau de bord Firestore (signalements, stats), Authentication (compte), App Check (requis).

## Différenciation

Angle sécurité/privacy cohérent jusqu'au bout : analyse locale d'abord, cloud seulement quand c'est justifié, audit trail visible (« 12 analyses locales, 3 appels cloud »). Domaine distinct de redact-relay (triage d'arnaques entrantes vs assainissement avant partage) et UI tableau de bord distincte des 3 autres projets.

## Risques

- Données de démo fictives obligatoires (zéro PII réelle) → scénario d'arnaque écrit à la main, relu.
- Le scoring local « n'explique » pas (Nano 4 local = verdict court) → l'explication vient du cloud : voulu, mais fallback heuristique local affiché en mode avion.
- Extension Chrome : scan de la sélection uniquement (pas d'accès boîte mail réelle) — périmètre V1 assumé et documenté.

## Livrables visés (critères 1-1)

| Livrable | Plan |
|---|---|
| Repo public GitHub + licence OSS (Apache-2.0) | Firebase AI Logic importé et appelé au runtime (Nano 4 + cloud) |
| Vidéo YouTube publique ≤ 3 min EN | footage Chrome desktop, scoring local puis explication cloud |
| Démo hébergée | web app statique (Firebase Hosting, free tier) + extension |
| Description EN | usage Firebase AI Logic, features, value prop, résumé période |
| Catégorie sélectionnée | Web/Chrome |
