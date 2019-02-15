import { IDrinkEvaluation } from './IDrinkEvaluation';

interface IDrinkSearchResults {
    exact: Array<IDrinkEvaluation>;
    substitutes: Array<IDrinkEvaluation>;
    invalid: Array<IDrinkEvaluation>;
}

export { IDrinkSearchResults };