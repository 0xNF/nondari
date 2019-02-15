import '../extensions/object.extensions';

// -- Utility Functions --\\
function Any(obj: object): boolean {
    return Object.entries(obj).length === 0 && obj.constructor === Object;
}

function IsUndefined(x: any): boolean {
    return(typeof x) === 'undefined';
}

export { Any, IsUndefined };