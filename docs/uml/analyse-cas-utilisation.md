# Analyse des cas d'utilisation — Vélona (Phase 1)

Ce document recense les acteurs et les cas d'utilisation identifiés à partir de l'analyse du code source (routes API, pages React, migrations PostgreSQL). Aucun diagramme n'est généré à ce stade.

---

## 1. Acteurs identifiés

Quatre acteurs ont été confirmés après vérification dans le code :

| Acteur              | Rôle dans la base       | Preuve dans le code                                                                                                                                       |
| ------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Visiteur**        | Aucun (non authentifié) | Routes publiques dans `server/src/routes/public.js` sans `requireAuth`                                                                                    |
| **Client connecté** | `role = 'client'`       | Table `users`, routes protégées par `requireAuth('client')` dans `server/src/routes/client.js`, pages sous `client/src/pages/client/`                     |
| **Administratrice** | `role = 'admin'`        | Table `users`, routes protégées par `requireAuth('admin')` dans `server/src/routes/admin.js`, pages sous `client/src/pages/admin/` (cockpit)              |
| **Cuisine**         | `role = 'kitchen'`      | Table `users`, routes protégées par `requireAuth('kitchen', 'admin')` dans `server/src/routes/kitchen.js`, page `client/src/pages/kitchen/KitchenApp.jsx` |

> **Note sur les permissions croisées :** Les routes cuisine utilisent `requireAuth('kitchen', 'admin')`, donc l'Administratrice peut également accéder à toutes les routes cuisine. La route `/api/files/:name` utilise `requireAuth()` (tout utilisateur authentifié) ; un client ne voit que ses propres photos, tandis que l'Administratrice et la Cuisine voient toutes les photos.

---

## 2. Cas d'utilisation par acteur

### 2.1 Visiteur (non connecté)

| #     | Cas d'utilisation                                     | Description courte                                                                           | Condition nécessaire                                                                                                         | Fichiers prouvant l'existence                                                                   | Statut        |
| ----- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------- |
| CU-V1 | S'inscrire                                            | Création d'un compte client avec prénom, nom, email, téléphone, mot de passe et consentement | Email non déjà utilisé, consentement obligatoire, mot de passe ≥ 8 caractères                                                | `server/src/routes/public.js` (POST `/api/auth/register`), `client/src/pages/public/Auth.jsx`   | ✅ Implémenté |
| CU-V2 | Se connecter                                          | Authentification email/mot de passe                                                          | Compte actif, identifiants corrects                                                                                          | `server/src/routes/public.js` (POST `/api/auth/login`), `server/src/lib/auth.js` (`checkLogin`) | ✅ Implémenté |
| CU-V3 | Faire le test de vitalité                             | Questionnaire de 12 questions, calcul d'un score                                             | Réponses valides (12 entiers 0-3)                                                                                            | `server/src/routes/public.js` (POST `/api/public/vitality`), `client/src/pages/public/Test.jsx` | ✅ Implémenté |
| CU-V4 | Mettre à jour ses coordonnées sur un test de vitalité | Associe prénom et contact à un test récent                                                   | Test créé il y a moins de 24h ; prénom et contact obligatoires dans le corps de la requête ; aucune authentification requise | `server/src/routes/public.js` (POST `/api/public/vitality/:id/contact`)                         | ✅ Implémenté |
| CU-V5 | Consulter les paramètres publics                      | Récupère infos cabinet, tarifs, paiement, livraison                                          | Aucun                                                                                                                        | `server/src/routes/public.js` (GET `/api/public/settings`)                                      | ✅ Implémenté |
| CU-V6 | Consulter les créneaux disponibles                    | Liste des créneaux de rendez-vous libres                                                     | Aucun                                                                                                                        | `server/src/routes/public.js` (GET `/api/public/slots`, fonction `availableSlots`)              | ✅ Implémenté |

### 2.2 Client connecté

