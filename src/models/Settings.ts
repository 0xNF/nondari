interface ISidebarSettings {
    expanded: boolean;
}
interface ISymbolsSettings {
    upsymbol: string;
    downsymbol: string;
}
interface ITreeSettings {
    DepthMult?: number;
    CollapseDepth?: number;
    FontStart?: number;
    FontCollapse?: number;
    ShowCheckBox?: boolean;
    ShowCollapse?: boolean;
    Highlight?: Array<number | string>;
}

interface ISettings {
    sidebar: ISidebarSettings;
    symbols: ISymbolsSettings;
    tree: ITreeSettings;
}

const Settings: ISettings = {
    sidebar: {
        expanded: true,
    },
    symbols: {
        upsymbol: '▲',
        downsymbol: '▼',
    },
    tree: {
        DepthMult: 60,
        CollapseDepth: 3,
        FontStart: 24,
        FontCollapse: 6,
        ShowCheckBox: true,
        ShowCollapse: true,
        Highlight: [],
    }
};


export { Settings, ISidebarSettings, ISymbolsSettings, ITreeSettings, ISettings };