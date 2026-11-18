# Déploiement — Mes prévisions annuelles

Ordre impératif : base de données, stockage, worker, API et application, puis le lien depuis l'horoscope.

## 1. Supabase (base PostgreSQL)
1. Créer un projet. Noter la chaîne de connexion PostgreSQL.
2. Exécuter `db/schema.sql`, puis les migrations dans l'ordre : `002_paiement.sql`, `003_documents.sql`, `004_annee.sql`.
3. Ne jamais exposer la clé de service côté navigateur.

## 2. Cloudflare R2 (stockage des documents)
1. Créer le bucket `mes-previsions-documents`, privé (pas d'accès public).
2. Créer un jeton d'API R2 avec lecture et écriture sur ce bucket.
3. Noter l'adresse S3 du compte (`https://<id-compte>.r2.cloudflarestorage.com`).

## 3. Railway (worker de production)
1. Créer un service depuis le dépôt Git. Le `Dockerfile` installe Node, Python, Chromium et Piper.
2. Renseigner les variables du worker (voir section 6).
3. Vérifier au démarrage : le message « Worker ASTRAEA démarré » doit apparaître dans les journaux.
4. Piper : vérifier la version et l'URL de la release avant le premier build.

## 4. Vercel (application et API)
1. Importer le dépôt. Framework : Vite.
2. Renseigner les variables de l'API (section 6).
3. Déployer. Tester `GET /api/status` sans jeton : doit répondre 401.

## 5. FedaPay
1. Compte marchand. Commencer par le bac à sable (`FEDAPAY_ENV=sandbox`).
2. Renseigner l'URL du webhook : `https://<domaine>/api/webhooks/fedapay`.
3. Tester un paiement de bout en bout, puis passer en production (`FEDAPAY_ENV=live`).

## 6. Variables d'environnement

| Variable | Où | Rôle |
|---|---|---|
| `DATABASE_URL` | Vercel, Railway | Connexion PostgreSQL (Supabase) |
| `FEDAPAY_SECRET_KEY` | Vercel | Clé secrète FedaPay |
| `FEDAPAY_ENV` | Vercel | `sandbox` ou `live` |
| `PUBLIC_BASE_URL` | Vercel, Railway | Adresse publique du site |
| `R2_ENDPOINT` | Railway | Adresse S3 du compte R2 |
| `R2_ACCESS_KEY_ID` | Railway | Identifiant du jeton R2 |
| `R2_SECRET_ACCESS_KEY` | Railway | Clé secrète du jeton R2 |
| `R2_BUCKET` | Railway | Nom du bucket |
| `RECEIPT_SECRET` | Railway | Clé des codes de vérification (ne jamais changer ensuite) |
| `PIPER_BIN` | Railway | Chemin de Piper (`/opt/piper/piper`) |
| `PIPER_MODEL_PATH` | Railway | Chemin du modèle voix |
| `CHROME_PATH` | Railway | Chemin de Chromium |
| `PYTHON_BIN` | Railway | `python3` |

Ne jamais écrire ces valeurs dans le dépôt. Utiliser `.env.example` comme modèle, sans les valeurs réelles.

## 7. Lien depuis l'horoscope
Dans l'application horoscope, ajouter un onglet qui ouvre la plateforme dans un nouvel onglet :

```tsx
<a href="https://mes-previsions-annuelles.vercel.app" target="_blank" rel="noopener noreferrer"
   className="bg-purple-800 text-white px-4 py-2 rounded-xl text-sm font-bold">
  Mes prévisions annuelles 2027
</a>
```

Remplacer l'adresse par le domaine définitif.

## 8. Contrôles avant ouverture au public
- `npm run build` réussit.
- Une commande de test en mode date et une autre en mode nom produisent un PDF de 36 pages, sans débordement.
- Le reçu se télécharge et son code se vérifie.
- Un audio se lit correctement.
- Le paiement sandbox passe de bout en bout.
