const splitReg: RegExp = RegExp("[ _-]");
function Search(str: string) {
    /* just in case it failed */
    if (!str) {
        return;
    }
    /* lower case the value, check for all whitespace */
    const searchValue = str.toLowerCase().trim();
    if (searchValue.length === 0) {
        return;
    }

    /* Create a token array of potential search terms */
    const searchTokens = searchValue.split(splitReg);


    /**
     * Find the following:
     *      - drink names
     *      - ingredient names
     *      - substrings in the Prelude
     */
}


export {
    Search
};