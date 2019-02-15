import { IDrink } from '../models/IDrink';
import { IGlass, Glasses } from '../models/IGlass';

function constructGlasses(jdrinks: any): Array<string> {
    const ret: Array<string> =  jdrinks.map((x: IDrink) => x.Glass).filter((v: string, i: number, s: Array<string>) => { return s.indexOf(v) === i; }).sort();
    return ret;
}

function GlassString2Glass(gstring: string): IGlass | null {
    const gs = Glasses.filter(x => x.Name.toLocaleLowerCase() === gstring.toLocaleLowerCase());
    if (gs.length > 0) {
        return gs[0];
    }
    return null;
}

export {
    constructGlasses,
    GlassString2Glass
};