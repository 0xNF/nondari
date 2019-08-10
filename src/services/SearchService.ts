import * as Fuse from 'fuse.js';
import { Globals } from './Globals';
import { IDrink } from '../models/IDrink';
import { IIngredient } from '../models/IIngredient';
import { isUndefined, isNullOrUndefined } from 'util';

const splitReg: RegExp = RegExp('[ _-]');


/* Fuse Search options */
const Options_DrinkMeta: Fuse.FuseOptions<any> = {
    shouldSort: true,
    includeScore: true,
    includeMatches: true,
    threshold: 0.1,
    location: 0,
    distance: 100000,
    maxPatternLength: 32,
    minMatchCharLength: 3,
    tokenize: true,
    keys: [
        {
            name: 'Name',
            weight: 0.6 /* name is weighted highest */
        },
        {
            name: 'Prelude',
            weight: 0.3
        },
        {
            name: 'Glass',
            weight: 0.1
        }
    ],
};

const Options_DrinkIngredients: Fuse.FuseOptions<any> = {
    shouldSort: true,
    includeScore: true,
    includeMatches: true,
    threshold: 0.3,
    location: 0,
    distance: 1000,
    maxPatternLength: 32,
    minMatchCharLength: 3,
    tokenize: false,
    keys: [
        {
            name: 'Ingredients.IngredientName',
        }
    ],
};

const drinksFuse: Fuse<IDrink, Fuse.FuseOptions<any>> = new Fuse(Globals.Drinks, Options_DrinkMeta);
const ingredientsFuse: Fuse<IDrink, Fuse.FuseOptions<any>> = new Fuse(Globals.Drinks, Options_DrinkIngredients);


interface MatchType {
    arrayIndex: number;
    indices: Array<Array<number>>;
    key: string;
    value: string;
}
interface RetType<T> {
    item: T;
    matches: Array<MatchType>;
    score: number;
}

function Search(str: string) {
    /* just in case it was called inappropriately  */
    if (isNullOrUndefined(str)) {
        console.error('called search with an empty or null string');
        return [];
    } else if (str === '') {
        return [];
    }
    const drinkMetaResults = drinksFuse.search(str);
    const drinkIngResults = ingredientsFuse.search(str);
    return [...drinkMetaResults, ...drinkIngResults];
}

function SearchWithRedirect(str: string) {
    const param = encodeURIComponent(str);
    window.location.href = `/search.html?q=${param}`;
}

function SearchDraw(params: string) {
    /* decode the info */
    const uparams: URLSearchParams = new URLSearchParams(params);
    const q: string = uparams.get('q');
    if (isNullOrUndefined(q)) {
        console.error('search hit with no params');
        return;
    }
    const searchVal: string = decodeURIComponent(q);
    $('#searchBox').val(searchVal);

    /* set the no results flags if necessary */
    const results: Array<RetType<IDrink>> = (Search(searchVal) as any);
    if (results.any()) {
        $('#no_results').addClass('hidden');
        $('#result_count').text(`(${results.length})`);
    } else {
        $('#no_results').removeClass('hidden');
    }

    /* construct the actual HTML nodes */
    for (let i = 0; i < results.length; i++) {
        const res: RetType<IDrink> = results[i];
        const node: JQuery<HTMLElement> = _ConstructSearchResultNode(res, i);
        const li = $(`<li id='result_li_${i}' class='searchresult'>`);
        li.append(node);
        $('#search_results').append(li);
    }
}

/* construction a search result node may be fairy complex */
function _ConstructSearchResultNode(res: RetType<IDrink>, i: number): JQuery<HTMLElement> {
    const container = $(`<div id='search_result_${i}' class='text'>`);

    const link = $(`<a href='/drinks.html#${res.item.DrinkId}' style='font-size:24px;'>`).text(res.item.Name);
    container.append(link);
    container.append($('<br>')).append($('<br>'));

    const maintext = $('<p>');
    let prevSub = 0;
    res.matches.forEach((x: MatchType) => {
        prevSub = 0;

        /* Showing the underline of where the match was found */
        const MatchDiv = $('<div>');
        const MatchHL = $(`<span style='text-decoration: underline'>`).text(x.key);
        MatchDiv.append(MatchHL).append($('<br>'));

        /* Assembling actual Match text */
        x.indices.forEach((arr) => {
            /* add all the text leading up to this match index */
            const fsplit = $('<span>').addClass('search_text');
            const t = x.value.substring(prevSub, arr[0]);
            fsplit.text(t);

            /* update the split index */
            prevSub = arr[1];

            /* construct the highlighted text portion */
            const span = _highlightByRange(x.value, arr[0], arr[1] + 1);
            prevSub += 1;

            /* add the lead up */
            MatchDiv.append(fsplit);

            /* add the highlight */
            MatchDiv.append(span);
        });

        /* add end */
        const cdr = x.value.substring(prevSub);
        const lsplit = $(`<span>`).addClass('search_text');
        lsplit.text(cdr);

        MatchDiv.append(lsplit);
        container.append(MatchDiv);
    });

    /* construct link element */
    container.append(maintext);
    return container;

}

function _highlightByRange(text: string, start: number, end: number): JQuery<HTMLElement> {
    const t = text.substring(start, end);
    const sp = $(`<span>`);
    sp.text(t);
    sp.addClass('search_highlight');
    return sp;
}


export {
    SearchWithRedirect as Search,
    Search as SearchByValue,
    SearchDraw,
};