import { IIngredient, IIngredientNode } from '../models/IIngredient';
import { DFS } from '../models/ITree';
import { KVP } from '../models/KVP';
import { IsUndefined } from './Utils';

interface IReplacementsObj {
    any: boolean;
    subs: KVP<Array<number | string>>;
}

function findIngredientById(ingid: number, universe: KVP<IIngredientNode>): IIngredientNode {
    let ingredient: IIngredientNode = null;
    for (const k in universe) {
        DFS(universe[k], (n) => {
            if (n.id === ingid) {
                ingredient = n;
            }
        });
    }
    return ingredient;
}

function fs2(ingredient: IIngredient, available: Array<IIngredientNode>, universe: KVP<IIngredientNode>): IReplacementsObj {

    const replacements: IReplacementsObj = {
        any: false,
        subs: {}
    };

    const realIngredient: IIngredientNode = findIngredientById(ingredient.IngredientId, universe);
    if (!realIngredient) {
        return replacements; // no such ingredient could be found.
    }

    /* check if eligible for going up */
    if (realIngredient.distance === -1) {
        return replacements; // This item is -1, meaning it is not eligible to be substituted by anything.
    }

    let ancestor: IIngredientNode = null;
    let thisAncestor: IIngredientNode = null;
    let mainDistance: number = 0;
    let thisDistance: number = 0;

    for (let i = 0; i < available.length; i++) {
        const item = available[i];
        /* we start over at the beginning of every ingredient check. */
        ancestor = realIngredient;
        thisAncestor  = universe[item.id];
        mainDistance = 0;
        thisDistance = 0;

        let commonAncestor: boolean = true;
        // we go until the ancestors are common, OR until neither can go up anymore.
        while (ancestor.id !== thisAncestor.id) {
            if (ancestor.distance <= -1 && thisAncestor.distance <= -1) {
                /* ancestors are not common but we can't advance any further. */
                commonAncestor = false;
                break;
            }
            if (ancestor.distance > -1) {
                mainDistance += ancestor.distance;
                ancestor = universe[ancestor.parent];
            }
            if (thisAncestor.distance > -1) {
                thisDistance += thisAncestor.distance;
                thisAncestor = universe[thisAncestor.parent];
            }
        }

        if (commonAncestor) {
            const dist: number = mainDistance + thisDistance;
            replacements.any = true;
            if (IsUndefined(replacements.subs[dist])) {
                replacements.subs[dist] = [item.id];
            } else {
                replacements.subs[dist].push(item.id);
            }
        }
    }

    return replacements;
}

export { fs2, IReplacementsObj as ReplacementsObj };