| #      | Cas d'utilisation                                | Description courte                                                                   | Condition nécessaire                                               | Fichiers prouvant l'existence                                                                                                                      | Statut        |
| ------ | ------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| CU-C1  | Se déconnecter                                   | Termine la session                                                                   | Être connecté                                                      | `server/src/routes/public.js` (POST `/api/auth/logout`)                                                                                            | ✅ Implémenté |
| CU-C2  | Consulter son profil utilisateur                 | Infos compte (email, téléphone, nom)                                                 | Être connecté                                                      | `server/src/routes/public.js` (GET `/api/auth/me`)                                                                                                 | ✅ Implémenté |
| CU-C3  | Changer son mot de passe                         | Modification avec vérification du mot de passe actuel                                | Mot de passe actuel correct, nouveau ≥ 8 caractères                | `server/src/routes/public.js` (POST `/api/auth/password`), `client/src/pages/client/Profil.jsx`                                                    | ✅ Implémenté |
| CU-C4  | Consulter son tableau de bord                    | Vue d'ensemble : programme, check-ins, prochain RDV, abonnement, factures, messages  | Être connecté                                                      | `server/src/routes/client.js` (GET `/api/me/dashboard`), `client/src/pages/client/Home.jsx`                                                        | ✅ Implémenté |
| CU-C5  | Consulter et modifier sa fiche de renseignements | Informations personnelles, antécédents, habitudes, allergies                         | Être connecté                                                      | `server/src/routes/client.js` (GET/PUT `/api/me/profile`), `client/src/pages/client/Profil.jsx` (Fiche), `client/src/pages/shared/ProfileForm.jsx` | ✅ Implémenté |
| CU-C6  | Envoyer un check-in hebdomadaire                 | Relevé de poids, taille, énergie, sommeil, glycémie, tension, note, photo            | Max 3 check-ins par jour, au moins une valeur renseignée           | `server/src/routes/client.js` (GET/POST `/api/me/checkins`), `client/src/pages/client/Suivi.jsx` (Checkin)                                         | ✅ Implémenté |
| CU-C7  | Consulter l'historique des check-ins             | Liste des relevés passés avec notes de révision d'Annick                             | Être connecté                                                      | `server/src/routes/client.js` (GET `/api/me/checkins`), `client/src/pages/client/Suivi.jsx`                                                        | ✅ Implémenté |
| CU-C8  | Consulter son menu de la semaine                 | Plats assignés par jour et créneau, préparés par Annick                              | Être connecté                                                      | `server/src/routes/client.js` (GET `/api/me/menu`), `client/src/pages/client/Menus.jsx`                                                            | ✅ Implémenté |
| CU-C9  | Gérer son abonnement repas                       | Choix de formule, jours de livraison, adresse, quartier, instructions, pause/reprise | Être connecté                                                      | `server/src/routes/client.js` (GET/PUT `/api/me/meals`), `client/src/pages/client/Menus.jsx` (Repas)                                               | ✅ Implémenté |
| CU-C10 | Consulter ses prochaines livraisons              | Liste des commandes de repas à venir                                                 | Être connecté, abonnement actif                                    | `server/src/routes/client.js` (GET `/api/me/meals`), `client/src/pages/client/Menus.jsx` (Repas)                                                   | ✅ Implémenté |
| CU-C11 | Consulter ses rendez-vous                        | Liste des RDV passés et à venir                                                      | Être connecté                                                      | `server/src/routes/client.js` (GET `/api/me/appointments`)                                                                                         | ✅ Implémenté |
| CU-C12 | Réserver un rendez-vous                          | Choix créneau, type (bilan/suivi), format (cabinet/visio), note                      | Créneau disponible, format et type valides                         | `server/src/routes/client.js` (POST `/api/me/appointments`), `client/src/pages/client/Rdv.jsx`                                                     | ✅ Implémenté |
| CU-C13 | Annuler un rendez-vous                           | Annulation possible jusqu'à 12h avant                                                | RDV confirmé, délai respecté                                       | `server/src/routes/client.js` (POST `/api/me/appointments/:id/cancel`), `client/src/pages/client/Rdv.jsx`                                          | ✅ Implémenté |
| CU-C14 | Échanger des messages avec Annick                | Envoi et réception de messages, photos optionnelles                                  | Être connecté                                                      | `server/src/routes/client.js` (GET/POST `/api/me/messages`), `client/src/pages/shared/Chat.jsx`                                                    | ✅ Implémenté |
| CU-C15 | Consulter ses factures                           | Liste des factures avec statut et montant                                            | Être connecté                                                      | `server/src/routes/client.js` (GET `/api/me/invoices`), `client/src/pages/client/Profil.jsx` (Factures)                                            | ✅ Implémenté |
| CU-C16 | Déclarer un paiement                             | Indique moyen et référence de transaction pour une facture en attente                | Facture en attente, méthode valide, référence requise sauf espèces | `server/src/routes/client.js` (POST `/api/me/invoices/:id/declare`), `client/src/pages/client/Profil.jsx` (DeclareModal)                           | ✅ Implémenté |
| CU-C17 | Consulter les semaines disponibles               | Semaines navigables pour les menus                                                   | Être connecté                                                      | `server/src/routes/client.js` (GET `/api/me/next-weeks`)                                                                                           | ✅ Implémenté |

