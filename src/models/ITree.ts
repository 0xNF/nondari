import '../extensions/array.extensions';
import { IIngredientNode } from './IIngredient';

interface ITree {
    id: number;
    children: Array<ITree>;
}

type TreeViitorFunctor<T extends ITree> = (node: T, depth: number) => void;
type TreeViitorFunctor2<T extends ITree, K> = (node: T, depth: number, ret: K) => K;


/**
 * Searches an entire tree, calling `functor(currentNode, currentDepth)` for each node visited
 * @param tree - The tree to traverse
 * @param functor - the function to be called on each node
 */
function DFS<T extends ITree>(tree: T, functor: TreeViitorFunctor<T>) {
    function dfsh<T extends ITree>(node: T, depth: number, f: TreeViitorFunctor<T>) {
        f(node, depth);
        for (let i = 0; i < node.children.length; i++) {
            dfsh(node.children[i], depth + 1, f);
        }
    }
    return dfsh(tree, 0, functor);
}


/**
 * Searches the entire tree, calling the `functor` for each node visited, while also passing
 * the accumulator to each invocation of the functor.
 * @param tree The tree to search
 * @param functor The function to apply to each node. Takes (node, depth, accumulator)
 * @param accumulator An argument to pass along to each node.
 */
function DFSAcc<T extends ITree, K>(tree: T, functor: TreeViitorFunctor2<T, K>, accumulator: K): void {
    function dfsh<T extends ITree>(node: T, depth: number, f: TreeViitorFunctor2<T, K>, accumulator: K) {
        accumulator = f(node, depth, accumulator);
        for (let i = 0; i < node.children.length; i++) {
            dfsh(node.children[i], depth + 1, f, accumulator);
        }
    }
    dfsh(tree, 0, functor, accumulator);
}


/**
 * Given a Tree, returns a branch-pruned version of the three where the only children are the
 * nodes on the way to the target.
 * @param branch - tree to search through
 * @param target - node to find
 * @param noChildren - Whether to include a full children array in the target element. Default `true`.
 *
 * @returns Returns an ITree with no siblings and only the critical path nodes,
 * or an empty ITree (id === -1) if nothing was found.
 */
function NoSiblings<T extends ITree>(branch: T, target: T, noChildren: boolean = false) {

    const nb = JSON.parse(JSON.stringify(branch));

    function dfs2(b: ITree, stack: Array<ITree>) {
        stack.push(b);
        if (b.id === target.id) {
            if (noChildren) {
                b.children.clear();
            }
            return true;
        }
        const c = b.children;
        while (c.any()) {
            const child = c[c.length - 1];
            const found = dfs2(child, stack);
            if (found) {
                c.filter(x => !stack.contains(x)).forEach(x => c.remove(x));
                return true;
            }
            c.remove(child);
        }
        stack.pop();
        return false;
    }

    const stack: Array<T> = [];
    const found = dfs2(nb, stack);
    if (!found) {
        return {id: -1, children: []};
    } else {
     return nb; // stack
    }
}

export { ITree, DFS, NoSiblings, DFSAcc as DFS2 };