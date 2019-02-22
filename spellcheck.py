import sqlite3

def fetch():
    conn = sqlite3.connect('./nondari.db')
    c = conn.cursor()
    q = "SELECT Id, Category, Glass, Prelude, Instructions, Name FROM Drinks"
    l = []
    for row in c.execute(q):
        id = row[0]
        cat = row[1]
        glass = row[2]
        prelude = row[3]
        inst = row[4]
        name = row[5]
        l.append(("Id="+str(id), "T="+cat,"D="+name,"G="+glass,"P="+prelude,"I="+inst))
    return l


def writetxt(d):
    with open('./drinks.txt', 'w', encoding="utf8") as f:
        for drink in d:
            s = "@@@\n"
            s += "\n".join(drink)
            f.write(s)

def main():
    ds = fetch()
    print(ds[0])
    writetxt(ds)
    return ds

if __name__ == "__main__":
    main()