### 2.3 Administratrice (cockpit)

| #      | Cas d'utilisation                           | Description courte                                                                                       | Condition nécessaire                           | Fichiers prouvant l'existence                                                                                                                                              | Statut        |
| ------ | ------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| CU-A1  | Consulter le tableau de bord cockpit        | KPIs, revenus, rendez-vous, alertes, check-ins en attente                                                | Rôle admin                                     | `server/src/routes/admin.js` (GET `/api/admin/dashboard`), `client/src/pages/admin/Dashboard.jsx`                                                                          | ✅ Implémenté |
| CU-A2  | Gérer la liste des clients                  | Recherche, affichage détaillé, activation/désactivation                                                  | Rôle admin                                     | `server/src/routes/admin.js` (GET/POST `/api/admin/clients`, GET/PUT `/api/admin/clients/:id`), `client/src/pages/admin/Clients.jsx`, `client/src/pages/admin/Dossier.jsx` | ✅ Implémenté |
| CU-A3  | Créer un client                             | Création de compte client par l'Administratrice avec mot de passe temporaire                             | Email non utilisé                              | `server/src/routes/admin.js` (POST `/api/admin/clients`)                                                                                                                   | ✅ Implémenté |
| CU-A4  | Réinitialiser le mot de passe d'un client   | Génère un mot de passe temporaire                                                                        | Client existe                                  | `server/src/routes/admin.js` (POST `/api/admin/clients/:id/reset-password`)                                                                                                | ✅ Implémenté |
| CU-A5  | Rédiger une consultation (fiche praticien)  | Bilan nutritionnel avec mesures, observations, conclusion, programme prescrit                            | Client existe                                  | `server/src/routes/admin.js` (POST/PUT `/api/admin/clients/:id/consultations`, `/api/admin/consultations/:id`), `client/src/pages/admin/Dossier.jsx`                       | ✅ Implémenté |
| CU-A6  | Créer un programme client                   | Définition objectif, durée (30/60/90 jours), métrique, valeurs de départ et cible, génération de facture | Client existe                                  | `server/src/routes/admin.js` (POST `/api/admin/clients/:id/programs`), `client/src/pages/admin/Dossier.jsx`                                                                | ✅ Implémenté |
| CU-A7  | Modifier un programme                       | Changement objectif, métrique, valeurs, statut, date de fin                                              | Programme existe                               | `server/src/routes/admin.js` (PUT `/api/admin/programs/:id`)                                                                                                               | ✅ Implémenté |
| CU-A8  | Consulter les check-ins                     | Liste des check-ins clients, filtre non révisés                                                          | Rôle admin                                     | `server/src/routes/admin.js` (GET `/api/admin/checkins`), `client/src/pages/admin/Inbox.jsx` (Checkins)                                                                    | ✅ Implémenté |
| CU-A9  | Réviser un check-in                         | Ajoute une note de révision, envoie optionnellement un message au client                                 | Check-in existe                                | `server/src/routes/admin.js` (POST `/api/admin/checkins/:id/review`)                                                                                                       | ✅ Implémenté |
| CU-A10 | Gérer la bibliothèque de repas              | CRUD des repas (nom, description, type, tags, profils, ingrédients, actif)                               | Rôle admin                                     | `server/src/routes/admin.js` (GET/POST/PUT `/api/admin/meals`), `client/src/pages/admin/Meals.jsx`                                                                         | ✅ Implémenté |
| CU-A11 | Gérer les menus par client                  | Création/modification de menu hebdomadaire, copie de la semaine précédente                               | Client existe                                  | `server/src/routes/admin.js` (GET/PUT/POST `/api/admin/clients/:id/menu`), `client/src/pages/admin/Meals.jsx`                                                              | ✅ Implémenté |
| CU-A12 | Gérer l'abonnement repas d'un client        | Modification formule, jours, adresse, statut                                                             | Client existe                                  | `server/src/routes/admin.js` (PUT `/api/admin/clients/:id/subscription`)                                                                                                   | ✅ Implémenté |
| CU-A13 | Gérer l'agenda                              | Création et modification de rendez-vous, changement de statut                                            | Rôle admin                                     | `server/src/routes/admin.js` (GET/POST/PUT `/api/admin/appointments`), `client/src/pages/admin/Agenda.jsx`                                                                 | ✅ Implémenté |
| CU-A14 | Gérer les disponibilités                    | Définition des créneaux d'ouverture par jour de la semaine                                               | Rôle admin                                     | `server/src/routes/admin.js` (GET/PUT `/api/admin/availability`)                                                                                                           | ✅ Implémenté |
| CU-A15 | Gérer la messagerie admin                   | Conversations, envoi de messages aux clients avec notification email                                     | Rôle admin                                     | `server/src/routes/admin.js` (GET `/api/admin/conversations`, GET/POST `/api/admin/clients/:id/messages`), `client/src/pages/admin/Inbox.jsx` (Conversations)              | ✅ Implémenté |
| CU-A16 | Gérer les factures                          | CRUD des factures, confirmation de paiement, rejet, annulation                                           | Rôle admin                                     | `server/src/routes/admin.js` (GET/POST/POST/POST/POST `/api/admin/invoices`), `client/src/pages/admin/Invoices.jsx`                                                        | ✅ Implémenté |
| CU-A17 | Consulter les prospects (tests de vitalité) | Liste des tests de vitalité récents avec conversion client                                               | Rôle admin                                     | `server/src/routes/admin.js` (GET `/api/admin/leads`), `client/src/pages/admin/Inbox.jsx` (Leads)                                                                          | ✅ Implémenté |
| CU-A18 | Gérer les paramètres système                | Cabinet, tarifs, paiement, agenda, livraison, messagerie                                                 | Rôle admin                                     | `server/src/routes/admin.js` (GET/PUT `/api/admin/settings`), `client/src/pages/admin/Settings.jsx`                                                                        | ✅ Implémenté |
| CU-A19 | Gérer le personnel                          | Création et activation/désactivation des comptes admin et cuisine                                        | Rôle admin, ne peut pas se désactiver soi-même | `server/src/routes/admin.js` (GET/POST/PUT `/api/admin/staff`)                                                                                                             | ✅ Implémenté |
| CU-A20 | Consulter les logs d'emails                 | Historique des emails envoyés                                                                            | Rôle admin                                     | `server/src/routes/admin.js` (GET `/api/admin/emails`)                                                                                                                     | ✅ Implémenté |

