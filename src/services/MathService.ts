import core = require('mathjs/core');
const math = core.create();
math.import(require('mathjs/lib/type/fraction'));
math.import(require('mathjs/lib/function/string/format'));

export {
    math
};