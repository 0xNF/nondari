import * as SVG from 'svg.js';
import { IDrink } from '../models/IDrink';
import { IIngredient, IIngredientNode } from '../models/IIngredient';
import { NoSiblings, ITree, DFS } from '../models/ITree';
import { Ingredient2IngredientNode, makeIngredientIdForHTML } from './IngredientService';
import { GlassString2Glass } from './GlassService';
import { IGlass } from '../models/IGlass';
import { UnitString2Unit, Unit2OunceConverter } from './UnitService';
import { IUnit } from '../models/IUnit';
import { useThisNumber } from './Utils';

interface IElementMeta {
    Height: number;
    Width: number;
}

interface ISVGOptions {
    WidthCanvas: number;
    HeightCanvas: number;
    WidthElement: number;
    HeightElement: number;
    ScaleElement: number;
    DropletMeta: IElementMeta;
    LiquidMeta: IElementMeta;
    TwistMeta: IElementMeta;
    DropMeta: IElementMeta;
    IceCollinsMeta: IElementMeta;
    IceRegularMeta: IElementMeta;
    IceLargeMeta: IElementMeta;
    SugarCubeMeta: IElementMeta;
}

interface IIngredientRatio {
    ingredient: IIngredient;
    rational_base: number;
    rational_float: number;
    rational_integer: number;
    rowcount: number;
}

const SVGOptions: ISVGOptions = {
    WidthCanvas: 250,
    HeightCanvas: 80 * 4,
    WidthElement: 10,
    HeightElement: 10,
    ScaleElement: 1,
    DropletMeta: { Height: 25, Width: 25 },
    LiquidMeta: { Height: 10, Width: 10 },
    TwistMeta: { Height: 50, Width: 100 },
    DropMeta: { Height: 50, Width: 50 },
    IceCollinsMeta: { Height: 9999, Width: 9999 },
    IceRegularMeta: { Height: 25, Width: 25 },
    IceLargeMeta: { Height: 34, Width: 34 },
    SugarCubeMeta: { Height: 20, Width: 20 },
};


/* Used so we know what to highlight or de-highlight for mouseovers */
const GroupRegister: Array<SVG.Nested> = [];

/* these two variables help with layering ingredients in a criss-cross pattern */
let toff: boolean = false;
let offcounter: number = 0;

/* Constants for how many rows of a glass to dedicate to drawing particular ingredient types */
const BSRowCount: number = 2; /* number of rows we dedicate to drawing barspoons */
const FloatRowCoat: number = 1; /* number of rows we dedicate to drawing floats */

/* SVG Document variables */
let temp: SVG.Doc = null;
let canv: SVG.Container = null;
let iceG: SVG.Container = null;
let mainG: SVG.Container = null;
let glassG: SVG.Container = null;
let topG: SVG.Container = null;
let mask: SVG.Element = null;


/**
 * Resets the SVG space to a known initialization. Called before each new drink draw
 * @param glass Optional glass to call the reset with. Helps to properly size the bounding boxes. (Collins and punch bowls are bigger than whiskey glasses, for instance)
 */
function ResetSVGSpace(glass?: IGlass): void {
    GroupRegister.clear(); // Reset the array
    toff = false;
    offcounter = 0;
    mask ? mask.remove() : '';
    glassG ? glassG.remove() : '';
    mainG ? mainG.remove() : '';
    iceG ? iceG.remove() : '';
    topG ? topG.remove() : '';
    canv ? canv.remove().attr('id', 'main_canvas') : '';
    temp ? temp.remove().attr('id', 'temp') : '';

    temp = SVG('svgtmp').attr('id', 'svgtmp');
    canv = SVG('svg').attr('height', null).attr('width', null).viewbox(0, 0, SVGOptions.WidthCanvas, SVGOptions.HeightCanvas).attr('id', 'canv_vb');
    mainG = canv.nested().attr({ id: 'mg' });
    iceG = canv.nested().attr('id', 'iceg');
    glassG = canv.nested().attr('id', 'glassg');
    topG = canv.nested().attr('id', 'topg');
    mask = null;

    if (glass) {
        /* We set the viewbox to the height of the glass if we are handed one */
        canv.viewbox(0, 0, glass.Width, glass.Height);
    }
}

/**
 * Generates a function that will assist in mouseover events for each ingredient.
 * @param ingredient Ingredient to assign to the highlighter
 */
