import { Category } from '../models/Category';

function makeCategoryId(c: string): string {
    return c.replace(/ /g, '_');
}

function constructCategories(jdrinks: any): Array<Category> {
    const carr: Array<Category> = [];
    const catids: Array<string> = [];
    const cats = [];
    for (let i = 0; i < jdrinks.length; i++) {
        const cid = makeCategoryId(jdrinks[i].Category);
        if (!catids.contains(cid)) {
            const cat: Category = {
                id: cid,
                name: jdrinks[i].Category
            };
            cats.push(cat);
            catids.push(cat.id);
        }
    }
    cats.sort().forEach(x => carr.push(x));
    return carr;
}

export {
    makeCategoryId,
    constructCategories
};