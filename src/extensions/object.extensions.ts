
declare global {
    // tslint:disable-next-line:interface-name
    interface Object {
        entries(Object: object): Array<any>;
    }
}

export {}; // hack to modify global scope