function highlightGroupGenerator(ingredient: IIngredient) {
    const f = function () {
        GroupRegister.forEach(x => x.attr('opacity', 0.3));
        GroupRegister.filter(x => x.id() === makeIngredientGroupId(ingredient))[0].attr('opacity', 1);
        const idLinkToFind = makeIngredientIdForHTML(ingredient);
        $('.ingdisplay').removeClass('inghighlight').addClass('ingdepress');
        $(`#${idLinkToFind}`).addClass('inghighlight').removeClass('ingdepress');
    };
    return f;
}

/**
 * Resets any ingredient highlighting
 */
function restoreGroups(): void {
    GroupRegister.forEach(x => x.attr('opacity', 1));
    $('.ingdisplay').removeClass('inghighlight').removeClass('ingdepress');
}

/**
 * Using the inherit tree-structure of the Ingredients, we search for the lowest available
 * svg symbol type in a given branch. This lets us use whatever top-level defaults
 * are available if a specific symbol doesn't exist.
 *
 * Converts the ingredient to an IngredientNode and calls `getIngredientSVGStyle()`
 * @param ing Ingredient type to retrieve an SVG type for
 * @param available list of all available ingredients to search over
 *
 * @returns a string representing the svg symbol type, or `null` if nothing at all was found
 */
function getIngredientSVGStyle(ing: IIngredient, available: Array<IIngredientNode>): string {
    const converted: IIngredientNode = Ingredient2IngredientNode(ing);
    return getIngredientNodeSVGStyle(converted, available);
}

/**
 * Using the inherit tree-structure of the Ingredients, we search for the lowest available
 * svg symbol type in a given branch. This lets us use whatever top-level defaults
 * are available if a specific symbol doesn't exist.
 *
 * This is the base method for `getIngredientSVGStyle`
 *
 * @param ing Ingredient type to retrieve an SVG type for
 * @param available list of all available ingredients to search over
 *
 * @returns a string representing the svg symbol type, or `null` if nothing at all was found
 */
function getIngredientNodeSVGStyle(ing: IIngredientNode, available: Array<IIngredientNode>): string {
    let path: ITree = null;
    for (let i = 0; i < available.length; i++) {
        const tree: IIngredientNode = available[i];
        const res: IIngredientNode = NoSiblings(tree, ing, true);
        if (res && res.id !== -1) {
            path = res;
            break;
        }
    }
    if (!path) {
        console.error('Failed to find any matching ingredient path for the supplied ingredient');
        return null;
    }

    let highestImageUrl: string = null;
    DFS(path, (n: IIngredientNode) => {
        if (n.symbol) {
            highestImageUrl = n.symbol;
        }
    });
    return highestImageUrl;
}

const smap: { [key: string]: string } = {

};


/**
 * Returns the number of rows each ingredient should take up given the drink's glass.
 * @param drink the drink containing the list of ingredients and their quantites to use
 */
function calculateLiquidRatios(drink: IDrink): Array<IIngredientRatio> {
    const ounces: Array<IIngredient> = drink.Ingredients.filter(x => x.Unit === 'oz' || x.Unit === 'shot');
    const total: number = ounces.reduce((p, c) => {
        let num = useThisNumber(c.Quantity);
        // get unit
        const unit: IUnit = UnitString2Unit(c.Unit);
        const inOunces = Unit2OunceConverter(unit);
        if (inOunces === -1) {
            return p; // skip invalids
        }
        num *= inOunces;
        return p + num;
    }, 0);

    const numOtherRows = drink.Ingredients.filter(x => x.Unit === 'splash' || x.Unit === 'float' || x.Unit === 'top').length * FloatRowCoat; // We dedicate a single row to each of these types.
    const numBarSpoons = drink.Ingredients.filter(x => x.Unit === 'bs' || x.Unit === 'ts').length * BSRowCount; // we dedicate 2 rows to each bs ingreditent.

    const glass: IGlass = GlassString2Glass(drink.Glass);
    const ratios: Array<IIngredientRatio> = ounces.map(x => {
        const q: number = useThisNumber(x.Quantity);
        const ratf: number = (q / total);
        const rati: number = Math.ceil(ratf * 100);

        const rt: number = (glass.AvailableRows - numOtherRows - numBarSpoons) * ratf;
        const obj: IIngredientRatio = {
            ingredient: x,
            rational_base: ratf,
            rational_float: ratf * 100,
            rational_integer: rati,
            rowcount: Math.ceil(rt)
        };
        return obj;
    });
    return ratios;
}

