## Guide utilisateur — BI Airflow Management

Ce guide explique comment utiliser le site pour gérer les configurations et rapports liés aux traitements de données (Airflow) des clients,
et des rapports powerbi associé aux clients.

Quand vous choisissez un client, l'app montre ses réglages actuels et ses rapports.

## Connexion
- L'accès demande que votre compte soit ajouté dans l’Auth Gateway. Si ce n’est pas le cas, demandez à un admin de vous donner l’accès.
- Une fois ajouté, connectez‑vous avec vos identifiants de travail. Vous serez envoyé automatiquement vers la page d’accueil.

## Sélection d’un client
- Ouvrez le menu « Sélection du client ».
- Choisissez le client à gérer.
- Les informations et rapports de ce client s’affichent.

## Configuration Airflow

Version Docker
- Montre la version du logiciel utilisé.

Expression cron (planification)
- Détermine quand les traitements se lancent automatiquement. 
(juste en bas de ce champs, il y a une traduction lisible pour humains, et un lien pour un site web qui aide)
- Exemple :
  - 0 7 * * * = tous les jours à 07:00
  - 0 9,15 * * * = tous les jours à 09:00 et 15:00

Commutateurs de fonctionnalités (les toggles)
- Activez ou désactivez des fonctionnalités comme « part_events », « performance_loss ».

Configuration personnalisée (toggles encore)
- Entrez un JSON correct pour des besoins précis.
- Exemple : {"custom_feature": true, "threshold": 0.8}

Sauvegarder
- Après vos changements, cliquez sur « Enregistrer la configuration ».
- Un message de confirmation apparaît si tout est correct.

## Rapports Power BI

Affichage
- La table liste les rapports du client (nom, group_id, dataset_id).

Ajouter un rapport
- Cliquez sur « Ajouter un rapport ».
- Saisissez Nom, Group ID, Dataset ID.
- Enregistrez pour l’ajouter.

Supprimer un rapport
- Cliquez sur l’icône de suppression sur la ligne du rapport.
- Une alerte confirme qu’il a été retiré.

## Dépannage

Expression cron invalide
- Utilisez un validateur de cron et vérifiez la syntaxe.

JSON invalide
- Vérifiez les guillemets et les accolades, utilisez un validateur JSON.

## Bonnes pratiques
- Sauvegardez l’état initial (capture d’écran) avant modifications. (il n’y a pas d’historique des anciennes versions)