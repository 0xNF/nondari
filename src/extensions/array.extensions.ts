declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        /**
         * Clears all elements in this array.
         *
         * Modifies in-place.
         */
        contains(x: any): boolean;

        /**
         * Checks whether this array contains the the specified element.
         *
         * Wrapper over indexOf()
        */
        remove(x: any): number;

        /**
         * Removes the specified item and returns it.
         *
         * Returns -1 if not found.
         *
         * Wrapper over splice()
         */
        removeAt(x: any): Array<T>|undefined;

        /**
         * Removes the item at the specified index
         *
         * Returns the element at index, or undefined if not found.
         *
         * Throws if index was not a number
         *
         * Wrapper over splice()
         */
        any(f?: (t: T) => boolean): boolean;

        /**
         * If no function is supplied, checks that this array has length > 0.
         *
         * If a function is supplied, checks that at least one item in the array matches the predicate function.
         */
        clear(): void;
    }
}

Array.prototype.clear = function() {
    this.length = 0;
};


Array.prototype.contains = function(x) {
    return this.indexOf(x) > -1;
};


Array.prototype.remove = function(x) {
    const idx = this.indexOf(x);
    if (idx !== -1) {
        this.splice(idx, 1);
    }
    return idx;
};


Array.prototype.removeAt = function(x) {
    const n = parseInt(x);
    if (isNaN(n)) {
        throw 'Array.removeAt() takes an integer, or a integer-like string';
    }
    if (this.length > x) {
        return this.splice(n, 1);
    }
    return undefined;
};

Array.prototype.any = function(func) {
    if (!func) {
        return this.length > 0;
    }
    for (let i = 0; i < this.length; i++) {
        if (func(this[i])) {
            return true;
        }
    }
    return false;
};

export {}; // hack to modify global scope