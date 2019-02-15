import { IIngredientNode } from './IIngredient';

interface ISearchObj {
    ConsiderSubstitutions: boolean;
    RequireGarnish: boolean;
    RequireCube: boolean;
    RequireRinse: boolean;
    RequireSplash: boolean;
    RequireBitters: boolean;
    RequireSpray: boolean;
    RequirePinch: boolean;
    RequireFloat: boolean;
    Inventory: Array<IIngredientNode>;
    _InventoryIds: Array<Number>;
    SubstitutionMap: {};
 }

const SearchObject: ISearchObj = {
    ConsiderSubstitutions: true,
    RequireGarnish: false,
    RequireCube: false,
    RequireRinse: false,
    RequireSplash: false,
    RequireBitters: true,
    RequireSpray: false,
    RequirePinch: true,
    RequireFloat: false,
    Inventory: [],
    _InventoryIds: [],
    SubstitutionMap: {},
};

export { ISearchObj, SearchObject };