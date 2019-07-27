import { IIngredientNode, IIngredient } from '../models/IIngredient';
import { KVP } from '../models/KVP';
import { IDrinkSearchResults } from '../models/IDrinkSearchResults';
import { IDrinkEvaluation } from '../models/IDrinkEvaluation';
import { Globals } from './Globals';
import { UnitString2Unit } from './UnitService';
import { IUnit } from '../models/IUnit';

interface IUnitPlural {
    unit: string;
    plural: string;
}

function mapIngs(ingredient: IIngredientNode, flat: KVP<IIngredientNode>): void {
    if (!(ingredient.id in flat)) {
        flat[ingredient.id] = ingredient;
    }
    for (let i = 0; i < ingredient.children.length; i++) {
        const ing = ingredient.children[i] as IIngredientNode;
        mapIngs(ing, flat);
    }
}


function constructIngredients(jings: Array<IIngredientNode>): [Array<IIngredientNode>, KVP<IIngredientNode>] {
    const ingredientFlat: KVP<IIngredientNode> = {};
    const ingredientArr: Array<IIngredientNode> = [];
    jings.forEach((x: IIngredientNode) => {
        mapIngs(x, ingredientFlat);
        ingredientArr.push(x);
    });

    return [ingredientArr, ingredientFlat];
}

function makeIngredientIdForHTML(ingredient: IIngredient): string {
    const unit = ingredient.Unit.replace(/ /g, '');
    const idLinkToFind = `ingredient_${ingredient.IngredientId}_${unit}`;
    return idLinkToFind;
}


const UnitAndPlurals: ReadonlyArray<IUnitPlural> = [
    { unit: 'oz', plural: 'oz' },
    { unit: 'bs', plural: 'bs' },
    { unit: 'ts', plural: 'ts' },
    { unit: 'tbs', plural: 'tbs' },
    { unit: 'cup', plural: 'cups' },
    { unit: 'shot', plural: 'shots' },
    { unit: 'dash', plural: 'dashes' },
    { unit: 'pinch', plural: 'pinches' },
    { unit: 'drop', plural: 'drops' },
    { unit: 'leaf', plural: 'leaves' },
    { unit: 'stick', plural: 'sticks' },
];

/**
 * Converts an Ingredient to its equivalent Ingredient Node form.
 *
 * this is not a perfect conversation and the resulting node will not
 * have the correct distance or children fields.
 * @param ingredient
 */
function Ingredient2IngredientNode(ingredient: IIngredient): IIngredientNode {
    return {
        id: ingredient.IngredientId,
        distance: -1,
        name: ingredient.IngredientName,
        children: []
    };
}

function IngredientVal2IngredientNode(val: number): IIngredientNode {
    if (val in Globals.IngredientFlat) {
        return Globals.IngredientFlat[val];
    }
    console.error(`failed to find an ingredient of the value given: (${val})`);
}

function EncodeIngredientForUrl(ingredient: IIngredient): string {
    return `${ingredient.IngredientId}_${ingredient.Quantity}_${ingredient.Unit}_${ingredient.IsGarnish}_${ingredient.DisplayOrder}_${ingredient.DisplayText ? ingredient.DisplayText : ''}`;
}

