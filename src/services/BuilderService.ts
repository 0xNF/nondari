import { ResetSVGSpace, getIngredientNodeSVGStyle } from './SVGService';
import { IDrink } from '../models/IDrink';
import { Globals } from './Globals';
import { IIngredient, IIngredientNode } from '../models/IIngredient';
import { DFS, ITree, NoSiblings } from '../models/ITree';
import { IDisplayUnit, IUnit } from '../models/IUnit';
import { UnitVal2Unit } from './UnitService';
import { IngredientVal2IngredientNode, EncodeIngredientForUrl, DecodeIngredientFromUrl } from './IngredientService';
import { DisplayDrink } from './DrinkDisplayService';
import { ISelectedDrink } from '../models/SelectedDrinkObject';
import { Category } from '../models/Category';
import { QRDataLimit_AlphaNumeric } from './QRCodeService';

interface IAddedIngredient {
    id: number;
    ingredient: IIngredient;
}

let qrCodeAllotment = 0;
const units: Array<string> = [];
const AddedIngredients: Array<IAddedIngredient> = [];
let timesAdded: number = 0;

const DrinkToDraw: IDrink = {
    Category: undefined,
    DrinkId: -1,
    Glass: undefined,
    Ingredients: [],
    Name: '',
    Prelude: '',
    Instructions: '',
};

function updateQRCodeAllotment(textOld: string, textNew: string) {
    qrCodeAllotment -= textOld.length;
    qrCodeAllotment += textNew.length;
    $('#qr_limit_current').text(qrCodeAllotment);
}


async function setDrinkName(text: string): Promise<void> {
    updateQRCodeAllotment(DrinkToDraw.Name, text);
    DrinkToDraw.Name = text;
    await BuilderDraw();
}

async function setCategoryType(val: string): Promise<void> {
    DrinkToDraw.Category = val;
    await BuilderDraw();
}

async function setGlassType(val: string): Promise<void> {
    DrinkToDraw.Glass = val;
    await BuilderDraw();
}

function setPrelude(val: string) {
    updateQRCodeAllotment(DrinkToDraw.Prelude, val);
    DrinkToDraw.Prelude = val;
    console.log(val);
}

function setInstructions(val: string) {
    updateQRCodeAllotment(DrinkToDraw.Instructions, val);
    DrinkToDraw.Instructions = val;
    console.log(val);
}

async function pushIngredient(globalId: number, ingredient: IIngredient) {
    const ai: IAddedIngredient = {
        id: globalId,
        ingredient: ingredient,
    };
    AddedIngredients.push(ai);
    DrinkToDraw.Ingredients.clear();
    AddedIngredients.forEach(x => DrinkToDraw.Ingredients.push(x.ingredient));
    BuilderDraw();
}

async function removeIngredient(gloabalId: number): Promise<void> {
    const remove = AddedIngredients.filter(x => x.id === gloabalId);
    remove.forEach(x => AddedIngredients.remove(x));
    DrinkToDraw.Ingredients.clear();
    AddedIngredients.forEach(x => DrinkToDraw.Ingredients.push(x.ingredient));
}

/* also functions as an init function when passed parameters */
async function BuilderDraw(glass?: string, category?: string) {

    updateQRCodeAllotment('', '');

    if (glass) {
        DrinkToDraw.Glass = glass;
    }
    if (category) {
        DrinkToDraw.Category = category;
    }
    ResetSVGSpace();

    const sdo: ISelectedDrink = {
        Drink: DrinkToDraw,
        Optionals: [],
        Substitutions: {},
        Builder: true
    };
    DisplayDrink(sdo);
}


