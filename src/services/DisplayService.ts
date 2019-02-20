import '../js/qrcode.min.js';
import { Category } from '../models/Category';
import { IDrink } from '../models/IDrink';
import { makeCategoryId } from './CategoryService';
import { Settings, ITreeSettings } from '../models/Settings';
import { findPage, PageTypes } from './NavigationService';
import { IIngredientNode } from '../models/IIngredient';
import { DFS, NoSiblings, DFS2 } from '../models/ITree';
import { KVP } from '../models/KVP';
import { getDrinksForIngredient } from './DrinkService';
import { SearchObject, ISearchObj } from '../models/SearchObject';
import { Globals } from './Globals';
import { IDrinkSearchResults } from '../models/IDrinkSearchResults';
import { IDrinkEvaluation } from '../models/IDrinkEvaluation';
import { DrawIngredientSVG } from './SVGService';
import { StorageAddPantryItem, StorageClearPantry, StorageRemovePantryItem } from './StorageService';
import { DecodeDrink } from './BuilderService';
import { ISelectedDrink } from '../models/SelectedDrinkObject';
import { DisplayDrink } from './DrinkDisplayService';
import { QRDataLimit_AlphaNumeric } from './QRCodeService';
import { Glasses } from '../models/IGlass';


/* Sidebar drawing */
let drinkListExpanded: boolean = false;

function toggleDrinkList(): void {
    drinkListExpanded = !drinkListExpanded;
    if (drinkListExpanded) {
        $('#drinkslistcontainer').addClass('collapse');
        $('#drinklistarrow').text(Settings.symbols.downsymbol);
    } else {
        $('#drinkslistcontainer').removeClass('collapse');
        $('#drinklistarrow').text(Settings.symbols.upsymbol);
    }
    Settings.sidebar.expanded = drinkListExpanded;
}

function populateCategories(categories: Array<Category>, appendId: string, appendTo: JQuery<HTMLElement>): void {
    categories.forEach((x) => {
        const catheader = $(`<div id='drink_category_header_${appendId}_${x.id}'>`).addClass(`drink_category_header_${appendId}`).append('<h3>').text(x.name);
        const l = catheader.append(`<ul id='drink_category_list_${appendId}_${x.id}'>`);
        appendTo.append(l);
    });
}

function populateDrinksMenu(universe: Array<IDrink>, appendId: string, classArr: Array<string>): void {
    function whichList(cat: string): JQuery<HTMLElement> {
        const ul = $(`#drink_category_list_${appendId}_${makeCategoryId(cat)}`);
        return ul;
    }

    universe.forEach((x: IDrink) => {
        const a: JQuery<HTMLElement> = $('<a>').attr('href', 'drinks.html#' + x.DrinkId).addClass(classArr);
        const obj: JQuery<HTMLElement> = $('<li>').attr('id', `li_drink_${appendId}` + x.DrinkId).append(a);
        a.text(x.Name);
        const ul: JQuery<HTMLElement> = whichList(x.Category);
        ul.append(obj);
    });
}

function populateNavbarDrinkList(universe: Array<IDrink>) {
    universe.forEach((x: IDrink) => {
        $('#navdrinklist').append($('<a>').addClass('dropdown-item').attr('href', `drinks.html#${x.DrinkId}`).text(x.Name));
    });
}

function DrawMainList(categories: Array<Category>, drinks: Array<IDrink>): void {
    populateCategories(categories, 'main', $('#drinkslistcontainer_main'));
    populateDrinksMenu(drinks, 'main', ['mainlink']);
}

function DrawSidebar(categories: Array<Category>, drinks: Array<IDrink>): void {
    populateCategories(categories, 'side', $('#drinkslistcontainer'));
    populateDrinksMenu(drinks, 'side', ['sidelink']);
    populateNavbarDrinkList(drinks);
    toggleDrinkList();
}

/* Ingredient Display */
function populateDrinksWithThisIngredient(drinks: Array<IDrink>): void {
    const drinkListElem: JQuery<HTMLElement> = $('#withIngredient');
    drinkListElem.empty();
    if (!drinks.any()) {
        drinkListElem.text('No drinks with this ingredient could be found. Sorry!');
    }
    for (let i = 0; i < drinks.length; i++) {
        const drink: IDrink = drinks[i];

        const li: JQuery<HTMLElement> = $('<li>').addClass('litext');
        const sp: JQuery<HTMLElement> = $('<a>').attr('href', 'drinks.html#' + drink.DrinkId).text(drink.Name);

        li.append(sp);
        drinkListElem.append(li);
    }
}

