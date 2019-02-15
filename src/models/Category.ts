
class Category {
    name: string;
    id: string;

    constructor(cat: string) {
        this.name = cat;
        this.id = cat.replace(/ /g, '_');
    }
}

export { Category };