import '../extensions/object.extensions';

// -- Utility Functions --\\
function Any(obj: object): boolean {
    return Object.entries(obj).length === 0 && obj.constructor === Object;
}

function IsUndefined(x: any): boolean {
    return(typeof x) === 'undefined';
}

/**
 * Ingredient quantites are always strings and sometimes contain ranges in the form of `"a-b"`
 * This method takes any quantity and returns the numerical version of that numer-string.
 *
 *
 * In the event of ranges, selects the highest range.
 * @param quantity Ingredient quantity to parse
 * @param max whether to take the maximum number. `true` if take max, `false` if take min.
 */
function useThisNumber(quantity: string, max: boolean = true): number {

    function takeMax(a: number, b: number) {
        return a > b ? a : b;
    }
    function takeMin(a: number, b: number) {
        return a < b ? a : b;
    }

    const taker: (a: number, b: number) => number = max ? takeMax : takeMin;

    if (quantity.contains('-')) {
        const splits: Array<string> = quantity.split('-');
        const numarr: Array<number>  = splits.map((x) => {
            const num = parseFloat(x);
            if (isNaN(num)) {
                console.error(`Error parsing a number from drink quantity value. Received ${x}`);
                return 0;
            }
            return num;
        });
        const toUse: number = numarr.reduce((p, c) => {
            return taker(p, c);
        }, 0);
        return toUse;
    }
    return +quantity;
}

export { Any, IsUndefined, useThisNumber };