function displayIngredient(ingredient: IIngredientNode, ingredientUniverse: Array<IIngredientNode>, ingredientUniverseFlat: KVP<IIngredientNode>, drinkUniverse: Array<IDrink>): void {
    $('#ingredientHeader').text(ingredient.name);

    function findBranch(ingredient: IIngredientNode): IIngredientNode {
        let found: boolean = false;
        let branch: IIngredientNode = null;
        for (let i = 0; i < ingredientUniverse.length; i++) {
            const tbranch: IIngredientNode = ingredientUniverse[i];
            if (!found) {
                DFS(tbranch, (n) => {
                    if (n.id === ingredient.id) {
                        found = true;
                        branch = tbranch;
                    }
                });
            }
        }
        return branch;
    }

    const branch: IIngredientNode = findBranch(ingredient);

    $('#tree').empty();
    const ns: IIngredientNode = NoSiblings(branch, ingredient);
    const TreeOptions: ITreeSettings = {
        CollapseDepth: 99,
        ShowCheckBox: false,
        ShowCollapse: false,
        Highlight: [ingredient.id],
    };
    populateIngredientTree([ns], SearchObject, TreeOptions);

    const drinks: Array<IDrink> = getDrinksForIngredient(ingredient, ingredientUniverseFlat, drinkUniverse, true);
    populateDrinksWithThisIngredient(drinks);

    DrawIngredientSVG(ingredient, ingredientUniverse);
}

/* Ingredient Tree Display */

function clearPantry(): void {
    $('#your_pantry').empty();
}

function EliminatePantry(): void {
    clearPantry();
    StorageClearPantry();
    SearchObject.Inventory.clear();
    SearchObject._InventoryIds.clear();
}

function removeFromYourPantry(ing: IIngredientNode): boolean {
    for (let i = 0; i < SearchObject.Inventory.length; i++) {
        if (SearchObject.Inventory[i].id === ing.id) {
            // if found, kill it. break.
            StorageRemovePantryItem(SearchObject.Inventory[i]);
            SearchObject.Inventory.splice(i, 1);
            SearchObject._InventoryIds.splice(i, 1);
            return true;
        }
    }
    return false;
}

function redrawPantry(): void {
    clearPantry();
    SearchObject.Inventory.forEach((x: IIngredientNode) => {
        const button: JQuery<HTMLElement> = $('<button>').addClass('pantrytext').addClass('pantrybutton').attr('id', 'pantrybutton_' + x.id).addClass('btn').addClass('btn-xs').text('x').on('click', function(): void {
            removeFromYourPantry(x);
            redrawPantry();
        });
        const label: JQuery<HTMLElement> = $('<label>').addClass('pantrytext').attr('for', 'pantrybutton_' + x).addClass('pantrylabel').text(x.name);
        const span: JQuery<HTMLElement> = $('<span>').addClass('pantryspan').append(label).append(button);
        $('#your_pantry').append(span);
    });
}

function populateIngredientTree(branches: Array<IIngredientNode>, SearchObject: ISearchObj, options: ITreeSettings = Settings.tree): void {
    redrawPantry();
    //  clone tree settings
    options = {
        ...Settings.tree,
        ...options
    };

    const page: string = findPage().toLocaleLowerCase();
    if (page !== PageTypes.Pantry && page !== PageTypes.Ingredient) {
        return;
    }

    function fontCollapseF(depth: number): number {
        const fs: number = (options.FontStart);
        const fc: number = (options.FontCollapse);
        const collapse: number = Math.max(fs - (depth * fc), 12);
        return collapse;
    }


    function ingOncheck(node: IIngredientNode): () => void {
        function closure(): void {
            // scan yourpanty for this item
            const canAdd: boolean = !removeFromYourPantry(node);
            // otherwise, add it.
            if (canAdd) {
                StorageAddPantryItem(node);
                SearchObject.Inventory.push(node);
                SearchObject._InventoryIds.push(node.id);
            }
            // add pantry elements
            redrawPantry();
        }
        return closure;
    }

    function makeLabel(node: IIngredientNode, depth: number): [JQuery<HTMLElement>, JQuery<HTMLElement>] {
        const hdiv: JQuery<HTMLElement> = $('<div>').attr('id', 'hdiv_' + node.id).addClass('ingredientDiv');
        const label: JQuery<HTMLElement> = $('<label>').addClass('ingredientLabel').css('font-size', fontCollapseF(depth) + 'px');
        if (options.Highlight.contains(node.id)) {
            label.addClass('treeMark');
        }
        hdiv.append(label);
        const a = $('<a>').attr('href', 'ingredient.html#' + node.id).text((node.name)).css('margin-left', ((options.DepthMult) * depth) + 'px');
        const div2: JQuery<HTMLElement> = $('<div>').append(a);

        // options gets an override
        if (options.ShowCheckBox) {
            const check: JQuery<HTMLElement> = $('<input>').addClass('ingredientlayout').attr('type', 'checkbox').on('change', ingOncheck(node));
            if (SearchObject._InventoryIds.contains(node.id)) {
                check.attr('checked', 'true');
            }
            div2.append(check);
        }

        const appender: JQuery<HTMLElement> = $('<div>').attr('id', 'appender_' + node.id);
        if (depth >= (options.CollapseDepth)) {
            appender.addClass('collapse');
        }
        if (node.children.length > 0) {
            const expander = $('<button>').addClass('btn').addClass('btn-md').text(depth >= (options.CollapseDepth) - 1 ? Settings.symbols.upsymbol : Settings.symbols.downsymbol).on('click', function() {
                if (expander.text() === Settings.symbols.upsymbol) {
                    expander.text(Settings.symbols.downsymbol);
                    appender.removeClass('collapse');
                } else {
                    expander.text(Settings.symbols.upsymbol);
                    appender.addClass('collapse');
                }
            });
            div2.append(expander);
        }
        label.append(div2);
        return [hdiv, appender];
    }


    const root: IIngredientNode = {
        id: -1,
        distance: -1,
        name: 'Pantry',
        children: branches,
    };

    function df(node: IIngredientNode, depth: number, accumulator: JQuery<HTMLElement>) {
        const l: [JQuery<HTMLElement>, JQuery<HTMLElement>] = makeLabel(node, depth);
        const label: JQuery<HTMLElement> = l[0];
        const appender: JQuery<HTMLElement> = l[1];
        label.append(appender);
        accumulator.append(label);
        return appender;
    }

    DFS2(root, df, $('#tree'));
}

