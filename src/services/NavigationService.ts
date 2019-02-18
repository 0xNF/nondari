import { IDrink } from '../models/IDrink';
import { Any } from './Utils';
import { KVP } from '../models/KVP';
import { IIngredientNode } from '../models/IIngredient';
import { INavObject } from '../models/INavigationObject';
import { ISelectedDrink } from '../models/SelectedDrinkObject';
import { IDrinkEvaluation } from '../models/IDrinkEvaluation';
import { DrawIngredient, DrawBuilder } from './DisplayService';
import { DrawDrink } from './DrinkDisplayService';

const PageTypes = {
    Drink: 'drink',
    Pantry: 'pantry',
    Ingredient: 'ingredient',
};

function findPage(): string {
    const l: Array<string> = window.location.pathname.split('/');
    const last: string = l[l.length - 1].split('.')[0];
    return last;
}

function drinkhrefmaker(): string {
    const loc: string = findPage();
    if (loc === 'drinks') {
        return '#';
    } else {
        return 'drinks.html#';
    }
}

function makeNavForDrink(foundDrink: IDrinkEvaluation) {
    /* Storing substitutes for a given drink */

    function encodeSubstitutions(subs: KVP<Array<Array<string>>>): string {
        // sub is {key: {0: [items], ..., n: [items]}}
        // i24 d3 s18,24,67
        // i6 d2 s9 d3 10
        let s: string = '';
        for (const ingidA in subs) {
            let si: string = `i${ingidA}`;
            for (const dist in subs[ingidA]) {
                const sdss: string = `d${dist}s${subs[ingidA][dist].join(',')}`;
                si += sdss;
            }
            s += si;
        }
        return s;
    }
    // need to encode(id of thing to replace, id of thing to replace with, distance of replacement);
    const q2: URLSearchParams = new URLSearchParams('?');

    q2.set('page', 'drink');
    q2.set('id', String(foundDrink.id));
    if (!Any(foundDrink.substitutions)) {
        const subs: string = encodeSubstitutions(foundDrink.substitutions);
        q2.set('substitutions', subs);
    }
    if (foundDrink.optionals.any()) {
        const opts: string = foundDrink.optionals.map(x => x.IngredientId).join(',');
        q2.set('optionals', opts);
    }
    foundDrink.anchor = q2.toString();
    return q2.toString();
}

