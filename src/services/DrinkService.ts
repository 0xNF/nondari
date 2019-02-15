import { IIngredient, IIngredientNode } from '../models/IIngredient';
import { SearchObject } from '../models/SearchObject';
import { ReplacementsObj, fs2 } from './SubstituteService';
import { IsUndefined } from './Utils';
import { IDrink } from '../models/IDrink';
import { KVP } from '../models/KVP';
import { DFS } from '../models/ITree';
import { makeNavForDrink } from './NavigationService';
import { IDrinkEvaluation } from '../models/IDrinkEvaluation';
import { IDrinkSearchResults } from '../models/IDrinkSearchResults';

/*
    Because the pantry may be filled with supersets AND subsets of a given ingredient branch,
    we want to return the elements closest to the available supersets.

    Returns an array of only the biggest supersets from the pantry.
    e.g., if [bourbon, elijah-craig-12-year, whiskey, aveze, tawny-port, wine] -> [whiskey, aveze, wine]
*/
function getPantrySupersets(available: Array<IIngredientNode>): Array<IIngredientNode> {
    const eliminated: Array<IIngredientNode> = []; // Set of items that have been eliminated
    const final: Array<IIngredientNode> = []; // Set of final items

    function eliminate(item: IIngredientNode) {
        if (eliminated.filter(x => x.id === item.id).length === 0) {
            eliminated.push(item);
        }
    }
    function finalize(item: IIngredientNode) {
        if (final.filter(x => x.id === item.id).length === 0) {
            final.push(item);
        }
    }


    interface IntermediateEliminator {
        depth: number;
        item: IIngredientNode;
    }

    /* for each of the available elements, we crawl down each other element until we find our element. We ignore the self index */
    for (let i = 0; i < available.length; i++) {
        const car: IIngredientNode = available[i];
        /* check car is in eliminated, or in final */
        if (eliminated.contains(car) || final.contains(car)) {
            continue; /* this item is either eliminated or finally counted. Skip it */
        }

        /* This item is neither final nor eliminated, so we actually have to do work */
        const cdr: Array<IIngredientNode> = available.filter(x => x.id !== car.id); /* a list of only not-checker elements */

        /* for each other item in cdr, DFS it */
        const foundAtDepth: Array<IntermediateEliminator> = []; // tuples of(depth, super);
        for (let k = 0; k < cdr.length; k++) {
            const caar: IIngredientNode = cdr[k];
            DFS<IIngredientNode>(caar, (n, d) => {
                if (n.name === car.name) {
                    const fad: IntermediateEliminator = { depth: d, item: caar };
                    foundAtDepth.push(fad);
                }
            });
        }

        /* no further subsets were found, so we can skip everything and push this item to Final */
        if (foundAtDepth.length === 0) {
            final.push(car);
        }
        else {
            /* find the item with the biggest depth. This is our Final */
            const depthMax: IntermediateEliminator = foundAtDepth.reduce((p, c) => {
                if (!p || p.depth < c.depth) {
                    return c;
                }
                return p;
            });

            /* remove depthMax from foundatdepth */
            foundAtDepth.remove(depthMax);
            // foundAtDepth.splice(foundAtDepth.indexOf(depthMax), 1);

            /* Eliminate remaining FoundAts */
            foundAtDepth.forEach(x => eliminate(x.item));

            /* push DepthMax to Final */
            finalize(depthMax.item);
        }
    }
    return final;
}

function flattenInventoryTree(pantry: Array<IIngredientNode>): Array<IIngredientNode> {
    const reducedInventory: Array<IIngredientNode> = getPantrySupersets(pantry);
    const flattenedInventory: Array<IIngredientNode> = [];
    reducedInventory.forEach(x => {
        DFS(x, (n) => {
            flattenedInventory.push(n);
        });
    });
    return flattenedInventory;
}

function collapseZeros(pantry: Array<IIngredientNode>, universe: KVP<IIngredientNode>): Array<IIngredientNode> {
    const inventory: Array<IIngredientNode> = [];
    for (let i = 0; i < pantry.length; i++) {
        const ing: IIngredientNode = pantry[i];
        if (ing.distance === 0 && ing.parent !== null) {
            const p: IIngredientNode = universe[ing.parent];
            inventory.push(p);
        }
        inventory.push(ing);
    }
    return inventory;
}

