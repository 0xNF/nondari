import { PageType } from '../types/pagetypes';

interface INavObject {
    currentPage: PageType;
    q: URLSearchParams;
}

export { INavObject };