import { IIngredient } from './IIngredient';
import { IDrink } from './IDrink';

interface IDrinkEvaluation {
    is_exact: boolean; /* whether to put this in the exact category or not */
    name: string; /* name of the drink */
    drink: IDrink; /* the drink itself */
    id: number; /* id of the drink to show details and link to */
    substitutions: any; /* if substitutions were considered, the mappings of `{replaced_ingredient:ingredient_you_have}` goes here.*/
    optionals: Array<IIngredient>; /* If some items were marked as optional, they go in here so we can highlight them to the user when they select the drink*/
    is_valid: boolean; /* Whether to pass this drink for inclusion. False by default. */
    missing: Array<IIngredient>; /* What ingredients are missing. Used to suggest recommended purchases. */
    anchor: string; /* link to main page with substitutions and optionals encoded in it */
}


export { IDrinkEvaluation };