/* Returns whether the given ingredient is optional, given our criteria */
function ingredientRequireChecker(ingredient: IIngredient): boolean {

    /* Check Floats */
    if (ingredient.Unit === 'top' || ingredient.Unit === 'float') {
        return !SearchObject.RequireFloat; /* It is a Float and are requiring floats, it is NOT OPTIONAL */
    }
    /* Check Splashes */
    if (ingredient.Unit === 'splash') {
        return !SearchObject.RequireSplash;  /* It is a Splash and we are requiring splashes, it is NOT OPTIONAL */
    }

    /* Check Rinses */
    if (ingredient.Unit === 'rinse') {
        return !SearchObject.RequireRinse;  /* It is a rinse and we are requiring rinse, it is NOT OPTIONAL */
    }

    /* Check Spray */
    if (ingredient.Unit === 'spray') {
        return !SearchObject.RequireSpray;  /* It is a Spray and we are requiring sprays, it is NOT OPTIONAL */
    }
    /* Check Ice */
    if (ingredient.Unit === 'cracked' || ingredient.Unit === 'half' || ingredient.Unit === 'large cube' || ingredient.Unit === 'regular cube' || ingredient.Unit === 'small cube') {
        return !SearchObject.RequireCube;  /* It is an ice thing are requiring ice-things, it is NOT OPTIONAL */
    }

    /* Check Garnishes */
    if (ingredient.DisplayText.toLocaleLowerCase().contains('garnish')) {
        return !SearchObject.RequireGarnish;  /* It is a garnish and we are requiring garnishes, it is NOT OPTIONAL */
    }

    /* Check Bitters */
    if (ingredient.Unit === 'dash') {
        return !SearchObject.RequireBitters; /* It is a bitters, and we require bitters so it is NOT OPTIONAL */
    }

    /* Check Pinches */
    if (ingredient.Unit === 'pinch') {
        return !SearchObject.RequirePinch; /* It is a pinch, and we require pinches so it is NOT OPTIONAL */
    }

    return false; /* Unless specifically exempted by the above rules, all ingredients are required by default. */
}

function findSubstitution(ing: IIngredient, pantry: Array<IIngredientNode>, universe: KVP<IIngredientNode>): ReplacementsObj {

    // function checkPantryCache(ing: IIngredientNode, pantry: Array<IIngredientNode>): ReplacementsObj {
    //     const repls: ReplacementsObj = { any: false, subs: null };
    //     if (ing.id in SearchObject.SubstitutionMap) {
    //         /* check if any of the available mappings exist in users pantry */
    //         const subs: any = SearchObject.SubstitutionMap[ing.id];
    //         for (let i = 0; i < subs.length; i++) {
    //             const subi = subs[i];
    //             if (pantry.contains(subi)) {
    //                 repls.any = true;
    //                 if (IsUndefined(repls[i])) {
    //                     repls[i] = [subi];
    //                 } else {
    //                     repls[i].push(subi);
    //                 }
    //             }
    //         }
    //     }
    //     return repls;
    // }

    // function updateSubCache(repls: any): void {
    //     if (repls.any) {
    //         for (let key in repls.subs) {
    //             if (IsUndefined(SearchObject.SubstitutionMap[key])) {
    //                 SearchObject.SubstitutionMap[key] = repls[key];
    //             } else {
    //                 const sosm = SearchObject.SubstitutionMap[key];
    //                 for (let distkey in sosm) {
    //                     if (IsUndefined(repls[key][distkey])) {
    //                         repls[key][distkey] = sosm[distkey];
    //                     } else {
    //                         const rplm = repls[key][distkey];
    //                         for (let i = 0; i < rplm.length; i++) {
    //                             if (!sosm[distkey].contains(rplm[i])) {
    //                                 sosm[distkey].push(rplm[i]);
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // }

    /* first we check that this ingredient doesn't already have a pre-computed substitution mapping */
    // const repls = checkPantryCache(ing, pantry);
    // if (!Any(repls)) {
    //     return repls;
    // }

    /* We didn't have any cached substitution maps, so we'll scan for some. */
    const availableSubs = fs2(ing, pantry, universe);

    /* update substitution cache */
    // updateSubCache(availableSubs);

    return availableSubs;
}