function assignUnitPulldown(ingredientId: number, pulldown: JQuery<HTMLElement>): IUnit {
    pulldown.empty();
    let path: ITree = null;
    for (let i = 0; i < Globals.ingredients.length; i++) {
        const tree: IIngredientNode = Globals.ingredients[i];
        const res: IIngredientNode = NoSiblings(tree, {id: ingredientId, children: [] }, true);
        if (res && res.id !== -1) {
            path = res;
            break;
        }
    }
    if (!path) {
        console.error('Failed to find any matching ingredient path for the supplied ingredient');
        return null;
    }

    let highestIngredientType: number = null;
    DFS(path, (n: IIngredientNode) => {
        if (n.unitpreference) {
            highestIngredientType = n.unitpreference;
        }
    });

    let cat: Array<IDisplayUnit> = Globals.UnitTypes.find(x => x.Id === highestIngredientType).Units;
    cat = cat.sort((x, y) => { return x.OrderPreference <= y.OrderPreference ? 1 : 0; });

    // refresh available units
    /* populate units */
    cat.forEach((x: IDisplayUnit) => {
        const opt = $('<option>');
        opt.val(x.Id);
        opt.text(x.Unit.Name);
        pulldown.append(opt);
    });

    return cat[0].Unit;
}

function createIngredientPulldown(base: string, unitPulldown: JQuery<HTMLElement>, ingredient: IIngredient): JQuery<HTMLElement> {
    const id = `${base}_ingredient_select`;
    const label = $('<label>').attr('for', id).text('Ingredient');
    // create Ingredient Pulldown
    const sel: JQuery<HTMLElement> = $('<select>').attr('id', id);
    // // populate ingredient pulldown
    // for (const key in Globals.IngredientFlat) {
    //     const ingredient = Globals.IngredientFlat[key];
    //     const symbol = getIngredientNodeSVGStyle(ingredient, Globals.ingredients);
    //     if (symbol) { /* only symbolized ingredients */
    //         const ingId = ingredient.id;
    //         const ingName = ingredient.name;
    //         const opt = $('<option>').attr('id', `${base}_ingredient_select_option_${ingId}`);
    //         opt.val(ingId);
    //         opt.text(ingName);
    //         sel.append(opt);
    //     }
    // }
    // when option select changes, reset the unit pulldown
    // sel.on('change', () => {
    //     const ingVal: number = parseInt(sel.val() as string);
    //     ingredient.Unit = assignUnitPulldown(ingVal, unitPulldown).Name;
    //     const node: IIngredientNode = IngredientVal2IngredientNode(ingVal);
    //     if (!node) {
    //         return; // ERROR
    //     }
    //     ingredient.IngredientName = node.name;
    //     ingredient.IngredientId = node.id;
    // });

    label.append(sel);
    return label;
}

function createUnitPulldown(base: string, ingredient: IIngredient): [JQuery<HTMLElement>, JQuery<HTMLElement>] {
    const id =  `${base}_unit_select`;
    const label = $('<label>').attr('for', id).text('Unit');
    const sel: JQuery<HTMLElement> = $('<select>').attr('id', id);

    sel.on('change', () => {
        const unitVal: number = parseInt(sel.val() as string);
        const u: IUnit = UnitVal2Unit(unitVal);
        if (!u) {
            return; // ERROR
        }
        ingredient.Unit = u.Name;
    });

    label.append(sel);

    return [label, sel];
}

function createDisplayTextInput(base: string, ingredient: IIngredient): JQuery<HTMLElement> {
    const id =  `${base}_displaytext_input`;
    const label = $('<label>').attr('for', id).text('Display Text:');
    const inp = $('<input>').attr('type', 'text').attr('id', id);

    inp.on('change', (x: any) => {
        const text = x.target.value as string;
        if (!text || text.length === 0) {
            ingredient.DisplayText = undefined;
        } else {
            ingredient.DisplayText = text;
        }
    });

    label.append(inp);
    return label;
}

