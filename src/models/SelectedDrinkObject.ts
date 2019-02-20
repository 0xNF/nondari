import { IDrink } from './IDrink';
import { KVP } from './KVP';
import { IIngredient } from './IIngredient';


interface ISelectedDrink {
    Drink?: IDrink;
    Optionals: Array<number>;
    Substitutions: KVP<KVP<Array<number>>>;
    Builder?: {
        OnDelete: (ingredient: IIngredient) => void;
        OnEdit: (ingredient: IIngredient) => void;
    };
}

const SelectedDrinkObject: ISelectedDrink = {
    Drink: null,
    Optionals: [],
    Substitutions: {},
};

export { ISelectedDrink, SelectedDrinkObject };