import { ResetSVGSpace, getIngredientNodeSVGStyle } from './SVGService';
import { IDrink } from '../models/IDrink';
import { Globals } from './Globals';
import { IIngredient, IIngredientNode } from '../models/IIngredient';
import { DFS, ITree, NoSiblings } from '../models/ITree';
import { IDisplayUnit, IUnit } from '../models/IUnit';
import { UnitVal2Unit } from './UnitService';
import { IngredientVal2IngredientNode } from './IngredientService';
import { displayDrink } from './DrinkDisplayService';
import { ISelectedDrink } from '../models/SelectedDrinkObject';

interface IAddedIngredient {
    id: number;
    ingredient: IIngredient;
}

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

async function setDrinkName(text: string): Promise<void> {
    console.log('drink name:');
    console.error(text);
    DrinkToDraw.Name = text;
    await BuilderDraw();
}

async function setCategoryType(val: string): Promise<void> {
    console.log('drink category raw:');
    console.log(val);
    DrinkToDraw.Category = val;
    await BuilderDraw();
}

async function setGlassType(val: string): Promise<void> {
    console.log('drink glass raw:');
    console.log(val);
    DrinkToDraw.Glass = val;
    await BuilderDraw();
}

async function pushIngredient(globalId: number, ingredient: IIngredient) {
    const ai: IAddedIngredient = {
        id: globalId,
        ingredient: ingredient,
    };
    AddedIngredients.push(ai);
    DrinkToDraw.Ingredients.clear();
    AddedIngredients.forEach(x => DrinkToDraw.Ingredients.push(x.ingredient));
    console.log(DrinkToDraw);
    BuilderDraw();
}

function editIngredient(globalId: number) {
    // wat do.
    // don't push again, find the ingredient and change values
}

async function removeIngredient(gloabalId: number): Promise<void> {
    const remove = AddedIngredients.filter(x => x.id === gloabalId);
    remove.forEach(x => AddedIngredients.remove(x));
    DrinkToDraw.Ingredients.clear();
    AddedIngredients.forEach(x => DrinkToDraw.Ingredients.push(x.ingredient));
}

/* also functions as an init function when passed parameters */
async function BuilderDraw(glass?: string, category?: string) {

    /* populate initial units */
    if (units.any()) {
        Globals.Drinks.map(x => x.Ingredients.map(y => y.Unit)).reduce((p, c) => {
            // c is a list of units
            c.forEach((z) => {
                p.contains(z) ? null : p.push(z);
            });
            return p;
        }, units);
    }

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
    displayDrink(sdo);
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
    console.log(cat);
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
    // populate ingredient pulldown
    for (const key in Globals.IngredientFlat) {
        const ingredient = Globals.IngredientFlat[key];
        const symbol = getIngredientNodeSVGStyle(ingredient, Globals.ingredients);
        if (symbol) { /* only symbolized ingredients */
            const ingId = ingredient.id;
            const ingName = ingredient.name;
            const opt = $('<option>').attr('id', `${base}_ingredient_select_option_${ingId}`);
            opt.val(ingId);
            opt.text(ingName);
            sel.append(opt);
        }
    }
    // when option select changes, reset the unit pulldown
    sel.on('change', () => {
        const ingVal: number = parseInt(sel.val() as string);
        ingredient.Unit = assignUnitPulldown(ingVal, unitPulldown).Name;
        const node: IIngredientNode = IngredientVal2IngredientNode(ingVal);
        if (!node) {
            return; // ERROR
        }
        ingredient.IngredientName = node.name;
        ingredient.IngredientId = node.id;
        console.log('Ingredient Chosen:');
        console.log(node);
    });

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
        console.log('Unit Chosen: ');
        console.log(u);
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
        console.log('Display text: ' + text);
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
        console.log('quantity chosen: ' + quantity);
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
        console.log(but.attr('checked'));
        console.log('garnish change to ' + isOn);
        ingredient.IsGarnish = isOn;
    });

    label.append(but);
    return label;
}

function createAcceptButton(base: string, iid: number, ingredient: IIngredient): JQuery<HTMLElement> {
    const id = `${base}_accept_button`;
    const but = $('<button>').attr('id', id).addClass(['btn', 'btn-xs', 'btn-primary']).text('OK');
    but.on('click', async () => {
        console.log('accept ingredient clicked');
        console.log(ingredient);
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



export {
    setDrinkName,
    setCategoryType,
    setGlassType,
    BuilderDraw,
    removeIngredient,
    addIngredient,
};