function createQuantityTextInput(base: string, ingredient: IIngredient): JQuery<HTMLElement> {
    const id = `${base}_quantity_input`;
    const label = $('<label>').text('Quantity').attr('for', id);
    const inp = $('<input>').attr('type', 'number').attr('step', '0.01').attr('id', id); // TODO we restrict users to numbers. No handfuls.
    inp.val(1); // default 1
    inp.on('change paste keyup', (x: any) => {
        const quantity = x.target.value as string;
        const float = parseFloat(quantity);
        if (isNaN(float)) {
            console.error(`attempted to parse float for builder quantity, but failed. Supplied value was invalid: ${quantity}`);
            return;
        }
        ingredient.Quantity = String(float);
    });

    label.append(inp);
    return label;
}

function createIsGarnishButton(base: string, ingredient: IIngredient): JQuery<HTMLElement> {
    const id = `${base}_isgarnish_input`;
    const label = $('<label>').text('Garnish?').attr('for', id);
    const but = $('<input>').attr('id', id).attr('type', 'checkbox');
    let isOn = false;
    but.text('is garnish');
    but.on('change', () => {
        isOn = !isOn;
        isOn ? but.attr('checked', 'true') : but.removeAttr('checked');
        // todo store check value somewhere
        ingredient.IsGarnish = isOn;
    });

    label.append(but);
    return label;
}

function createAcceptButton(base: string, iid: number, ingredient: IIngredient): JQuery<HTMLElement> {
    const id = `${base}_accept_button`;
    const but = $('<button>').attr('id', id).addClass(['btn', 'btn-xs', 'btn-primary']).text('OK');
    but.on('click', async () => {
        await pushIngredient(iid, ingredient);
        $(`#addIngredient_${timesAdded}_li`).remove();
    });
    return but;
}

function createDeleteButton(base: string, globalId: number): JQuery<HTMLElement> {
    const id = `${base}_cancel_button`;
    const but = $('<button>').attr('id', id).addClass(['btn', 'btn-xs', 'btn-danger']).text('X');
    but.on('click', async () => {
        $(`#${base}_li`).remove();
        removeIngredient(globalId);
        await BuilderDraw();
    });
    return but;
}

function createIngredientEditor(base: string, iid: number, ingredient: IIngredient): JQuery<HTMLElement> {
    // the editing menu of the add ingredient.
    // Not the same as the display menu of the ingredient.

    const sp = $('<span>').addClass('editorGird').attr('id', `${base}_editor`);

    const unitPulldown: [JQuery<HTMLElement>, JQuery<HTMLElement>] = createUnitPulldown(base, ingredient);
    const ingPulldown = createIngredientPulldown(base, unitPulldown[1], ingredient);
    const dtextInput = createDisplayTextInput(base, ingredient);
    const qInput = createQuantityTextInput(base, ingredient);
    const gbutton = createIsGarnishButton(base, ingredient);
    const okButton = createAcceptButton(base, iid, ingredient);
    const deleteButton = createDeleteButton(base, iid);

    const buttonsSp = $('<span>').css('display', 'inline');
    buttonsSp.append(okButton).append(deleteButton);

    sp.append(ingPulldown);
    sp.append(unitPulldown);
    sp.append(dtextInput);
    sp.append(qInput);
    sp.append(gbutton);
    sp.append(buttonsSp);

    return sp;

}

async function addIngredient(): Promise<void> {
    timesAdded += 1;

    const ingToEdit: IIngredient = {
        DisplayOrder: 0,
        DisplayText: undefined,
        IngredientId: -1,
        IngredientName: null,
        Quantity: '1',
        Unit: 'oz',
        IsGarnish: false,
    };

    const baseId = `addIngredient_${timesAdded}`;

    const editor = createIngredientEditor(baseId, timesAdded, ingToEdit);

    const ul = $('#drinkIngredientsEdit');
    const li = $('<li>').attr('id', `${baseId}_li`);

    li.append(editor);
    ul.append(li);


}

const Keys = {
    NameKey: 'name',
    CatKey: 'category',
    GlassKey: 'glass',
    PreludeKey: 'prelude',
    InstructionsKey: 'instructions',
    IngredientKey: 'ingredient'
};

