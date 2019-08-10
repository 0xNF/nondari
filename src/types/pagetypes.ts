type DrinkPage = 'drink';
type IngredientPage = 'ingredient';
type PantryPage = 'pantry';
type SearchPage = 'search';
type BuilderPage = 'builder';
type CustomPage = 'custom';

type PageType =
    | DrinkPage
    | IngredientPage
    | PantryPage
    | SearchPage
    | BuilderPage
    | CustomPage
    ;

export { PageType, DrinkPage, IngredientPage, PantryPage, BuilderPage, CustomPage, SearchPage };