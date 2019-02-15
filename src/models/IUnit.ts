import { Globals } from '../services/Globals';

interface IUnit {
    Id: number;
    Name: string;
}

interface IDisplayUnit {
    Id: number;
    Unit: IUnit;
    OrderPreference: number;
}

interface IUnitCategory {
    Id: number;
    Name: string;
    Units: Array<IDisplayUnit>;
}

export {
    IUnit,
    IDisplayUnit,
    IUnitCategory,
};