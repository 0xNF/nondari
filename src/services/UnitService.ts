import { IUnit, IUnitCategory } from '../models/IUnit';
import { Globals } from './Globals';

function UnitVal2Unit(val: number): IUnit {
    for (let i = 0; i < Globals.UnitTypes.length; i++) {
        const ucat: IUnitCategory = Globals.UnitTypes[i];
        const unit = ucat.Units.find(x => x.Id === val);
        if (unit) {
            return unit.Unit;
        }
    }
    console.error(`Failed to find a unit by the value given (${val})`);
    return undefined;
}

function UnitString2Unit(val: string): IUnit {
    for (let i = 0; i < Globals.UnitTypes.length; i++) {
        const ucat: IUnitCategory = Globals.UnitTypes[i];
        const unit = ucat.Units.find(x => x.Unit.Name === val);
        if (unit) {
            return unit.Unit;
        }
    }
    console.error(`Failed to find a unit by the value given (${val})`);
    return undefined;
}

/**
 * given a unit, convert it to an equivalent number of ounces
 * @param u Unit to convert to ounces
 * @returns the number of ounces the given unit reprents, or `-1` if not valid
 */
function Unit2OunceConverter(u: IUnit): number {
    if (u.Name === 'oz') {
        return 1;
    }
    if (u.Name === 'ts' || u.Name === 'bs') {
        return 1 / 6;
    }
    if (u.Name === 'ml') {
        return 1 / 32;
    } if (u.Name === 'lb') {
        return 16;
    } if (u.Name === 'tbs') {
        return 1 / 2;
    } if (u.Name === 'shot') {
        return 1.5;
    }
    return -1;

}

export {
    UnitVal2Unit,
    UnitString2Unit,
    Unit2OunceConverter,
};