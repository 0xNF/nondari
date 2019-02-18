import { math } from './MathService';
import { IDrink } from '../models/IDrink';
import { Globals } from './Globals';
import { SelectedDrinkObject, ISelectedDrink, } from '../models/SelectedDrinkObject';
import { IIngredient } from '../models/IIngredient';
import { makeIngredientIdForHTML, UnitAndPlurals } from './IngredientService';
import { highlightGroupGenerator, DrawDrinkSVG, restoreGroups } from './SVGService';
import { WeirdnessLevelMap } from '../models/WLM';

/* Drink Display */

function DrawDrink(): void {
    $('li').removeClass('liSelected');
    const darr: Array<IDrink> = Globals.Drinks.filter(x => x.DrinkId === parseInt(location.hash.substring(1)));
    if (darr) {
        SelectedDrinkObject.Drink = darr[0];
    } else {
        SelectedDrinkObject.Drink = null;
    }

    if (SelectedDrinkObject.Drink) {
        $('#li_drink_' + SelectedDrinkObject.Drink.DrinkId).addClass('liSelected');
        DisplayDrink(SelectedDrinkObject);
        window.document.title = SelectedDrinkObject.Drink.Name + ' - Nondari';
    }
}

function ingredientLink(ingredient: any): JQuery<HTMLElement> {
    let a: JQuery<HTMLElement> = null;
    if (ingredient.name) {
        a = $('<a>').attr('href', 'ingredient.html#' + ingredient.id).text((ingredient.name));

    } else if (ingredient.IngredientName) {
        a = $('<a>').attr('href', 'ingredient.html#' + ingredient.IngredientId).text((ingredient.DisplayText ? ingredient.DisplayText : ingredient.IngredientName));
    }
    return a;
}

function ingredientText(ingredient: IIngredient, additionalText: string, sdo?: ISelectedDrink): JQuery<HTMLElement> {
    const sp: JQuery<HTMLElement> = $('<span>').addClass('ingdisplay').attr('id', makeIngredientIdForHTML(ingredient));

    function quantityText(ingredient: IIngredient): string {
        function doFrac(d: string): string | number {
            // http://westblog.com/2014/02/26/javascript-fractional-part-of-a-number/

            function fraction(fraction: number): string {
                const fr = math.fraction(fraction);
                const res = math.format(fr, { fraction: 'ratio' });
                return res;
            }

            function frac(num: number): number {
                return +(+num).toExponential().replace(/(-?)(\d+(\.?)\d*)e(.+)/, function (m, neg, num, dot, offset) {
                    const zeroes: string = Array(Math.abs(offset) + 2).join('0');
                    num = (zeroes + num + (dot ? '' : '.') + zeroes).split('.');
                    return String(+(neg + '.' + num.join('').slice(+offset + num[0].length)));
                });
            }

            const dd: number = parseFloat(d);
            const f: number = frac(dd);
            if (f === 0) {
                return dd;
            } else if (f === 33) {

            } else if (f === 66) {

            }
            const rat: number = dd - f;
            const ff: string = fraction(f);
            if (rat >= 1) {
                return rat + ' ' + ff;
            } else {
                return ff;
            }
        }

        const u: string = ingredient.Unit;
        const blanks: Array<string> = ['cracked', 'egg', 'float', 'half', 'full', 'rinse', 'splash', 'spray', 'top'];
        if (blanks.contains(u)) {
            return '';
        }
        const us: Array<string> = ['oz', 'bs', 'ts', 'tbs', 'shot'];
        const quants: Array<string> = ingredient.Quantity.split('-');
        for (let i = 0; i < quants.length; i++) {
            const tp: number = parseFloat(quants[i]);
            if (isNaN(tp)) {
                return '';
            }
        }
        if (us.contains(u)) {
            const fracs: Array<string | number> = quants.map((x) => {
                return doFrac(x);
            });
            return fracs.join('-');
        } else {
            return ingredient.Quantity;
        }
    }

    function unitText(ingredient: IIngredient): string {
        const unit = UnitAndPlurals.filter(x => x.unit === ingredient.Unit).find(x => true);
        if (unit) {
            const n = parseFloat(ingredient.Quantity);
            return ` ${isNaN(n) || n > 1 ? unit.plural : unit.unit} `;
        } else {
            return ' ';
        }
    }

    const tfirst: string = `${quantityText(ingredient)}${unitText(ingredient)}`;
    sp.append(tfirst);
    sp.append(ingredientLink(ingredient));
    sp.append(additionalText);
    if (sdo && sdo.Builder) {
        const but = $('<button>').text('X').addClass(['btn', 'btn-xs', 'btn-danger']);
        but.on('click', () => {
            console.log('shrug emoji');
        });
        sp.append(but);
    }

    if (ingredient.DisplayOrder > -1) {
        sp.on('mouseover', highlightGroupGenerator(ingredient));
        sp.on('mouseout', restoreGroups);
    } else {
        const notDisplayedSpan = $('<span>').text('*');
        $('#asterisk').removeClass('hidden');
        sp.append(notDisplayedSpan);
    }
    return sp;
}