/**
 * Returns an array of ice cubes in a given drink, if any
 * @param drink Drink to get ice cubes from
 */
function getIceCubeIngredients(drink: IDrink): Array<IIngredient> {
    const cubes: Array<IIngredient> = drink.Ingredients.filter(x => x.IngredientName.toLocaleLowerCase().contains('ice cube') && x.Unit !== 'long cube' && x.DisplayOrder > -1);
    return cubes;
}

function getOtherGanirshes(drink: IDrink): Array<IIngredient> {
    const ret = drink.Ingredients.filter((x) => {
        return x.IsGarnish && x.Unit !== 'twist' && x.Unit !== 'drop' && x.Unit !== 'pinch' && x.Unit !== 'float' && x.DisplayOrder > -1;
    });
    return ret;
}

function getTwistsAndDrops(drink: IDrink): Array<IIngredient> {
    const ret = drink.Ingredients.filter(x => (x.Unit === 'twist' || x.Unit === 'drop') && x.DisplayOrder > -1);
    return ret;
}

function getPinchesAndDashes(drink: IDrink): Array<IIngredient> {
    const ret = drink.Ingredients.filter(x => (x.Unit === 'dash' || x.Unit === 'pinch') && x.DisplayOrder > -1);
    return ret;
}

function getLeavesOrSprigs(drink: IDrink): Array<IIngredient> {
    const ret = drink.Ingredients.filter(x => (x.Unit == 'leaf' || x.Unit == 'sprig') && x.DisplayOrder > -1);
    return ret;
}

async function GetSVG(url: string): Promise<string> {
    if (url in smap) {
        return smap[url];
    } else {
        const r = await fetch(url);
        const t = await r.text();
        smap[url] = t;
        return t;
    }
}


function mdraw(maskS: string, id: string): SVG.Element {
    const m: SVG.Element = temp.clone().svg(maskS);
    m.remove().attr('id', id);
    return m;
}

function gdraw(glassS: string, maskS: string): void {
    const g: SVG.Element = temp.clone().svg(glassS);
    g.remove().attr('id', 'glasss_main');
    glassG.add(g);
    const m: SVG.Element = mdraw(maskS, 'glass_mask');
    glassG.add(m);
    mask = m;
}

function icdraw(cube: IIngredient, cubeS: string, count: number, g: SVG.G, glass: IGlass): void {
    // What is the height of an icecube?
    let iceheight = 34; // todo encode this better for each ice cube.
    let magicMult = 0;
    if (cube.IngredientId === 223) {
        iceheight = SVGOptions.IceLargeMeta.Height;
        magicMult = 4;
    } else if (cube.IngredientId === 221 || cube.IngredientId === 224) {
        iceheight = SVGOptions.IceRegularMeta.Height;
        magicMult = 3;
    } else {
        console.error('Attempted to draw ice cube with an incorrect ingredient id: ' + cube.IngredientId);
        return;
    }
    const ice: SVG.Element = temp.clone().svg(cubeS);
    ice.remove().attr('id', 'ice_cube');
    ice.x(glass.Width / 4); // width begins counting from farthest left. We go 25% in to center againt the backing element (the GlassG)
    ice.y(glass.Height - ((iceheight * (count + 1)) * magicMult)); // +1 to account for zero being off screen *4 because??
    g.add(ice);
}


/* Makes a row of SVG ingredient icons */
function makeRow(s: string): SVG.Nested {
    const spacing: number = SVGOptions.HeightElement * 2;
    const cloneTimes: number = 15;

    const rowGroup: SVG.Nested = canv.nested().attr('id', `rowgroup_${offcounter}`);
    const first = rowGroup.nested().svg(s).attr('id', `stamp_${offcounter}`).height(SVGOptions.HeightElement);
    for (let i = 1; i < cloneTimes; i++) {
        const dx: number = i * spacing;
        const stamp: SVG.Element = rowGroup.use(first).attr('id', `use_${offcounter}_${i - 1}`).x(dx);
    }
    rowGroup.remove();
    return rowGroup;
}