function DrawIngredient(): void {
    const an: number =  parseInt(location.hash.substring(1));
    if (isNaN(an)) {
        console.error('failed to parse hash fragment ingredient id for value: ' + location.hash.substring(1));
        return;
    }
    const ingredient: IIngredientNode = Globals.IngredientFlat[an];
    displayIngredient(ingredient, Globals.ingredients, Globals.IngredientFlat, Globals.Drinks);
    window.document.title = ingredient.name + ' - Nondari';
}

/* Pantry Display */

function showYourDrinks(drinksResults: IDrinkSearchResults): void {

    function populateDrinkList(listObject: JQuery<HTMLElement>, drinks: Array<IDrinkEvaluation>): void {

        function encodeDrink(drink: IDrinkEvaluation): string {
            return 'drinks.html?' + drink.anchor;
        }

        drinks.forEach((x) => {
            const li: JQuery<HTMLElement> = $('<li>').addClass('drinkFound');
            const texts = x.drink.Ingredients.filter(x => x.Unit === 'oz').map(x => x.IngredientName).join(', ');
            const a: JQuery<HTMLElement> = $('<a>').attr('href', encodeDrink(x)).text(`${x.name} [${texts}]`); // x.name);
            li.append(a);
            listObject.append(li);
         });
    }

    $('#your_drinks').removeClass('collapse');
    $('#drinks_em').empty();
    $('#drinks_sub').empty();
    if (drinksResults && (drinksResults.exact.length > 0 || drinksResults.substitutes.length > 0)) { // not null and at least one set is defined.
        $('#no_drinks_found').addClass('collapse');
        $('#drinks_available').removeClass('collapse');
        if (drinksResults.exact && drinksResults.exact.length > 0) {
            populateDrinkList($('#drinks_em'), drinksResults.exact);
        } else {
            const exactspn: JQuery<HTMLElement> = $('<span>').text('Sorry, no exact match drinks could be found');
            $('#drinks_em').append(exactspn);
        }
        if (drinksResults.substitutes.length > 0) {
            populateDrinkList($('#drinks_sub'), drinksResults.substitutes);
        } else if (SearchObject.ConsiderSubstitutions) {
            const subspan: JQuery<HTMLElement> = $('<span>').text('Sorry, no substite drinks could be found');
            $('#drinks_sub').append(subspan);
        }
    } else {
        $('#no_drinks_found').removeClass('collapse');
        $('#drinks_available').addClass('collapse');
    }
}

/* Builder Display */
function DrawBuilder() {
    $('#qr_limit_max').text(QRDataLimit_AlphaNumeric);
    const sel_glass = $('#selectGlass');
    const sel_cat = $('#selectCategory');
    sel_glass.empty();
    Glasses.forEach((x) => {
        const opt = $('<option>').attr('id', `select_glass_${x.Name}`);
        opt.val(String(x.Name));
        opt.text(String(x.Name));
        sel_glass.append(opt);
    });
    Globals.Categories.forEach((x) => {
        const opt = $('<option>').attr('id', `select_glass_${x.name.toLocaleLowerCase()}`);
        opt.val(String(x.id));
        opt.text(String(x.name));
        sel_cat.append(opt);
    });
}


/* Custom Display */
async function DrawCustom() {
    if (window.location.search.any()) {
        const drink: IDrink = DecodeDrink(window.location.toString());
        console.log(drink);
        const sdo: ISelectedDrink = {
            Drink: drink,
            Optionals: [],
            Substitutions: {},
        };
        DisplayDrink(sdo);
        DisplayQR(window.location.toString());
        const title = drink.Name + ' - Nondari';
        document.title = title;
        console.log(window.document.title);
    }
}

function DisplayQR(qrdata: string) {
    console.log(qrdata);
    const qrcode = new QRCode(document.getElementById('qrcode'), {
        text: qrdata,
        width: 128,
        height: 128,
        colorDark : '#000000',
        colorLight : '#ffffff',
        correctLevel : QRCode.CorrectLevel.L
    });
}

export {
    DrawIngredient,
    DrawSidebar,
    DrawMainList,
    makeCategoryId,
    toggleDrinkList,
    displayIngredient,
    populateIngredientTree,
    showYourDrinks,
    EliminatePantry,
    DrawBuilder,
    DrawCustom,
};