# SPEC — buildhybridai-signal-guard

Date : 2026-11-17. Idée : `IDEE.md`. Critères : `CRITERES.md` (généré).
Repo : https://github.com/GaiaSG94/buildhybridai-signal-guard (clone : `app/`).

## 1. Architecture

- **Stack** : Kotlin 2.4, Android Views + Material 3, Gradle 8.13 + AGP 8.8, JUnit — même squelette de build que babel-chip, code indépendant (package `com.gaia.signalguard`).
- **Firebase AI Logic Android** (`firebase-ai` 18.2.0 + `firebase-ai-ondevice` 16.0.0-beta08) :
  - passe locale `OnDeviceConfig(mode = ONLY_ON_DEVICE)` : score de risque 0-100 + type (`RISK:` / `TYPE:`), **sans réseau** ;
  - passe cloud `OnDeviceConfig(mode = ONLY_IN_CLOUD)` : explication + réponse suggérée (`WHY:` / `REPLY:`), **seulement si risque ≥ 70** ;
  - backend Gemini Developer API free tier, modèle `gemini-3.5-flash-lite` ; App Check debug.
- Inbox **100 % fictive** codée en dur (4 messages, zéro PII réelle) — garde-fou de l'idée.

## 2. Pipeline (purement testable)

1. `Prompts.buildLocalPrompt` → `Parsing.parseLocalOutput` → `LocalScore(risk, type)` + `level` (LOW < 35 ≤ MEDIUM < 70 ≤ HIGH).
2. `Parsing.needsEscalation(score, 70)` → passe cloud sur les messages dangereux uniquement.
3. `Parsing.parseCloudOutput` → `why` + `reply` (lignes vides = null).
4. `ScoredMessage` = id + sender + body + score + source + latence + why + reply.

## 3. Écrans

| Écran | Contenu |
|---|---|
| Header | Titre + ligne d'état ( prêt / Firebase non configuré / « N scored, M flagged » ) |
| Flux | Message (sender + corps), jauge de risque 0-100, méta (badge ⚡/☁, latence, niveau), explication cloud en rouge, réponse suggérée |
| Action | Bouton « Score the inbox » |

## 4. Intégrations imposées (critères 1-1)

| Critère | Implémentation |
|---|---|
| Firebase AI Logic au runtime | `engine/SignalEngine.kt` |
| Inférence hybride (thème) | score local systématique, cloud conditionnel et affiché |
| App Check | `FirebaseAppCheck` + debug provider |
| Plateforme | Android (catégorie « Best Android $3 000 » + Grand Prix) |
| Repo public + licence OSS | MIT dans About |
| Vidéo ≤ 3 min | `SCRIPT.md` (inbox fictive → scan → explication cloud) |
| Description EN | README EN + Devpost |
| Démo | APK de test produit par la CI (artifact `signal-guard-apk`) |
| Pas de secrets / pas de PII | `google-services.json` git-ignoré ; inbox fictive en dur |

## 5. Plan de test

- **Unitaires** : 7 tests JUnit (score, niveaux, clamp/valeurs invalides, sections manquantes, seuil d'escalade, explication cloud, lignes vides).
- **CI** : `android.yml` — tests + assembleDebug + artifact APK, timeout 5 min.
- **Manuel** : scan de l'inbox, bulle escaladée, messages bénins 100 % locaux.

## 6. Limites connues

- Mêmes limites on-device que babel-chip (expérimental, single-turn, EN/KO validés).
- Inbox fictive et codée en dur (volontaire : aucune ingestion de vrais SMS en V1).
- Le score est une estimation du modèle, affichée comme telle.

## 7. Brief UI (étape 6, pour Claude)

- **Ton** : tableau de bord sécurité sobre ; le contraste ⚡ local / ☁ cloud doit se lire en une seconde.
- **Palette** : Material 3 ; danger `#B3261E`, ⚡ `#3ddc84`, ☁ `#ffb454`, fond sombre.
- **Signatures visuelles** : jauges de risque qui se remplissent en masse au scan (moment signature), compteur « scored / flagged ».
- **Interdits** : logos tierces, emoji décoratifs, gradients criards, vraies captures de SMS.
- **Contraintes** : capture 16:9, anglais, contrastes AA.
