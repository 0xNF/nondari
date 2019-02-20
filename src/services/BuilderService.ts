import { ResetSVGSpace, getIngredientNodeSVGStyle } from './SVGService';
import { IDrink } from '../models/IDrink';
import { Globals } from './Globals';
import { IIngredient, IIngredientNode } from '../models/IIngredient';
import { DFS, ITree, NoSiblings } from '../models/ITree';
import { IDisplayUnit, IUnit } from '../models/IUnit';
import { UnitVal2Unit, UnitString2Unit } from './UnitService';
import { IngredientVal2IngredientNode, EncodeIngredientForUrl, DecodeIngredientFromUrl } from './IngredientService';
import { DisplayDrink } from './DrinkDisplayService';
import { ISelectedDrink } from '../models/SelectedDrinkObject';
import { QRDataLimit_AlphaNumeric } from './QRCodeService';
import { Category } from '../models/Category';

interface IAddedIngredient extends IIngredient {
    addedId: number;
}

let qrCodeAllotment = 0;
const units: Array<string> = [];
const AddedIngredients: Array<IAddedIngredient> = [];
let timesAdded: number = -1;
let isEditing: boolean = false;
const QRURLVersion = 'v1'; /* We update this when we change the formatting of the qr url, so we can show an error for an invalid url*/