function decodeDrinkNav(qstring: string, drinkUniverse: Array<IDrink>, ingredientUniverse: KVP<IIngredientNode>, NavObject: INavObject, SDO: ISelectedDrink): void {
    /* Note: validate everything. */
    const q: URLSearchParams = new URLSearchParams(qstring);
    const pageq: string = q.get('page');
    const didq: string = q.get('id');
    const subsq: string = q.get('substitutions');
    const optsq: string = q.get('optionals');
    /* setting the current page */
    if (pageq && (pageq === 'drink' || pageq === 'pantry')) {
        NavObject.currentPage = pageq;
    }
    /* setting the drinkid */
    if (didq) {
        const did: number = parseInt(didq);
        if (isNaN(did)) {
            console.error('Failed to parse drink id for value: ' + didq);
            return; /* failed to parse the drink id */
        }
        const drinkids: Array<number> = drinkUniverse.map(x => x.DrinkId);
        const drinkidx: number = drinkids.indexOf(did);
        if (drinkidx === -1) {
            console.error('Supplied drink id was not a valid drink id');
            return;
        }
        SDO.Drink = drinkUniverse[drinkidx];
    }

    /* Setting optionals */
    // const ingredientids = ingredientFlat.map(x => x.id);
    if (optsq) {
        const optionals: Array<number> = [];
        const splits: Array<string> = optsq.split(',');
        for (let i = 0; i < splits.length; i++) {
            const sp: string = splits[i];
            const sn: number = parseInt(sp);
            if (isNaN(sn)) {
                console.error('Failed to parse optional id for value: ' + sp);
            }
            if (!(sn in ingredientUniverse)) {
                console.error('An optional input id of ' + sn + ' was supplied but this is not a valid ingredient id');
            } else {
                optionals.push(sn);
            }
        }
        SDO.Optionals = optionals;
    }

    /* Setting Substitutions */
    if (subsq) {
        let subo: KVP<KVP<Array<number>>> = {

        };

        // handles raw Ingredient Strings
        // returns an object of the format {ingredientId: {[distance]: [itemids]}}
        function handle_i(s: string): KVP<KVP<Array<number>>> {
            let ad: number = -1;
            const dindexes: Array<any> = [];
            let cont: boolean = true;
            while (cont) {
                ad = s.indexOf('d', ad + 1);
                if (ad === -1) {
                    cont = false;
                } else {
                    dindexes.push(ad);
                }
            }
            if (!dindexes.any()) {
                console.error('Attempted to parse a substitution object, but there were no distances in the querystring');
                return;
            }

            const ingIdS: string = s.substr(0, dindexes[0]);
            const ingId: number = parseInt(ingIdS);
            if (isNaN(ingId)) {
                console.error('Failed to parse substitution id for value: ' + ingIdS);
                return null;
            } else if (!(ingId in ingredientUniverse)) {
                console.error('A substitution input id of ' + ingId + ' was supplied but this is not a valid ingredient id');
                return null;
            }


            let distances: KVP<Array<number>> = {};
            for (let i = 0; i < dindexes.length; i++) {
                const dindex = dindexes[i];
                let until: number = undefined;
                if (i + 1 < dindex.length) {
                    until = dindex[i + 1];
                }
                const dsub: string = s.substr(dindex + 1, until);
                const d: KVP<Array<number>> =  handle_d(dsub); // an object of {[distance]: [itemids]}
                if (!d) {
                    continue; // error from below
                }
                distances = Object.assign(distances, d);
            }

            const obj: KVP<KVP<Array<number>>> = {};
            obj[ingId] = distances;
            return obj;
        }

        // handles Distance substrings
        // returns an object of {distance: [itemids]}
        function handle_d(s: string): KVP<Array<number>> {
            // s25,26
            const sindex: number = s.indexOf('s');
            if (sindex === -1) {
                console.error('Failed to get an ingredient index');
                return null;
            }
            const distS: string = s.substr(0, sindex);
            const dist: number = parseInt(distS);
            if (isNaN(dist)) {
                console.error('Failed to parse distance key for value: ' + distS);
                return null;
            }

            const dobj: KVP<Array<number>> = {};
            dobj[dist] = [];
            const ingredientS: string = s.substr(sindex + 1);
            const ingredients: Array<string> = ingredientS.split(',');
            for (let i = 0; i < ingredients.length; i++) {
                const ingIdS: string = ingredients[i];
                const ingId: number = parseInt(ingIdS);
                if (isNaN(ingId)) {
                    console.error('Failed to parse replacement id for value: ' + ingIdS);
                    return null;
                } else if (!(ingId in ingredientUniverse)) {
                    console.error('A replacement input id of ' + ingId + ' was supplied but this is not a valid ingredient id');
                    return null;
                }
                dobj[dist].push(ingId);
            }
            return dobj;
        }

        const is: Array<string> = subsq.split('i');
        for (let i = 0; i < is.length; i++) {
            if (is[i].length > 0) {
                const mergeMe: KVP<KVP<Array<number>>> = handle_i(is[i]);
                subo = Object.assign(subo, mergeMe);
            }
        }

        SDO.Substitutions = subo;
    }
    window.location.hash = String(didq);
}

function locationHashChanged(): void {
    const page: string = findPage().toLocaleLowerCase();
    if (page === PageTypes.Ingredient.toLocaleLowerCase()) {
        DrawIngredient();
        return;
    }
    else if (page === PageTypes.Drink || page === 'drinks') {
        if (window.location.hash.any() || window.location.search.any()) {
            $('#drinkNoDrink').addClass('hidden');
            $('#drinkBase').removeClass('hidden');
        }
        DrawDrink();
        return;
    } else if (page === 'builder') {
        DrawBuilder();
        return;
    }
    window.document.title = 'Nondari';
}

export { decodeDrinkNav, makeNavForDrink, findPage, drinkhrefmaker, PageTypes, locationHashChanged };