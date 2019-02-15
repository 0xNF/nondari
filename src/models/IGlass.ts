interface IGlass {
    Name: string;
    MaskURL: string;
    SVGURL: string;
    AvailableRows: number;
    Height: number;
    Width: number;
}

const MartiniGlass: IGlass = {
    Name: 'coupe',
    MaskURL: '/img/glasses/martini_mask.svg',
    SVGURL: '/img/glasses/martini.svg',
    AvailableRows: 17,
    Height: 376,
    Width: 247,
};

const CoupeGlass: IGlass = {
    Name: 'coupe',
    MaskURL: '/img/glasses/coupe2_mask.svg',
    SVGURL: '/img/glasses/coupe2.svg',
    AvailableRows: 13,
    Height: 336,
    Width: 247,
};

const OldFashionedGlass: IGlass = {
    Name: 'old fashioned',
    MaskURL: '/img/glasses/rocks2_mask.svg',
    SVGURL: '/img/glasses/rocks2.svg',
    AvailableRows: 22,
    Height: 226,
    Width: 247,
};

const RocksGlass: IGlass = {
    Name: 'rocks',
    MaskURL: '/img/glasses/rocks2_mask.svg',
    SVGURL: '/img/glasses/rocks2.svg',
    AvailableRows: 22,
    Height: 226,
    Width: 247,
};

const DoubleRocksGlass: IGlass = {
    Name: 'double rocks',
    MaskURL: '/img/glasses/rocks2_mask.svg',
    SVGURL: '/img/glasses/rocks2.svg',
    AvailableRows: 22,
    Height: 226,
    Width: 247,
};

const WhiskeyGlass: IGlass = {
    Name: 'whiskey',
    MaskURL: '/img/glasses/whiskey_mask.svg',
    SVGURL: '/img/glasses/whiskey.svg',
    AvailableRows: 22,
    Height: 226,
    Width: 247,
};

const CollinsGlass: IGlass = {
    Name: 'collins',
    MaskURL: '/img/glasses/collins3_mask.svg',
    SVGURL: '/img/glasses/collins3.svg',
    AvailableRows: 36,
    Height: 376,
    Width: 129,
};

const FluteGlass: IGlass = {
    Name: 'flute',
    MaskURL: '/img/glasses/flute_mask.svg',
    SVGURL: '/img/glasses/flute.svg',
    AvailableRows: 20,
    Height: 376,
    Width: 247,
};

const SourGlass: IGlass = {
    Name: 'sour',
    MaskURL: '/img/glasses/sour_mask.svg',
    SVGURL: '/img/glasses/sour.svg',
    AvailableRows: 30,
    Height: 376,
    Width: 247,
};

const IrishMug: IGlass = {
    Name: 'irish mug',
    MaskURL: '/img/glasses/irish_mug_mask.svg',
    SVGURL: '/img/glasses/irish_mug.svg',
    AvailableRows: 55,
    Height: 376,
    Width: 247,
};

const Stout: IGlass = {
    Name: 'stout',
    MaskURL: '/img/glasses/stout_mask.svg',
    SVGURL: '/img/glasses/stout.svg',
    AvailableRows: 36,
    Height: 376,
    Width: 247,
};

const ImperialPint: IGlass = {
    Name: 'imperial pint',
    MaskURL: '/img/glasses/imperial_pint_mask.svg',
    SVGURL: '/img/glasses/imperial_pint.svg',
    AvailableRows: 36,
    Height: 376,
    Width: 209,
};

const Highball: IGlass = {
    Name: 'highball',
    MaskURL: '/img/glasses/highball2_mask.svg',
    SVGURL: '/img/glasses/highball2.svg',
    AvailableRows: 29,
    Height: 296,
    Width: 169
};


const Glasses: ReadonlyArray<IGlass> = [
    CoupeGlass,
    RocksGlass,
    DoubleRocksGlass,
    WhiskeyGlass,
    CollinsGlass,
    FluteGlass,
    OldFashionedGlass,
    SourGlass,
    IrishMug,
    Stout,
    ImperialPint,
    Highball,
    MartiniGlass,
];


export {
    IGlass,
    Glasses
};