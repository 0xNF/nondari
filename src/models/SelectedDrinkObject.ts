import { IDrink } from './IDrink';
import { KVP } from './KVP';


interface ISelectedDrink {
    Drink?: IDrink;
    Optionals: Array<number>;
    Substitutions: KVP<KVP<Array<number>>>;
    Builder: boolean;
}

const SelectedDrinkObject: ISelectedDrink = {
    Drink: null,
    Optionals: [],
    Substitutions: {},
    Builder: false,
};

export { ISelectedDrink, SelectedDrinkObject };