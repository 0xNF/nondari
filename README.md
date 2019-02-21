Nondari
------------------------------

Git repo for https://nondari.netlify.com

Based on the [Webpack 4 + TypeScript Starter](https://github.com/juristr/webpack-typescript-starter) by [Juristr](https://github.com/juristr).

Nondari is primarily a digitization of the book Regarding Cocktails. The aim was to replicate the gorgeous drawings each cocktail had. 

Nondari is capable of dynamically rendering an arbitrary cocktail in a variety of glasses with a number of different garnishes.

## Database Source
All the drink and ingredient information is stored in sqlite file `nondari.db`. Before each `npm run build` or `npm run start`, the `MakeClientJson.py` script launches, which extracts the necessary data from the database into the static `drinks.json` file. If you want to add ingredients or change a drink, you'll need to make the changes in the sqlite file.

## Database Structure

## Structure
The application is split into `/models/` and `/services/`, where services are things that operate on models and manipulate the dom.

## SVG drawing
All SVG draws occur in `SVGService.ts`.

## SVG files
You'll find all svgs under `/src/img/`.

These files were made with [Inkscape](https://inkscape.org/).

### Glasses
Each glass drawing is split into two files a `glass.svg` and a `mask.svg`, where the masksvg details the area that will be filled in with ingredient drawings. If any changes are made to the size or area of a glass, be sure to create a new masking SVG file as well.

### Ingredients
Ingredients are usually 10-by-10 px files detailing a single instance of an ingredient drawing. There are no rows.

Some ingredients like ice or garnishes may be larger, but they have separate drawing rules in the SVGService to account for that.

## How to use

Just clone it and get going.

```
$ git clone https://github.com/0xnf/nondari.git <your-project-name>

# change directory to your project
cd  <your-project-name>

# Maybe remove the `.git` directory and start with a fresh one.

# install all dependencies.
$ npm i

# Start developing and serve your app:
npm start

# Build your app without minification: 
npm run build

# Build your app with minification: 
npm run build.prod

# run unit tests:
npm run test
```