/* Given a grouped row of ingredient icons, place it in our main group */
function drawRow(s: string, g: SVG.G): void {
    const row: SVG.Nested = makeRow(s);
    const dx: number = toff ? SVGOptions.HeightElement : 0;
    const dy: number = offcounter * SVGOptions.HeightElement;
    row.x(dx).y(dy);
    g.add(row);
}

async function addStack(s: string, g: SVG.G): Promise<void> {
    const t: string = await GetSVG(s);
    drawRow(t, g);
    toff = !toff;
    offcounter += 1;
}

function makeIngredientGroupId(ingredient: IIngredient): string {
    const gid = `group_${ingredient.IngredientId}_${ingredient.Unit.replace(' ', '')}_${ingredient.Quantity.replace('-', '_')}`;
    return gid;
}

function makeIngredientGroup(ingredient: IIngredient): SVG.G {
    const gid = makeIngredientGroupId(ingredient);
    const svgg = temp.group();
    svgg.attr('id', gid).addClass('svginghighlighter');
    svgg.remove();

    GroupRegister.push(svgg);
    svgg.on('mouseover', highlightGroupGenerator(ingredient));
    svgg.on('mouseout', restoreGroups);

    return svgg;
}


async function drawIngredient(ingArr: Array<IIngredient>, rowCount: number, universe: Array<IIngredientNode>) {
    for (let i = 0; i < ingArr.length; i++) {
        const ing: IIngredient = ingArr[i];
        const svgu: string = getIngredientSVGStyle(ing, universe);
        if (svgu === null) {
            console.error('Whoaaaah something happened while trying to draw an SVG bs');
            return;
        }
        const svgg: SVG.G = makeIngredientGroup(ing);
        mainG.add(svgg);
        for (let k = 0; k < rowCount; k++) {
            await addStack(`/img/ingredients/${svgu}.svg`, svgg);
        }
    }
}

async function drawTop(ingredient: IIngredient, start_x: number, off_x: number, start_y: number, off_y: number, elem_height: number, universe: Array<IIngredientNode>): Promise<SVG.G> {
    const g: SVG.G = makeIngredientGroup(ingredient);
    const svgu: string = getIngredientSVGStyle(ingredient, universe);
    const s: string = await GetSVG(`/img/ingredients/${svgu}.svg`);
    const first = temp.clone().svg(s).remove();
    first.x(start_x - off_x);
    first.y(start_y - off_y);
    g.add(first);
    const utn: number = useThisNumber(ingredient.Quantity);
    for (let k = 1; k < utn; k++) {
        const stamp: SVG.Element = g.use(first);
        stamp.dy(-(k * elem_height));
    }
    return g;
}


