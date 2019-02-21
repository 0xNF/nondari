Nondari
------------------------------

Git repo for https://nondari.netlify.com

Based on the [Webpack 4 + TypeScript Starter](https://github.com/juristr/webpack-typescript-starter) by [Juristr](https://github.com/juristr).

Nondari is primarily a digitization of the book Regarding Cocktails. The aim was to replicate the gorgeous drawings each cocktail had. 

Nondari is capable of dynamically rendering an arbitrary cocktail in a variety of glasses with a number of different garnishes.

## Database Source
All the drink and ingredient information is stored in sqlite file `nondari.db`. Before each `npm run build` or `npm run start`, the `MakeClientJson.py` script launches, which extracts the necessary data from the database into the static `drinks.json` file. If you want to add ingredients or change a drink, you'll need to make the changes in the sqlite file.

## Database Structure

### Drinks
`Id` the primary key of the drink. Autoincrement.

`Category` is a string field that will be eventually migrated to a foreign key to a new table. It represents what broad category the drink in question should be thought of as. Some drinks are martinis, others are flips or aperitifs, etc.

`Glass` A string representing the glass type this drink prefers. `Martini`? `Collins`?. etc.

`Prelude` An introduction to the drink, its reason for existing, any special memories connected to it, etc. This is a direct lift from the Regarding Cocktails book, where each drink had its own, sometimes lengthy prelude.

`Instructions` is a string describing how to assemble the drink. This is a free-form unstructured field. It does not matter how or what you write in it.

`Name` the name of the drink. Not the primary key, don't worry about name collisions.


### CategoryTree
All possible ingredients are structured into a tree-like hierarchy. 

`Id` is the primary key of the ingredient.

`Name` is the displayed name of the ingredient

`Parent` is the foreign key to another CategoryTree entry denoting the parent, if any, of this ingredient. Nullable.

`DistanceFromParent` is for calculating substitutions on the Pantry page. 

* DistanceFromParent <= -1 means that this is a stopping node. `Liqueurs` has a distance of -1, for instance. In specific, this means that even if this isn't a strictly root level node, as far as substitution calculations are concerned, you cannot go higher than this.

* DistanceFromParent == 0 means that the ingredient in question is a strict subclass. A name-brand on a type of category or something similar. 'London Dry Gin' is a 0-distance type of 'Dry Gin' for instance, or that El Jimador is a 0-distance type of Tequila Blanco.

* DistanceFromParent >= 1 means that there are substantial similarities between the parent ingredient and this ingredient, but that they aren't strictly the same. `House Orange Bitters` and `Orange Bitters` are close, but not the same. The bigger the distance, the bigger the difference.

`Symbol` is a nullable string noting which SVG document should be associated with this ingredient. If the string is null, Nondari will crawl up the parent tree until it finds an ingredient symbol to use. This means that its easy to instantiate new ingredient subclasses and have Nondari draw them.

`UnitPreference` is for helping the Builder show appropriate units of measurements. Contains a foreign key link to a `UnitType`.


### IngredientsMap

`Quantity` is a string where the acceptable formats are:
* a decimal or integer ('3', '0.25')
* a range of two numbers separated by a dash ('1-2')
* One of three special types ('multiple', 'fill, 'half')

`Unit` is a type that maps to a unitname found in the table `Units`. In the future this will be an id based foreign key.

`IngredientName` is a legacy field that will be removed at some future point. It is unused.

`Display Text` is a nullable field that will *completely* replace the text that an ingredient displays with on the drink screen. Be careful to always include the ingredient in the display text, if you choose to have any at all, otherwise you'll end up with strange instructions like `2 oz or more if required` instead of `2 oz prosecco or more if required`.

`DisplayOrder` takes integers and is used to order the drawing of ingredients. A value of `-1` or lower indicates that the ingredient is required but _not_ drawn, for instance, when lime wedges are muddled in but discarded at the end.

`PreferenceFor`, more accurate `PreferenceOf`, is a foreign key to an `Ingredient` that notes that this ingredient is a direct subclass of a more generally acceptable ingredient. This varies on a drink-by-drink basis. For example, some drinks may specifically call for `Monkey 47 Scharzwald` if you have it, or otherwise any old `London Dry Gin` will do. In that case, this ingredient is a preference for London Dry Gin.

`IsGarnish` is a boolean (`0 for false`, `1 for true`) for whether this particular ingredient is a garnish or not. This is used to draw that ingredient properly.


### Units
The trio of Unit tables (`Units`, `UnitTypes`, `UnitTypeMap`) is purely for facilitating the Builder by making it easy on users to select the appropriate unit for a given type of ingredient. A lime wedge should not be measured in ounces, and cracked ice shouldn't be able to come in slices. Other than that it provides no logical checks elsewhere in the codebase and can be ignored.

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