> **Note : accès cuisine.** Les routes cuisine utilisent `requireAuth('kitchen', 'admin')`, donc l'Administratrice peut également accéder aux fonctionnalités cuisine (CU-K1 à CU-K6) via les mêmes routes API.

### 2.4 Cuisine

| #     | Cas d'utilisation                      | Description courte                                                  | Condition nécessaire                        | Fichiers prouvant l'existence                                                                                         | Statut        |
| ----- | -------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------- |
| CU-K1 | Générer les commandes de la semaine    | Création des commandes repas à partir des abonnements et menus      | Rôle kitchen ou admin                       | `server/src/routes/kitchen.js` (POST `/api/kitchen/generate`), `client/src/pages/kitchen/KitchenApp.jsx` (Production) | ✅ Implémenté |
| CU-K2 | Consulter les commandes d'une date     | Liste des commandes avec détails clients, allergies, plats          | Rôle kitchen ou admin                       | `server/src/routes/kitchen.js` (GET `/api/kitchen/orders`)                                                            | ✅ Implémenté |
| CU-K3 | Mettre à jour le statut d'une commande | Changement statut (à préparer, prêt, en livraison, livré, incident) | Commande existe, note requise pour incident | `server/src/routes/kitchen.js` (PUT `/api/kitchen/orders/:id`), `client/src/pages/kitchen/KitchenApp.jsx` (OrderList) | ✅ Implémenté |
| CU-K4 | Mise à jour en lot des commandes       | Changement de statut pour toutes les commandes d'une date           | Rôle kitchen ou admin                       | `server/src/routes/kitchen.js` (POST `/api/kitchen/orders/bulk`)                                                      | ✅ Implémenté |
| CU-K5 | Consulter la liste de courses          | Ingrédients agrégés par portion pour une période                    | Rôle kitchen ou admin                       | `server/src/routes/kitchen.js` (GET `/api/kitchen/shopping`), `client/src/pages/kitchen/KitchenApp.jsx` (Courses)     | ✅ Implémenté |
| CU-K6 | Identifier les abonnés sans menu       | Clients abonnés actifs sans menu pour la semaine                    | Rôle kitchen ou admin                       | `server/src/routes/kitchen.js` (GET `/api/kitchen/missing`)                                                           | ✅ Implémenté |

