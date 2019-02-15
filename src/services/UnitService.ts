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
}


export {
    UnitVal2Unit,
};