/* eliminate all html */
function strip(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
}


/**
 * A small DSL parser to keep our user-submitted preludes and instructions XSS safe.
 *
* the DSL for prelude and intructions is as follows:
*
* {dNUM_text}, i.e., {d17_Bee's Knees} == <a href='drinks.html#17>Bee's Knees</a>
*
* {i_text}, i.e., {i_guey} == <i>guey</i>
*/
function replaceDSL(t: string): string {

    const open = '{';
    const close = '}';
    const italicToken = 'i';
    const drinkToken = 'd';

    let ret = t; /* string we will be operating on for replacements */

    let openB = 0; /* initialized to something above -1 */
    while (openB > -1) {
        openB = ret.indexOf(`${open}d`);

        /* changing links */
        if (openB > -1) {
            const closeB = ret.indexOf(close, openB);
            const sub = ret.substr(openB, closeB - openB + 1);
            const replacer = sub.replace(open, '').replace(close, '').replace(drinkToken, '');
            const splits = replacer.split('_');
            const drinkNum = parseInt(splits[0]);
            const drinkName = splits[1];
            const drink = Globals.Drinks.find(x => x.DrinkId === drinkNum);
            if (!drink) {
                console.error('tried to find drinkid ' + drinkNum + ' but none was found.');
                // replace with drink name It doesn't matter.
                ret = ret.replace(sub, drinkName);
            } else {
                ret = ret.replace(sub, `<a href="/drinks.html#${drinkNum}">${drinkName}</a>`);
            }
        }

        /* changing italics */
        openB = ret.indexOf(`${open}i`);
        if (openB > -1) {
            const closeB = ret.indexOf(close, openB);
            const sub = ret.substr(openB, closeB - openB + 1);
            const replacer = sub.replace(open, '').replace(close, '').replace(italicToken, '');
            const splits = replacer.split('_');
            const fancy = splits[1];
            ret = ret.replace(sub, `<i>${fancy}</i>`);
        }
    }

    return ret;
}

function decorateText(t: string): string {

    let s = strip(t);
    s = replaceDSL(s);
    s = s.replace(/\n/g, '<br />');

    return s;
}
function DisplayDrink(SDO: ISelectedDrink): void {

    $('#drinkHeader').text(SDO.Drink.Name);
    $('#drinkDescription').html(decorateText(SDO.Drink.Prelude));
    $('#drinkInstructions').html(decorateText(SDO.Drink.Instructions));
    $('#drinkCategory').text(SDO.Drink.Category);
    $('#drinkGlass').text(SDO.Drink.Glass);
    $('#drinkIngredients').empty();
    $('#asterisk').addClass('hidden');

    SDO.Drink.Ingredients.forEach((x: IIngredient) => {
        const sp: JQuery<HTMLElement> = $('<span>');
        const li: JQuery<HTMLElement> = $('<li>').addClass('text');
        const ul: JQuery<HTMLElement> = li.append(sp);
        let additionalText: string = '';
        if (SDO.Optionals.contains(x.IngredientId)) {
            sp.addClass('optionalIngredient');
            additionalText = '(optional)';
        } else if (x.IngredientId in SDO.Substitutions) {
            sp.addClass('substitutionAvailable');
            additionalText = '(substitutions available)';
            const ul2: JQuery<HTMLElement> = $('<ul>').addClass('text');
            const isubs = SDO.Substitutions[x.IngredientId];
            for (const distance in isubs) {
                const dist: JQuery<HTMLElement> = $('<li>').addClass('substitutionItem').addClass('text');
                const sp2: JQuery<HTMLElement> = $('<span>').addClass('text');
                const iter = isubs[distance];
                sp2.text(`${WeirdnessLevelMap[Number(distance)]}: `);
                for (let i = 0; i < iter.length; i++) {
                    const id = iter[i];
                    const ing = Globals.IngredientFlat[id];
                    sp2.append(ingredientLink(ing)).append(', ');
                }
                dist.append(sp2);
                ul2.append(dist);
            }
            li.append(ul2);
        }
        const t: JQuery<HTMLElement> = ingredientText(x, additionalText, SDO); // TODO typescript being a bitch
        sp.html(t as any);
        $('#drinkIngredients').append(ul);
    });

    DrawDrinkSVG(SDO.Drink, Globals.ingredients);
}

export {
    DrawDrink,
    DisplayDrink,
};