import { IIngredientNode } from './IIngredient';
import { IDrink } from './IDrink';
import { IUnitCategory } from './IUnit';

interface IData {
    ingredientTree: Array<IIngredientNode>;
    drinks: Array<IDrink>;
    unitTypes: Array<IUnitCategory>;
}

export {
    IData
};