async function DrawDrinkSVG(drink: IDrink, universe: Array<IIngredientNode>) {

    const glass: IGlass = GlassString2Glass(drink.Glass);
    ResetSVGSpace(glass);

    /* Get Glass svgs */
    const glassS: string = await GetSVG(glass.SVGURL);
    const glassM: string = await GetSVG(glass.MaskURL);

    /* Draw Splashes */
    const splashes: Array<IIngredient> = drink.Ingredients.filter(x => x.Unit === 'splash' || x.Unit === 'float' || x.Unit === 'top');
    await drawIngredient(splashes, FloatRowCoat, universe);

    /* Draw bar spoons */
    const bss: Array<IIngredient> = drink.Ingredients.filter(x => x.Unit === 'bs' || x.Unit === 'ts');
    await drawIngredient(bss, BSRowCount, universe);

    /* Draw the liquid ingredients */
    const liqrats: Array<IIngredientRatio> = calculateLiquidRatios(drink);
    for (let i = liqrats.length - 1; i >= 0; i--) {
        /* full arayy not handed in because each liquid has a unique row count. So we wrap each in a single-array */
        await drawIngredient([liqrats[i].ingredient], liqrats[i].rowcount, universe);
    }

    gdraw(glassS, glassM);
    mainG.maskWith(mask);


    /* Draw the Ice Cubes if any */
    const cubes: Array<IIngredient> = getIceCubeIngredients(drink);
    for (let i = 0; i < cubes.length; i++) {
        const cube = cubes[i];
        const cubeCount = useThisNumber(cube.Quantity);
        const svgu: string = getIngredientSVGStyle(cube, universe);
        const s: string = await GetSVG(`/img/ingredients/${svgu}.svg`);
        const svgg: SVG.G = makeIngredientGroup(cube);
        mainG.add(svgg);
        for (let c = 0; c < cubeCount; c++) {
            icdraw(cube, s, c, svgg, glass);
        }
    }

    /**
     * Draw top items
     * we collect all height information up front so we can draw properly
     */

    const additionalHeights: Array<number> = [0];
    const additionalSidePush: Array<number> = [0];

    const garnishes: Array<IIngredient> = getOtherGanirshes(drink);
    const garnishHeight = 90;
    additionalSidePush.push(Math.min(1, garnishes.length) * garnishHeight / 2); // todo height of garnish. We only take one, we do not stack garnishes
    additionalHeights.push(Math.min(1, garnishes.length) * garnishHeight / 2); // we split the dimensions of a garnish across the x and y vectors

    const leaves: Array<IIngredient> = getLeavesOrSprigs(drink);
    additionalHeights.push((leaves.length * garnishHeight))

    /* here we calculate the additional height we need to add to our drawing to account for top-items like drops and pinches and bitters */

    const twists: Array<IIngredient> = getTwistsAndDrops(drink);
    additionalHeights.push(twists.length * SVGOptions.TwistMeta.Height);

    const pinchesAndDashes: Array<IIngredient> = getPinchesAndDashes(drink);
    additionalHeights.push(pinchesAndDashes.map(x => useThisNumber(x.Quantity)).reduce((p, c) => {
        if (c > p) {
            return c;
        } else {
            return p;
        }
    }, 0) * SVGOptions.DropletMeta.Height);
    const additionalHeightNeeded: number = Math.max(...additionalHeights);

    const additionalSidePushNeeded: number = Math.max(...additionalSidePush);

    /* Draw Twists and Drops */
    for (let i = 0; i < twists.length; i++) {
        const twist = twists[i];
        const elem_height: number = SVGOptions.TwistMeta.Height;
        const start_x: number = 0; /* Draws from right-to-left */
        const off_x: number = 0; /* Does not move x's */
        const off_y: number = ((i + 1) * elem_height); /* will move down by some amount for each ingredient */
        const start_y: number = additionalHeightNeeded; /* Starts drawing bottom up */
        const svgg: SVG.G = await drawTop(twist, start_x, off_x, start_y, off_y, elem_height, universe);
        topG.add(svgg);
    }

    /* Draw pinches and dashes */
    for (let i = 0; i < pinchesAndDashes.length; i++) {
        const dash = pinchesAndDashes[i];
        const elem_height: number = SVGOptions.DropletMeta.Height;
        const start_x: number = glass.Width; /* Draws from left-to-right */
        const off_x: number = (elem_height * (i + 1)); /* will move some amount to the side for each different-type ingredient */
        const off_y: number = elem_height; /* will move down by some amount for each same-ingredient */
        const start_y: number = additionalHeightNeeded; /* starts drawing bottom up */
        const svgg: SVG.G = await drawTop(dash, start_x, off_x, start_y, off_y, elem_height, universe);
        topG.add(svgg);
    }

    /* Draw Cracked or Crushed Ice if any */
    const crackedIce: IIngredient = drink.Ingredients.filter(x => x.Unit === 'cracked' || x.Unit === 'crushed').find(x => true);
    if (crackedIce) {

        const heightIce = 25;

        async function crackedDraw(s, g) {
            const t: string = await GetSVG(s);

            const spacing: number = heightIce * 2;
            const cloneTimes: number = 15;

            const rowGroup: SVG.Nested = temp.nested().attr('id', `rowgroup_cracked_${iceoff}`);
            const first = rowGroup.nested().svg(t).attr('id', `stamp_cracked_${iceoff}`).height(heightIce);
            for (let i = 1; i < cloneTimes; i++) {
                const dx: number = i * spacing;
                const stamp: SVG.Element = rowGroup.use(first).attr('id', `use_cracked_${iceoff}_${i - 1}`).x(dx);
            }
            const row = rowGroup.remove();
            const dx: number = icetoff ? heightIce : 0;
            const dy: number = iceoff * heightIce;
            row.x(dx).y(glass.Height - dy);
            g.add(row);
            icetoff = !icetoff;
            iceoff += 1;
        }

        let iceoff: number = 0;
        let icetoff = false;

        const svgu: string = getIngredientSVGStyle(crackedIce, universe);
        const svgs: string = `/img/ingredients/${svgu}.svg`;
        const svgg = makeIngredientGroup(crackedIce).remove();
        const count = (crackedIce.Quantity === 'half' ? glass.Height / 2 : glass.Height) / heightIce;
        for (let i = 0; i < count; i++) {
            await crackedDraw(svgs, svgg);
        }

        const m: SVG.Element = mdraw(glassM, 'icemask');
        iceG.maskWith(m);
        iceG.add(svgg);
        mainG.front();
    }

    /* Draw Collins Ice Cubes, if any */

    const collins: IIngredient = drink.Ingredients.filter(x => x.Unit === 'long cube').find(x => true);
    if (collins) {
        async function collinsDraw(s: string, g: SVG.G) {
            const t: string = await GetSVG(s);
            const rowGroup: SVG.Nested = temp.nested().attr('id', `rowgroup_collins`);
            const first = rowGroup.nested().svg(t).attr('id', `stamp_collins`);
            const row = rowGroup.remove();
            const widthIce = 90;
            first.x((glass.Width / 2) - (widthIce / 2));
            first.dy(glass.Height / 10);
            g.add(row);
        }
        const svgu: string = getIngredientSVGStyle(collins, universe);
        const svgs: string = `/img/ingredients/${svgu}.svg`;
        const svgg = makeIngredientGroup(collins).remove();
        await collinsDraw(svgs, svgg);
        const m: SVG.Element = mdraw(glassM, 'icemask');
        iceG.maskWith(m); /* we mask with another glass_mask */
        iceG.add(svgg);
        mainG.front(); /* ingredients come forward, meaning ice gets drawn behind. */
    }

    /* draw garnishes, if any */
    // todo fix side push collisions with bitters and pinches
    if (garnishes.length > 0) {
        for (let i = 0; i < garnishes.length; i++) {
            // todo we cheat here to only draw one of each garnish. Garnishes are special and only drawn one time per.
            const garnish: IIngredient = {
                ...garnishes[i],
                Quantity: '1'
            };
            const isMint = (garnish.Unit === 'leaf' || garnish.Unit === 'sprig');
            const mintHeight = 90;
            const elem_height: number = isMint ? mintHeight : (mintHeight / 2); // todo height of garnish element divided by 2
            const start_x: number = isMint ? 0 : -(elem_height); /* Draws from right-to-left */
            const off_x: number = 0; /* Does not move x's */
            const off_y: number = ((i + 1) * elem_height); /* will move down by some amount for each ingredient */
            const start_y: number = additionalHeightNeeded; /* Starts drawing bottom up */
            const svgg: SVG.G = await drawTop(garnish, start_x, off_x, start_y, off_y, elem_height, universe);
            topG.add(svgg);
        }
    }

    const currentVbHeight = canv.viewbox().height;
    canv.viewbox(0, 0, SVGOptions.WidthCanvas + additionalSidePushNeeded, currentVbHeight + additionalHeightNeeded);

    /* shift everything over by the needed amounts */
    /* y */
    mainG.dy(additionalHeightNeeded);
    glassG.dy(additionalHeightNeeded);
    iceG.dy(additionalHeightNeeded);
    /* x */
    mainG.dx(additionalSidePushNeeded);
    glassG.dx(additionalSidePushNeeded);
    iceG.dx(additionalSidePushNeeded);
    topG.dx(additionalSidePushNeeded);



}

async function DrawIngredientSVG(ingredient: IIngredientNode, universe: Array<IIngredientNode>) {
    const svgu: string = getIngredientNodeSVGStyle(ingredient, universe);
    if (svgu === null) {
        console.error('Whoaaaah something happened while trying to draw an SVG');
        return;
    }
    const svgs: string = await GetSVG(`/img/ingredients/${svgu}.svg`);
    const scale = 1;
    const canvas = SVG('svgholder').attr('width', `${SVGOptions.HeightElement * scale}px`).attr('height', `${SVGOptions.HeightElement * scale}px`);
    canvas.svg(svgs).scale(scale);

    return;
}

export {
    ResetSVGSpace,
    DrawDrinkSVG,
    DrawIngredientSVG,
    makeIngredientGroupId,
    restoreGroups,
    highlightGroupGenerator,
    getIngredientNodeSVGStyle,
};

