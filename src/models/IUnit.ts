interface IUnit {
    Id: number;
    Name: string;
    Plural: string;
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