const DrinkToDraw: IDrink = {
    Category: 'old fashioned',
    DrinkId: -1,
    Glass: 'coupe',
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

function setEditState(state: boolean) {
    isEditing = state;
    if (state) {
        $('#confirmAddIngredient').text('confirm edit');
    } else {
        $('#confirmAddIngredient').text('add');
    }
}

async function pushIngredient(globalId: number, ingredient: IIngredient) {
    const ai: IAddedIngredient = {
        ...ingredient,
        addedId: globalId,
    };
    if (isEditing) {
        const idx = AddedIngredients.findIndex(x => x.addedId === globalId);
        AddedIngredients[idx] = ai;
        DrinkToDraw.Ingredients[idx] = ai;
    }
    else {
        AddedIngredients.push(ai);
        DrinkToDraw.Ingredients.clear();
        AddedIngredients.forEach(x => DrinkToDraw.Ingredients.push(x));
    }
    BuilderDraw();
}

async function removeIngredient(gloabalId: number): Promise<void> {
    const remove = AddedIngredients.filter(x => x.addedId === gloabalId);
    remove.forEach(x => AddedIngredients.remove(x));
    DrinkToDraw.Ingredients.clear();
    AddedIngredients.forEach(x => DrinkToDraw.Ingredients.push(x));
}

function openEdit(ingredient: IAddedIngredient) {

    /* Set the Editing flag */
    setEditState(true);

    /* Set the Selected Ingredient */
    const inglist = $('#IngredientList').val(ingredient.IngredientId).change(); /* change() is a trick to force the select to acknowledge the new value */


    /* Set the unit */
    const unit: IUnit = UnitString2Unit(ingredient.Unit);
    const unitList = $('#UnitList').val(unit.Id).change();

    /* Set the Quantity */
    $('[active=\'true\']').val(ingredient.Quantity).change();

    /* Set Display Text */
    const dtext = $('#DisplayTextInput').val(ingredient.DisplayText).change();

    /* Set Garnish Check */
    // todo not working
    if (ingredient.IsGarnish) {
        $('#IsGarnishCheckbox').attr('checked', 'true').change();
    } else {
        $('#IsGarnishCheckbox').removeAttr('checked').change();
    }

    /* open the menu */
    RevealIngredientAdd();

}

/* also functions as an init function when passed parameters */
async function BuilderDraw() {

    updateQRCodeAllotment('', '');

    ResetSVGSpace();

    const sdo: ISelectedDrink = {
        Drink: DrinkToDraw,
        Optionals: [],
        Substitutions: {},
        Builder: {
            OnDelete: async (ingredient: IIngredient) => {
                const iadded = ingredient as IAddedIngredient;
                removeIngredient(iadded.addedId);
                await BuilderDraw();
            },
            OnEdit: (ingredient: IIngredient) => {
                openEdit(ingredient as IAddedIngredient);
            }
        }
    };
    DisplayDrink(sdo);
}


function assignUnitPulldown(ingredientId: number, pulldown: JQuery<HTMLElement>): IUnit {
    pulldown.empty();
    let path: ITree = null;
    for (let i = 0; i < Globals.ingredients.length; i++) {
        const tree: IIngredientNode = Globals.ingredients[i];
        const res: IIngredientNode = NoSiblings(tree, { id: ingredientId, children: [] }, true);
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

    IngredientToEdit.Unit = cat[0].Unit.Name;
    return cat[0].Unit;
}

async function addIngredient(): Promise<void> {
    if (!isEditing) {
        timesAdded += 1;
    }
    $('#IngredientEntry').removeClass('entry_grid').addClass('hidden');
    console.log(IngredientToEdit);
    const iing: IIngredient = JSON.parse(JSON.stringify(IngredientToEdit));
    await pushIngredient(timesAdded, iing);
    DoErrors([ErrorChecks.IngredientCount]);

    /* regardless of editing state before, we turn it off here */
    setEditState(false);
}

const ParameterKeys = {
    VersionKey: 'ver',
    NameKey: 'name',
    CatKey: 'category',
    GlassKey: 'glass',
    PreludeKey: 'prelude',
    InstructionsKey: 'instructions',
    IngredientKey: 'ingredient'
};

const ErrorChecks = {
    DrinkName: 'name',
    IngredientCount: 'ingredientcount',
};

function CheckErrors(check?: Array<string>): Array<string> {
    const errArr: Array<string> = [];

    /* Check Drink Name */
    if (!check || !check.any() || check.contains(ErrorChecks.DrinkName)) {
        if (!DrinkToDraw.Name || !DrinkToDraw.Name.any()) {
            $('#inputName').addClass('inputError');
            errArr.push('Drink cannot be nameless');
        } else {
            $('#inputName').removeClass('inputError');
        }
    }

    /* check ingredients */
    if (!check || !check.any() || check.contains(ErrorChecks.IngredientCount)) {
        if (!DrinkToDraw.Ingredients.any()) {
            errArr.push('Drink needs at least one ingredient');
            $('#addIngredientButton').addClass('inputError');
        } else {
            $('#addIngredientButton').removeClass('inputError');
        }
    }


    return errArr;
}


function DrawErrors(errors: Array<string>): void {
    const errList = $('#errorList');
    errList.empty();
    for (let i = 0; i < errors.length; i++) {
        const err = errors[i];
        const li = $('<li>').text(err);
        errList.append(li);
    }
    console.log('tried to create a drink but user has not submitted enough valid parameters');
    return;
}

function DoErrors(check?: Array<string>): boolean {
    const errors = CheckErrors(check);
    const errorContainer = $('#errorContainer');
    if (errors.any()) {
        errorContainer.removeClass('hidden');
        DrawErrors(errors);
        return false;
    } else {
        errorContainer.addClass('hidden');
    }
    return true;
}

/**
 * In the event a user clicks back to this page, the regular on-input-change events will not have fired.
 * This method ensures that the `DrinkToDraw` is filled the correct inputs
 */
function scanForParams() {
    // TODO selected options are not preserved across pages.
    const inp_drinkname = $('#inputName');
    const inp_prelude = $('#area_prelude');
    const inp_instructions = $('#area_instructions');
    const sel_glass = $('#selectGlass');
    const sel_category = $('#selectCategory');

    DrinkToDraw.Name = inp_drinkname.val() as string;
    DrinkToDraw.Prelude = (inp_prelude.val() as string).any() ? (inp_prelude.val() as string) : undefined;
    DrinkToDraw.Instructions = (inp_instructions.val() as string).any() ? (inp_instructions.val() as string) : undefined;
    DrinkToDraw.Glass = sel_glass.val() as string;
    DrinkToDraw.Category = sel_category.val() as string;


    // TODO ingredients
}
function CreateDrink() {

    scanForParams();

    if (!DoErrors()) {
        return;
    }

    const params: URLSearchParams = new URLSearchParams();
    params.set(ParameterKeys.VersionKey, String(QRURLVersion));
    params.set(ParameterKeys.NameKey, DrinkToDraw.Name);
    params.set(ParameterKeys.CatKey, DrinkToDraw.Category);
    params.set(ParameterKeys.GlassKey, DrinkToDraw.Glass);
    params.set(ParameterKeys.PreludeKey, DrinkToDraw.Prelude);
    params.set(ParameterKeys.InstructionsKey, DrinkToDraw.Instructions);

    for (let i = 0; i < DrinkToDraw.Ingredients.length; i++) {
        const ing = DrinkToDraw.Ingredients[i];
        params.append(ParameterKeys.IngredientKey, EncodeIngredientForUrl(ing));
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
    const ver = params.get(ParameterKeys.VersionKey);
    if (ver !== QRURLVersion) {
        console.error('user used an old QR link we no longer support. Show error');
        return;
    }
    const name = params.get(ParameterKeys.NameKey);
    const category = params.get(ParameterKeys.CatKey);
    const glass = params.get(ParameterKeys.GlassKey);
    const prelude = params.get(ParameterKeys.PreludeKey);
    const instructions = params.get(ParameterKeys.InstructionsKey);
    const ingredients_raw = params.getAll(ParameterKeys.IngredientKey);
    if ((!name || !name.any()) || (!category || !category.any()) || (!glass || !glass.any()) || (!ingredients_raw || !ingredients_raw.any())) { // todo add checks against prelude and instructions?
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

    const cat: Category = Globals.Categories.find(x => x.id === category);

    const drink: IDrink = {
        DrinkId: -1,
        Category: cat.name,
        Glass: glass,
        Instructions: instructions,
        Prelude: prelude,
        Name: name,
        Ingredients: ingredients
    };
    return drink;
}

const IngredientToEdit: IIngredient = {
    DisplayOrder: 0,
    DisplayText: undefined,
    IngredientId: -1,
    IngredientName: null,
    Quantity: '1',
    Unit: 'oz',
    IsGarnish: false,
};

async function InitBuilder() {
    await BuilderDraw();

    const DTextInput = $('#DisplayTextInput');
    const IsGarnishButton = $('#IsGarnishCheckbox');

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

    /* Register the changing unit */
    UnitSelect.on('change', () => {
        const unitVal: number = parseInt(UnitSelect.val() as string);
        const u: IUnit = UnitVal2Unit(unitVal);
        if (!u) {
            console.error(`Tried to set ingredient unit to an invalid unit. Received: {UnitSelect.val()}`);
            return;
        }
        IngredientToEdit.Unit = u.Name;
    }
    );

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

    /* get changing quantities */
    function QuantityChanged(x: string) {
        const quantity = x;
        if (quantity === 'half' || quantity === 'fill' || quantity === 'multiple') {
            IngredientToEdit.Quantity = x;
        } else {
            const float = parseFloat(quantity);
            if (isNaN(float)) {
                console.error(`attempted to parse float for builder quantity, but failed. Supplied value was invalid: ${quantity}`);
                return;
            }
            IngredientToEdit.Quantity = String(float);
            console.log(IngredientToEdit.Quantity);
        }
    }

    IngredientSelect.on('change', () => {
        const ingVal: number = parseInt(IngredientSelect.val() as string);

        /* Register Ingredient Id */
        IngredientToEdit.IngredientId = ingVal;
        IngredientToEdit.IngredientName = Globals.IngredientFlat[ingVal].name;

        /* change the Unit pulldown to reflect available units */
        assignUnitPulldown(ingVal, UnitSelect).Name;
        const node: IIngredientNode = IngredientVal2IngredientNode(ingVal);
        if (!node) {
            console.error(`Tried to change unit select to a unit that didn't have any available SVG symbols: ${ingVal}`);
            return;
        }

        /* change the active Quantity input to reflect appropriate quantities */
        const qs_num = $('#QuantitySelect_Number');
        const qs_mult = $('#QuantitySelect_Multiple');
        const qs_glass = $('#QuantitySelect_Glass');
        if (IngredientQuantityIsMultiple(ingVal)) {
            qs_num.addClass('hidden').removeAttr('active');
            qs_glass.addClass('hidden').removeAttr('active');
            qs_mult.removeClass('hidden').attr('active', 'true');
            QuantityChanged(qs_mult.val() as string);
        } else if (IngredientQuantityIsGlass(ingVal)) {
            qs_num.addClass('hidden').removeAttr('active');
            qs_glass.removeClass('hidden').attr('active', 'true');
            qs_mult.addClass('hidden').removeAttr('active');
            QuantityChanged(qs_glass.val() as string);
        } else {
            qs_num.removeClass('hidden').attr('active', 'true');
            qs_glass.addClass('hidden').removeAttr('active');
            qs_mult.addClass('hidden').removeAttr('active');
            QuantityChanged(qs_num.val() as string);
        }

        /* Register changing Quantity items */
        qs_num.on('change paste keyup', (x: any) => {
            if (qs_num.attr('active')) {
                QuantityChanged(x.target.value);
            }
        });
        qs_mult.on('change paste keyup', (x: any) => {
            if (qs_mult.attr('active')) {
                QuantityChanged(x.target.value);
            }
        });
        qs_glass.on('change paste keyup', (x: any) => {
            if (qs_glass.attr('active')) {
                QuantityChanged(x.target.value);
            }
        });

        /* make Garnish checkbox available */
        const garnishcontainer = $('#isGarnish');
        IsGarnishButton.removeAttr('checked');
        if (CanBeGarnish(ingVal)) {
            garnishcontainer.removeClass('hidden');
            IsGarnishButton.attr('checked', 'true');
            IngredientToEdit.IsGarnish = true; /* initial value */
        } else {
            garnishcontainer.addClass('hidden');
            IngredientToEdit.IsGarnish = false; /* initial value */
        }
    }
    );

    /* register the changing Display Input Text */
    DTextInput.on('change', (x: any) => {
        const text = x.target.value as string;
        if (!text || text.length === 0) {
            IngredientToEdit.DisplayText = undefined;
        } else {
            IngredientToEdit.DisplayText = text;
        }
    });

    /* register the changing Garnish check value */
    IsGarnishButton.removeAttr('checked');
    IsGarnishButton.on('change', () => {
        IngredientToEdit.IsGarnish = !IngredientToEdit.IsGarnish;
        IngredientToEdit ? IsGarnishButton.attr('checked', 'true') : IsGarnishButton.removeAttr('checked');
        console.log('ayy' + IngredientToEdit.IsGarnish);
    });
}

/**
 * Checks whether a given ingredient can be a garnish. Used for elemnt display.
 * @param ingVal Ingredient id to check
 */
function CanBeGarnish(ingVal: number): boolean {
    // TODO make this a database thing later
    const garnishes = [193, 162, 190, 195, 233, 231, 237, 163, 156, 184, 250];
    return (garnishes.contains(ingVal));
}

/**
 * Checks whether a given ingredient should display the 'multiple' quantity select.
 * @param ingVal ingredient id to check Quantity type for
 */
function IngredientQuantityIsMultiple(ingVal: number): boolean {
    // TODO probably do a database thing later.
    return (ingVal === 195 || ingVal === 196 || ingVal === 150); // berry, mint leaf, mint sprig
}

/**
 * Checks whether a given ingredient should display the 'fill glass' quantity select.
 * @param ingVal ingredient id to check Quantity type for
 */
function IngredientQuantityIsGlass(ingVal: number): boolean {
    return (ingVal === 222 || ingVal === 243); // crushed ice, cracked ice
}

function CancelIngredientAdd() {
    $('#IngredientEntry').removeClass('entry_grid').addClass('hidden');

    /* regardless of what was happening before, we mark isEditing as false here */
    setEditState(false);
}

function RevealIngredientAdd() {
    $('#IngredientEntry').removeClass('hidden').addClass('entry_grid');
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
    CancelIngredientAdd,
    RevealIngredientAdd,
};