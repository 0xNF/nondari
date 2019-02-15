
declare global {
    // tslint:disable-next-line:interface-name
    interface String {
        contains(x: any): boolean;
        any(f?: (char: string) => boolean): boolean;
    }
}

String.prototype.contains = function(x) {
    return this.indexOf(x) > -1;
};

String.prototype.any = function(f?: (char: string) => boolean) {
    if (f) {
        for (let i = 0; i < this.length; i++) {
            if (f(this[i])) {
                return true;
            }
        }
        return false;
    } else {
        return this.length > 0;
    }
};

export {}; // hack to modify global scope