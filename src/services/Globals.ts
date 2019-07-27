import { IDrink } from '../models/IDrink';
import { Category } from '../models/Category';
import { IIngredientNode } from '../models/IIngredient';
import { KVP } from '../models/KVP';
import { IUnitCategory } from '../models/IUnit';
import { IRecipe } from '../models/IRecipe';

interface IGlobal {
    Glasses: Array<string>;
    Drinks: Array<IDrink>;
    Recipes: Array<IRecipe>;
    Categories: Array<Category>;
    IngredientFlat: KVP<IIngredientNode>;
    ingredients: Array<IIngredientNode>;
    UnitTypes: Array<IUnitCategory>;
}

const Globals: IGlobal = {
    Glasses: [],
    Drinks: [],
    Recipes: [],
    Categories: [],
    IngredientFlat: {},
    ingredients: [],
    UnitTypes: [],
};


export {
    Globals
};