### 2.5 Cas d'utilisation partagés (plusieurs acteurs authentifiés)

| #     | Cas d'utilisation             | Description courte                               | Acteurs concernés                         | Condition nécessaire                                                                            | Fichiers prouvant l'existence                           | Statut        |
| ----- | ----------------------------- | ------------------------------------------------ | ----------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------- |
| CU-S1 | Accéder aux fichiers (photos) | Récupération des photos de check-ins et messages | Client connecté, Administratrice, Cuisine | Authentifié ; clients voient seulement leurs propres photos, l'équipe (admin/cuisine) voit tout | `server/src/routes/kitchen.js` (GET `/api/files/:name`) | ✅ Implémenté |

> **Note sur l'accès aux photos (CU-S1) :** La route `GET /api/files/:name` est protégée par `requireAuth()` (tout utilisateur authentifié). Un client ne peut accéder qu'à ses propres photos (vérification via `client_id` dans `checkins` et `messages`). L'Administratrice et la Cuisine n'ont pas cette restriction et peuvent accéder à toutes les photos.

---

## 3. Analyse des cas d'utilisation généraux et doublons

### 3.1 Cas d'utilisation jugés pertinents tels quels

Les cas d'utilisation suivants pourraient paraître généraux mais recouvrent une fonctionnalité cohérente et unitaire dans le code. Aucune séparation n'est proposée :

- **CU-A2 « Gérer la liste des clients »** : regroupe recherche, affichage détaillé et activation/désactivation, tous portés par les mêmes routes `/api/admin/clients` et la même page `Clients.jsx`.
- **CU-A10 « Gérer la bibliothèque de repas »** : regroupe le CRUD complet des repas sur les mêmes routes `/api/admin/meals` et la même page `Meals.jsx`.
- **CU-A16 « Gérer les factures »** : regroupe CRUD, confirmation, rejet et annulation sur les mêmes routes `/api/admin/invoices` et la même page `Invoices.jsx`.

### 3.2 Doublons identifiés

Aucun doublon n'a été identifié entre les cas d'utilisation. Chaque cas d'utilisation couvre une fonctionnalité distincte :

- CU-C4 (tableau de bord client) et CU-A1 (tableau de bord cockpit) sont des vues distinctes pour des acteurs différents.
- CU-C7 (historique des check-ins client) et CU-A8 (consultation des check-ins admin) sont des vues distinctes pour des acteurs différents.
- CU-C8 (menu client) et CU-A11 (menus par client admin) sont des vues distinctes pour des acteurs différents.
- CU-C9/CU-C10 (abonnement et livraisons client) et CU-A12 (abonnement admin) sont des vues distinctes pour des acteurs différents.

---

## 4. Fonctionnalités non confirmées ou incomplètes

Après analyse du code, les points suivants méritent attention :

1. **Test de vitalité pour utilisateur non connecté** : La route `POST /api/public/vitality` accepte `req.user` optionnel (`req.user ? req.user.id : null`), donc un visiteur non connecté peut faire le test. Cependant, il n'y a pas de page client dédiée visible pour un visiteur non authentifié dans `client/src/pages/public/` (seulement `Test.jsx` existe). À vérifier côté frontend.

2. **Page "À propos", "Contact", "Méthode", "Programmes"** : Existent dans `client/src/pages/public/` mais n'ont pas de route API correspondante dans `server/src/routes/public.js`. Ce sont des pages statiques d'information.

3. **Pas de rôle "Cuisine" distinct dans l'interface admin** : La route `POST /api/admin/staff` permet de créer des comptes `admin` ou `kitchen`, mais il n'y a pas d'interface dédiée pour la cuisine dans l'admin (le lien `/cuisine` mène à `KitchenApp.jsx` séparé).

4. **Pas de paiement en ligne** : Les paiements sont déclarés manuellement par le client (mvola, orange_money, airtel_money, espèces, virement) et confirmés par Annick. Aucun intégration avec un prestataire de paiement en ligne n'est présente.

