import { IIngredient } from './IIngredient';

interface IRecipe {
    RecipeId: number;
    IngredientId: number;
    Name: string;
    Instructions: string;
    ShelfLife: number;
    Ingredients: Array<IIngredient>;
}


export { IRecipe }