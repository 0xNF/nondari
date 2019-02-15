import { IIngredientNode } from '../models/IIngredient';

const PantryKey: string = 'pantry';

function StorageGetPantryItems(): Array<IIngredientNode> {
    const x: string = localStorage.getItem(PantryKey);
    if (!x || x.length === 0) {
        return [];
    }
    const y: Array<IIngredientNode> = JSON.parse(x);
    return y;
}

function StorageAddPantryItem(item: IIngredientNode): void {
    const iarr: Array<IIngredientNode> = StorageGetPantryItems();
    iarr.push(item);
    const x: string = JSON.stringify(iarr);
    localStorage.setItem(PantryKey, x);
}

function StorageRemovePantryItem(item: IIngredientNode): void {
    const iarr: Array<IIngredientNode> = StorageGetPantryItems();
    for (let i = 0; i < iarr.length; i++) {
        if (iarr[i].id === item.id) {
            // if found, kill it. break.
            iarr.splice(i, 1);
            break;
        }
    }
    const x: string = JSON.stringify(iarr);
    localStorage.setItem(PantryKey, x);
}

function StorageClearPantry(): void {
    localStorage.removeItem(PantryKey);
}

export {
    StorageGetPantryItems,
    StorageAddPantryItem,
    StorageRemovePantryItem,
    StorageClearPantry,
};