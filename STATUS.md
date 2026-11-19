# STATUS buildhybridai-signal-guard

Phase: build
Etat: doing
Round: R1
Maj: 2026-11-17 23:20

## opencode

- Idée : ébauche 5 de `../../IDEES.md` ; `IDEE.md` + `SPEC.md` (même squelette Gradle que babel-chip, code indépendant).
- **Repo créé et mergé** : https://github.com/GaiaSG94/buildhybridai-signal-guard (public, MIT, topics, BaptisteFaisy invité, protection main). Clone local : `app/`.
- **V1 livrée** (Kotlin + Views/Material 3) :
  - `engine/Parsing.kt` pur et testé (RISK/TYPE, clamp, niveaux de risque, seuil d'escalade) ; 7 tests JUnit verts.
  - `engine/SignalEngine.kt` : passe locale `ONLY_ON_DEVICE` (score 0-100 + type) puis passe cloud `ONLY_IN_CLOUD` (WHY/REPLY) **uniquement** si risque ≥ 70.
  - `MainActivity.kt` : inbox **fictive** (4 messages écrits à la main, aucune PII réelle), jauge de risque par message, badge ⚡/☁, compteur dans la ligne d'état.
  - CI `android.yml` : tests + assembleDebug + artifact APK ; `google-services.json` git-ignoré.
- Sheet (verrou `agent-gaia`) : taches ideation/repo/code/readme = done ; projets repo + statut build.
- **Prochaine étape** : design (Claude, brief `SPEC.md` §7) → APK sur téléphone → vidéo ≤ 3 min avant le 30/11.
- **Points ouverts (H)** : téléphone Android compatible ; google-services.json dans `app/`.

## Claude

- (design non démarré — brief UI prêt dans `SPEC.md` §7)
- 2026-11-18 : merge queue Mergify réparée (`merge_protections` + `if`, PR #4) ; ajoutée via PR de test de `@Mergifyio queue`.

## opencode - 2026-11-19 (arbitrage R2 -> scaffold web)

- **Plateforme tranchee : Web/Chrome.** Le depot Gradle est gele (branche
  `android-r1`, conservee) ; `main` porte desormais l'app web.
- **Scaffold livre** (TypeScript + Vite + `firebase/ai`) : passe locale
  `PREFER_ON_DEVICE` (RISK/TYPE), escalade `ONLY_IN_CLOUD` au-dela de 70
  (WHY/REPLY), badge LOCAL/CLOUD pilote par `inferenceSource`, page Inbox /
  Message / Paste dans le style Relief verrouille, ligne d'audit mesuree.
- **Verifie** : `npm test` 19/19, `npm run typecheck` propre, `npm run build` OK.
- **Reste a faire** : valeurs Firebase (`.env.local`) + App Check pour la demo
  cloud, test `tools/nano-check` sur le Chrome de Gaia, video <= 3 min
  (`SCRIPT.md` a reecrire pour la version web), hebergement de la demo.