/* Returns whether a given drink matches our search criteria */
function evaluateDrink(drink: IDrink, pantry: Array<IIngredientNode>, universe: KVP<IIngredientNode>): IDrinkEvaluation {

    /* Reduce the pantry to only supplied supersets */
    pantry = collapseZeros(pantry, universe);
    pantry = flattenInventoryTree(pantry);

    const pantryIds: Array<number> = pantry.map(x => x.id);

    const evaluationObject: IDrinkEvaluation = {
        is_exact: false,
        name: drink.Name,
        id: drink.DrinkId,
        substitutions: {},
        optionals: [],
        drink: drink,
        missing: [],
        is_valid: true,
        anchor: '',
    };

    for (let i = 0; i < drink.Ingredients.length; i++) {
        const ing: IIngredient = drink.Ingredients[i];
        const optional: boolean = ingredientRequireChecker(ing);
        if (!optional) {
            /* we need this ingredient according to our criteria, so check if it is in our panrty */

            const preferenceInPanrty: boolean = pantryIds.contains(ing.IngredientId);
            const baseInPantry: boolean = pantryIds.contains(ing.PreferenceFor);
            const inPantry: boolean = preferenceInPanrty || baseInPantry;
            if (!inPantry) {
                if (!SearchObject.ConsiderSubstitutions) {
                    evaluationObject.is_valid = false;
                    evaluationObject.missing.push(ing);
                    // return evaluationObject;
                } else {
                    /* We are considering substitutions, so we will attempt to find an available sub from our pantry */
                    const sub: ReplacementsObj = findSubstitution(ing, pantry, universe);
                    if (sub.any) {
                        evaluationObject.substitutions[ing.IngredientId] = sub.subs; /* Substitution was available, we add it to out mapping */
                        // evaluationObject.substitutions[ing.IngredientId] = sub.IngredientId; /* Substitution was available, we add it to out mapping */
                    } else {
                        /* No substitution could be found for this mandatory object, so we fail early */
                        evaluationObject.is_valid = false;
                        evaluationObject.missing.push(ing);
                        // return evaluationObject;
                    }
                }
            }
        } else {
            evaluationObject.optionals.push(ing); /* We make note of items that are optional so we can inform the user when they request the drink recipe */
        }
    }

    evaluationObject.is_exact = Object.keys(evaluationObject.substitutions).length === 0;
    evaluationObject.anchor = makeNavForDrink(evaluationObject);
    return evaluationObject;
}

function calculateDrinks(pantry: Array<IIngredientNode>, drinkUniverse: Array<IDrink>, ingredientUniverse: KVP<IIngredientNode>): IDrinkSearchResults {
    const resultObj: IDrinkSearchResults = {
        exact: [],
        substitutes: [],
        invalid: [],
    };

    drinkUniverse.forEach((x: IDrink) => {
        const evalobj: IDrinkEvaluation = evaluateDrink(x, pantry, ingredientUniverse);
        if (evalobj.is_valid) {
            if (evalobj.is_exact) {
                resultObj.exact.push(evalobj);
            } else {
                resultObj.substitutes.push(evalobj);
            }
        } else {
            resultObj.invalid.push(evalobj);
        }
    });

    return resultObj;
}

function getDrinksForIngredient(ingredient: IIngredientNode, ingredientUniverse: KVP<IIngredientNode>, drinkUniverse: Array<IDrink>, subtypes: boolean = true): Array<IDrink> {
    const ids: Array<number> = [];
    if (subtypes) {
        const ing: IIngredientNode = ingredientUniverse[ingredient.id];
        DFS(ing, (n) => {
                ids.push(n.id);
            }
        );
    } else {
        ids.push(ingredient.id);
    }
    const ret: Array<IDrink> = drinkUniverse.filter(x => x.Ingredients.any(y => ids.contains(y.IngredientId)));
    return ret;
}

function constructDrinks(jdrinks: Array<IDrink>) {
    const ret: Array<IDrink> = jdrinks;
    return ret;
}

export { constructDrinks, calculateDrinks, getDrinksForIngredient };