import re, sqlite3

def o(f):
    with open(f, 'r', encoding='utf8') as fp:
        s = fp.read()
        return s

def repl(s):
    return s.replace('“', '"').replace('”', '"')

def getDrink(s):
    if(len(s.strip()) == 0):
        return

    # get id
    iid = s.split('Id=')[1]
    nlidx = iid.index('\n')
    id = iid[:nlidx]

    # get type
    t = s.split('T=')[1]
    nlidx = t.index('\n')
    ty = t[:nlidx]
    cap = list(ty)
    cap[0] = cap[0].upper()
    ty = ''.join(cap)

    # get glass
    g = s.split('G=')[1]
    nlidx = g.index('\n')
    gt = g[:nlidx]
    cap = list(gt)
    cap[0] = cap[0].upper()
    gt = ''.join(cap)

    # get name
    n = s.split('D=')[1]
    nlidx = n.index('\n')
    nt = n[:nlidx]
    cap = list(nt)
    cap[0] = cap[0].upper()
    nt = ''.join(cap)

    # get prelude
    iidx = s.index('I=')
    pidx = s.index('P=')
    p = s[pidx:iidx]
    pt = p.split('P=')[1]
    cap = list(pt)
    cap[0] = cap[0].upper()
    pt = ''.join(cap)

    # get instructions
    i = s.split('I=')[1]
    nlidx = i.index('\n')
    it = i[:nlidx]
    cap = list(it)
    cap[0] = cap[0].upper()
    it = ''.join(cap)

    forInsert = (ty.strip(), gt.strip(), pt.strip(), it.strip(), nt.strip(), id)
    return forInsert

def getDrinks(s):
    splits = s.split("@@@")
    splits = [x for x in splits if x is not None and len(x.strip()) > 0]
    drinks = [getDrink(x) for i,x in enumerate(splits) if x is not None or len(x) > 0]
    return [d for d in drinks if d is not None]

def write(d):
    conn = sqlite3.connect('./nondari.db')
    c = conn.cursor()
    print(d[0])
    q = "UPDATE Drinks SET Category=?, Glass=?, Prelude=?, Instructions=?, Name=? WHERE Id=?"
    c.executemany(q, d)
    conn.commit()

def main():
    x = o('./newdrinks.txt')
    x = repl(x)
    t = getDrinks(x)
    write(t)

if __name__ == "__main__":
    main()