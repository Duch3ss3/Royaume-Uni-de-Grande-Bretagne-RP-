# Site gouvernemental RP — Royaume-Uni 2308

## 1. Ce que contient le dossier

- `index.html` : page d'accueil
- `actualites.html` : actions du Gouvernement
- `institutions.html` : Couronne, Premier ministre et ministères
- `carte.html` : carte diplomatique interactive
- `journal.html` : lois, décrets et traités
- `css/style.css` : apparence du site
- `js/` : fonctionnement interactif
- `data/news.json` : liste des actualités

## 2. Tester le site sur votre ordinateur

La méthode la plus simple :

1. Décompressez le fichier ZIP.
2. Ouvrez le dossier dans Visual Studio Code.
3. Installez l'extension `Live Server`.
4. Cliquez avec le bouton droit sur `index.html`.
5. Cliquez sur `Open with Live Server`.

Il faut utiliser Live Server, car les actualités sont chargées depuis un fichier JSON.

## 3. Mettre le site sur GitHub Pages

1. Créez un compte GitHub.
2. Cliquez sur `New repository`.
3. Nommez le dépôt : `gouvernement-uk-2308`.
4. Choisissez `Public`.
5. Cliquez sur `Create repository`.
6. Cliquez sur `uploading an existing file`.
7. Envoyez tous les fichiers et dossiers du site.
8. Cliquez sur `Commit changes`.
9. Ouvrez `Settings`.
10. Dans le menu de gauche, ouvrez `Pages`.
11. Dans `Build and deployment`, choisissez `Deploy from a branch`.
12. Sélectionnez la branche `main` et le dossier `/root`.
13. Cliquez sur `Save`.

GitHub affichera ensuite l'adresse du site.

## 4. Ajouter une nouvelle action gouvernementale

Ouvrez `data/news.json`.

Copiez un bloc existant et modifiez :

- `id`
- `date`
- `category`
- `ministry`
- `title`
- `summary`

Catégories déjà prévues :

- `diplomatie`
- `defense`
- `economie`
- `interieur`

Attention : chaque bloc doit être séparé par une virgule, sauf le dernier.

## 5. Modifier les dirigeants

Ouvrez `institutions.html`.

Cherchez `Nom à remplacer`, puis ajoutez les noms de votre souverain et de votre Premier ministre.

## 6. Modifier la carte

Ouvrez `carte.html`.

Chaque zone contient :

- `data-status` : territoire, allie, revendication, ennemi ou neutre
- `data-name` : nom affiché après un clic
- une classe de couleur correspondante

Exemple :

```html
<path class="zone allie" data-status="allie" data-name="Nom du pays" ... />
```

Cette première carte est volontairement stylisée. Une future version pourra utiliser une vraie carte mondiale détaillée.
