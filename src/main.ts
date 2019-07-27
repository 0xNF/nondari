import './extensions/array.extensions';
import './extensions/object.extensions';
import './extensions/string.extensions';
import { constructCategories } from './services/CategoryService';
import { DrawSidebar, populateIngredientTree, showYourDrinks, toggleDrinkList, EliminatePantry, DrawCustom, DrawMainList } from './services/DisplayService';
import { calculateDrinks as cd, constructDrinks } from './services/DrinkService';
import { constructGlasses } from './services/GlassService';
import { Globals } from './services/Globals';
import { constructIngredients, GetRecommendedIngredients } from './services/IngredientService';
import { decodeDrinkNav, findPage, locationHashChanged, PageTypes } from './services/NavigationService';
import { INavObject } from './models/INavigationObject';
import { IIngredientNode } from './models/IIngredient';
import { KVP } from './models/KVP';
import { SearchObject } from './models/SearchObject';
import { SelectedDrinkObject } from './models/SelectedDrinkObject';
import { DownloadMainJson } from './services/DownloadService';
import { StorageGetPantryItems } from './services/StorageService';
import { setCategoryType, setDrinkName, setGlassType, BuilderDraw, addIngredient, CreateDrink, DecodeDrink, setInstructions, setPrelude, InitBuilder, CancelIngredientAdd, RevealIngredientAdd } from './services/BuilderService';
import { IData } from './models/Data';
import { constructRecipes } from './services/RecipeService';

// -- Global Variables --\\
const NavObj: INavObject = {
    currentPage: 'drink',
    q: new URLSearchParams(''),
};

function requireX(an: number, f: (b: boolean) => void) {
    if (an === 0 || an === 1) {
        const b: boolean = an === 1;
        f(b);
    } else {
        console.error('Error converting value to number, got ' + an);
    }
}
function considerSubstitutions(val: string) {
    const an = parseInt(val);
    requireX(an, (b: boolean) => { SearchObject.ConsiderSubstitutions = b; });
}
function requireGarnish(val: string) {
    const an = parseInt(val);
    requireX(an, (b) => { SearchObject.RequireGarnish = b; });
}
function requireCube(val: string) {
    const an = parseInt(val);
    requireX(an, (b) => { SearchObject.RequireCube = b; });
}
function requireRinse(val: string) {
    const an = parseInt(val);
    requireX(an, (b) => { SearchObject.RequireRinse = b; });
}
function requireSplash(val: string) {
    const an = parseInt(val);
    requireX(an, (b) => { SearchObject.RequireSplash = b; });
}
function requireSpray(val: string) {
    const an = parseInt(val);
    requireX(an, (b) => { SearchObject.RequireSpray = b; });
}
function requireBitters(val: string) {
    const an = parseInt(val);
    requireX(an, (b) => { SearchObject.RequireBitters = b; });
}
function requirePinch(val: string) {
    const an = parseInt(val);
    requireX(an, (b) => { SearchObject.RequirePinch = b; });
}
function requireFloat(val: string) {
    const an = parseInt(val);
    requireX(an, (b) => { SearchObject.RequireFloat = b; });
}

function calculateDrinks() {
    const resobj = cd(SearchObject.Inventory, Globals.Drinks, Globals.IngredientFlat);
    showYourDrinks(resobj);
    GetRecommendedIngredients(resobj);
}

function RestorePantryItems() {
    const iarr: Array<IIngredientNode> = StorageGetPantryItems();
    iarr.forEach((x) => {
        SearchObject._InventoryIds.push(x.id);
        SearchObject.Inventory.push(x);
    });
}


async function main(json: IData) {

    /* Get the basic data structures */

    // Populating Ingredient Tree
    const ingFetch: [Array<IIngredientNode>, KVP<IIngredientNode>] = constructIngredients(json.ingredientTree);
    ingFetch[0].forEach(x => Globals.ingredients.push(x));
    Globals.IngredientFlat = ingFetch[1];

    // Unique, Sorted Glasses
    constructGlasses(json.drinks).forEach(x => Globals.Glasses.push(x));

    // Unique, Sorted Categories
    constructCategories(json.drinks).forEach(x => Globals.Categories.push(x));

    // Unique, in-order Drinks
    constructDrinks(json.drinks).forEach(x => Globals.Drinks.push(x));

    // Unique, in-order Recipes
    constructRecipes(json.recipes).forEach(x => Globals.Recipes.push(x));

    // Unit Categories
    json.unitTypes.forEach(x => Globals.UnitTypes.push(x));

    /* Draw to the screen */
    DrawSidebar(Globals.Categories, Globals.Drinks);

    /* Restore user-saved globals */
    RestorePantryItems();

    const thispage: string = findPage().toLocaleLowerCase();
    if (thispage === 'drinks') {
        if (window.location.hash.any() || window.location.search.any()) {
            $('#drinkNoDrink').addClass('hidden');
            $('#drinkBase').removeClass('hidden');
        } else {
            DrawMainList(Globals.Categories, Globals.Drinks);

        }
        if (window.location.search.any()) {
            decodeDrinkNav(window.location.search, Globals.Drinks, Globals.IngredientFlat, NavObj, SelectedDrinkObject); // TEST
        }
    } else if (thispage === PageTypes.Pantry) {
        populateIngredientTree(Globals.ingredients, SearchObject);
    } else if (thispage === 'builder') {
        InitBuilder();
        await BuilderDraw();
    } else if (thispage === 'custom') {
        await DrawCustom();
    }
    window.onhashchange = locationHashChanged;
    locationHashChanged();
}

async function m2() {
    const maindata = await DownloadMainJson();
    await main(maindata);
}

m2();

/* we expose the following things to the browser window */
export {
    requireBitters,
    requireCube,
    requireFloat,
    requireGarnish,
    requirePinch,
    requireRinse,
    requireSplash,
    requireSpray,
    considerSubstitutions,
    calculateDrinks,
    toggleDrinkList,
    EliminatePantry,
    setCategoryType,
    setGlassType,
    setDrinkName,
    setPrelude,
    setInstructions,
    addIngredient,
    CreateDrink,
    CancelIngredientAdd,
    RevealIngredientAdd,
};