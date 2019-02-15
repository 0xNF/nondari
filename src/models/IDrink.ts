import { IIngredient } from './IIngredient';
import { ITree } from './ITree';

interface IDrink {
    DrinkId: number;
    Category: string;
    Glass: string;
    Prelude: string;
    Instructions: string;
    Name: string;
    Ingredients: Array<IIngredient>;
}

interface IDrinkNode extends ITree {
    name: string;
}

export { IDrink, IDrinkNode };