5. **Pas de notification push/SMS** : Seules les notifications par email sont implémentées (via `server/src/lib/mailer.js`).

6. **Réponse automatique aux messages** : Implémentée côté serveur (`s.messaging.auto_reply`) mais limitée à une réponse automatique par jour.

---

## 5. Récapitulatif des fichiers sources analysés

### Serveur (API et logique métier)

- `server/src/routes/public.js` — Authentification, test de vitalité, paramètres publics, créneaux
- `server/src/routes/client.js` — Espace client (dashboard, profil, check-ins, menus, repas, RDV, messages, factures)
- `server/src/routes/admin.js` — Cockpit Administratrice (clients, consultations, programmes, check-ins, repas, menus, abonnements, agenda, disponibilités, messagerie, factures, prospects, paramètres, personnel, emails)
- `server/src/routes/kitchen.js` — Espace cuisine (génération commandes, suivi, liste de courses, abonnés sans menu, fichiers)
- `server/src/lib/auth.js` — Gestion des sessions, authentification, contrôle d'accès par rôle
- `server/src/lib/domain.js` — Règles métier (paramètres, formules repas, génération commandes, liste de courses, factures, alertes, photos)
- `server/migrations/001_init.sql` — Schéma de base de données complet

### Client (interface React)

- `client/src/pages/client/` — Home, Menus, Profil, Rdv, Suivi
- `client/src/pages/admin/` — AdminApp, Dashboard, Clients, Dossier, Agenda, Inbox, Meals, Invoices, Settings
- `client/src/pages/kitchen/` — KitchenApp
- `client/src/pages/public/` — Apropos, Auth, Contact, Home, Methode, Programmes, Repas, Test
- `client/src/pages/shared/` — Chat, ProfileForm
- `client/src/lib/auth.js` — Authentification côté client
- `client/src/lib/api.js` — Appels API
- `client/src/lib/router.js` — Routage côté client

---

## 6. Bilan des modifications

| Correction                                                        | Statut | Détail                                                                                                 |
| ----------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| 1. Distinguer Visiteur de Client connecté                         | ✅     | Quatre acteurs distincts : Visiteur, Client connecté, Administratrice, Cuisine                         |
| 2. Déplacer cas d'utilisation publics vers Visiteur               | ✅     | CU-V1 à CU-V6 (inscription, connexion, test vitalité, coordonnées test, paramètres publics, créneaux)  |
| 3. Vérifier propriétaire de mise à jour coordonnées test vitalité | ✅     | CU-V4 appartient au Visiteur (route `POST /api/public/vitality/:id/contact` est publique, sans auth)   |
| 4. Renommer « Annick / Administratrice » en « Administratrice »   | ✅     | Effectué dans la section 1 et section 2.3                                                              |
| 5. Vérifier autorisations administratrice sur routes cuisine      | ✅     | Routes cuisine : `requireAuth('kitchen', 'admin')` → l'Administratrice y a accès (noté en section 2.3) |
| 6. Vérifier droits d'accès aux photos et fichiers                 | ✅     | CU-S1 : clients = leurs photos seulement ; admin/cuisine = toutes les photos (noté en section 2.5)     |
| 7. Examiner cas d'utilisation trop généraux                       | ✅     | CU-A2, CU-A10, CU-A16 jugés cohérents, aucune séparation proposée                                      |
| 8. Vérifier doublons                                              | ✅     | Aucun doublon identifié                                                                                |
| 9. Conserver références fichiers sources et statuts               | ✅     | Toutes les colonnes « Fichiers prouvant l'existence » et « Statut » conservées                         |
| 10. Conserver fonctionnalités non implémentées                    | ✅     | Section 4 conservée inchangée                                                                          |

### Nombre final de cas d'utilisation par acteur

| Acteur          | Nombre de cas d'utilisation | Identifiants   |
| --------------- | --------------------------- | -------------- |
| Visiteur        | 6                           | CU-V1 à CU-V6  |
| Client connecté | 17                          | CU-C1 à CU-C17 |
| Administratrice | 20                          | CU-A1 à CU-A20 |
| Cuisine         | 6                           | CU-K1 à CU-K6  |
| Partagés        | 1                           | CU-S1          |
| **Total**       | **50**                      |                |

**Document généré le 06/11/2026 à partir de l'analyse du code source du projet Vélona.**
</write_to_file>
</read_file>
</write_to_file>