function CreateDrink() {

    const params: URLSearchParams = new URLSearchParams();
    params.set(Keys.NameKey, DrinkToDraw.Name);
    params.set(Keys.CatKey, DrinkToDraw.Category);
    params.set(Keys.GlassKey, DrinkToDraw.Glass);
    params.set(Keys.PreludeKey, DrinkToDraw.Prelude);
    params.set(Keys.InstructionsKey, DrinkToDraw.Instructions);

    for (let i = 0; i < DrinkToDraw.Ingredients.length; i++) {
        const ing = DrinkToDraw.Ingredients[i];
        params.append(Keys.IngredientKey, EncodeIngredientForUrl(ing));
    }

    const hash: string = params.toString();
    const url: string = `${window.location.origin}/custom.html?${hash}`;

    if (url.length > QRDataLimit_AlphaNumeric) {
        console.error('Supplied drink is too big to make a QR code for.');
    }

    window.location.assign(url); // Go!
}

function DecodeDrink(urlstr: string): IDrink {
    const url = new URL(urlstr);
    console.log(url);
    const params: URLSearchParams = new URLSearchParams(url.search);
    const name = params.get(Keys.NameKey);
    const category = params.get(Keys.CatKey);
    const glass = params.get(Keys.GlassKey);
    const prelude = params.get(Keys.PreludeKey);
    const instructions = params.get(Keys.InstructionsKey);
    const ingredients_raw = params.getAll(Keys.IngredientKey);
    if ( (!name || !name.any()) || (!category || !category.any()) || (!glass || !glass.any()) || (!ingredients_raw || !ingredients_raw.any()) ) { // todo add checks against prelude and instructions?
        console.error('failed to decode drink uri, url was invalid');
        return;
    }

    const ingredients: Array<IIngredient> = [];
    for (let i = 0; i < ingredients_raw.length; i++) {
        const raw = ingredients_raw[i];
        const ing: IIngredient = DecodeIngredientFromUrl(raw);
        if (!ing) {
            console.error('failed to decode ingredient, raw string was invalid');
            return;
        }
        ingredients.push(ing);
    }

    const drink: IDrink = {
        DrinkId: -1,
        Category: category,
        Glass: glass,
        Instructions: instructions,
        Prelude: prelude,
        Name: name,
        Ingredients: ingredients
    };
    return drink;
}

function InitBuilder() {
    /* populate initial units */
    const UnitSelect = $('#UnitList');
    $('#UnitList').empty();
    if (units.any()) {
        Globals.Drinks.map(x => x.Ingredients.map(y => y.Unit)).reduce((p, c) => {
            // c is a list of units
            c.forEach((z) => {
                p.contains(z) ? null : p.push(z);
            });
            return p;
        }, units);
    }

    /* populate initial ingredients */
    const IngredientSelect = $('#IngredientList');
    IngredientSelect.empty();
    for (const key in Globals.IngredientFlat) {
        const ingredient = Globals.IngredientFlat[key];
        const symbol = getIngredientNodeSVGStyle(ingredient, Globals.ingredients);
        if (symbol) { /* only symbolized ingredients */
            const ingId = ingredient.id;
            const ingName = ingredient.name;
            const opt = $('<option>').attr('id', `ingredient_select_option_${ingId}`);
            opt.val(ingId);
            opt.text(ingName);
            IngredientSelect.append(opt);
        }
    }
    IngredientSelect.on('change', () => {
        const ingVal: number = parseInt(IngredientSelect.val() as string);
        assignUnitPulldown(ingVal, UnitSelect).Name;
        const node: IIngredientNode = IngredientVal2IngredientNode(ingVal);
        if (!node) {
            console.error(`Tried to change unit select to a unit that didn't have any available SVG symbols: ${ingVal}`);
            return;
        }
    });
}

export {
    InitBuilder,
    setDrinkName,
    setCategoryType,
    setGlassType,
    setPrelude,
    setInstructions,
    BuilderDraw,
    removeIngredient,
    addIngredient,
    CreateDrink,
    DecodeDrink,
};