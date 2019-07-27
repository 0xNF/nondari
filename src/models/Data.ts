import { IIngredientNode } from './IIngredient';
import { IDrink } from './IDrink';
import { IUnitCategory } from './IUnit';
import { IRecipe } from './IRecipe';

interface IData {
    ingredientTree: Array<IIngredientNode>;
    drinks: Array<IDrink>;
    recipes: Array<IRecipe>;
    unitTypes: Array<IUnitCategory>;
}

export {
    IData
};