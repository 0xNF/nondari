import { ITree } from './ITree';

interface IIngredient {
    IngredientId: number;
    Quantity: string;
    Unit: string;
    IngredientName: string;
    DisplayText?: string;
    DisplayOrder: number;
    PreferenceFor?: number;
    IsGarnish: boolean;
}

interface IIngredientNode extends ITree {
    name: string;
    distance: number;
    parent?: number;
    children: Array<IIngredientNode>;
    symbol?: string;
    unitpreference?: number;
}

export { IIngredient, IIngredientNode };