function DecodeIngredientFromUrl(fragment: string): IIngredient {
    const splits = fragment.split('_');
    if (splits.length !== 6) {
        console.error(`failed to decode drink, an ingredient was malformed. Incorrect number of separators: ${fragment}`);
        return;
    }
    const ingId_raw = splits[0];
    const quantity_raw = splits[1];
    const unit_raw = splits[2];
    const garnish_raw = splits[3];
    const displayorder_raw = splits[4];
    const dtext_raw = splits[5];

    /* Ingredient Id */
    const ingid = parseInt(ingId_raw);
    if (isNaN(ingid)) {
        console.error(`failed to decode ingredient, supplied ingredient id was invalid: ${ingId_raw}`);
        return undefined;
    }
    const realIngredient: IIngredientNode = Globals.IngredientFlat[ingid];
    if (!realIngredient) {
        console.error(`failed to decode ingredient, supplied ingredient id was not found: ${ingId_raw}`);
        return undefined;
    }

    /* Display Order */
    const dorder = parseInt(displayorder_raw);
    if (isNaN(dorder)) {
        console.error(`failed to decode ingredient, supplied ingredient display order was invalid: ${displayorder_raw}`);
        return undefined;
    }

    /* Is Garnish */
    const isGarnishCheck = (garnish_raw === 'true' || garnish_raw === 'false');
    if (!isGarnishCheck) {
        console.error(`Failed to decode ingredient, supplied IsGarnish check wasn't valid: ${garnish_raw}`);
    }
    const isGarnish = garnish_raw === 'true';

    /* Unit */
    const unit: IUnit = UnitString2Unit(unit_raw);
    if (!unit) {
        console.error(`Failed to decode ingredient, supplied unit check wasn't valid: ${unit_raw}`);
        return undefined;
    }

    /* Quantity */
    const quantity = quantity_raw; /* we have no special checks yet */

    /* Display Text */
    /* todo sanitize dispaly text input? */
    const dtext = dtext_raw;


    const ing: IIngredient = {
        IngredientId: realIngredient.id,
        DisplayOrder: dorder,
        IsGarnish: isGarnish,
        Unit: unit.Name,
        Quantity: quantity,
        IngredientName: realIngredient.name,
        DisplayText: dtext
    };

    return ing;
}

/**
 * Given a pantry of ingredients, searches through a drink list
 * and determines what ingredients you should buy to make the most new drinks.
 *
 * Returns an object of {ingredient: ingredient}
 */
function GetRecommendedIngredients(results: IDrinkSearchResults) {
    // Gets all drinks that cannot be made
    let invalids: Array<IDrinkEvaluation> = results.invalid;

    interface IMisser {
        id: number;
        count: number;
        ingredient: IIngredientNode;
    }

    // Construct a list of all unique missing items
    let missingIngredients: Array<IMisser> = [];
    const missingIds = [];
    for (let i = 0; i < invalids.length; i++) {
        const missing = invalids[i].missing;
        for (let k = 0; k < missing.length; k++) {
            const ing = missing[k];
            if (!missingIds.contains(ing.IngredientId)) {
                missingIds.push(ing.IngredientId);
                missingIngredients.push({ count: 1, id: ing.IngredientId, ingredient: Ingredient2IngredientNode(ing) });
            } else {
                const misser = missingIngredients.find(x => x.id === ing.IngredientId);
                misser.count += 1;
            }
        }
    }

    // Order by number of missing items
    missingIngredients = missingIngredients.sort((x, y) => { return x.count > y.count ? 0 : 1; }); // descending order
    invalids = invalids.sort((x, y) => { return x.missing.length < y.missing.length ? 0 : 1; }); // ascending order

    const WillingToPurchase = 2;
    const invsWithWilling = invalids.filter(x => x.missing.length <= WillingToPurchase);
    const considered = [];
    const consideredIds = [];
    for (let i = 0; i < invsWithWilling.length; i++) {
        const inv = invalids[i];
        const ings: Array<number> = inv.missing.map(x => x.IngredientId);
        // how many others are also only missing these ingredient?
        for (let k = 0; k < invsWithWilling.length; k++) {
            if (consideredIds.contains(invsWithWilling[k].id)) {
                continue;
            }
            const otherInv = { ...invsWithWilling[k], missing: invsWithWilling[k].missing.map(x => x.IngredientId) };
            for (let z = 0; z < ings.length; z++) {
                const pop = ings[z];
                otherInv.missing.remove(pop);
            }
            if (otherInv.missing.length === 0) {
                console.log(`if you can only purchase ${WillingToPurchase} items, purchase ${inv.missing.map(x => x.IngredientName).join(', ')}`);
                console.log(otherInv);
                considered.push(otherInv);
                consideredIds.push(otherInv.id);
            }
        }

    }

    // for xn numnber of ingredients
    // S0 = set of all drinks missing ingredient x0
    // S1 = set all drinks missing ingredient x1
    //   ...
    // SN = set all drinks missing ingredient xn




    // console.log('If you had these ingredients...');
    // console.log(invalids);
    // console.log(missingIngredients);

}

export {
    constructIngredients,
    Ingredient2IngredientNode,
    makeIngredientIdForHTML,
    UnitAndPlurals,
    GetRecommendedIngredients,
    IngredientVal2IngredientNode,
    EncodeIngredientForUrl,
    DecodeIngredientFromUrl,
};