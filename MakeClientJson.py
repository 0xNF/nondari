import sys, os, sqlite3, json

db = "./nondari.db"

def GetDrinks():
    conn = sqlite3.connect(db)
    c = conn.cursor()
    #q = "SELECT * FROM Drinks AS d JOIN IngredientsMap AS im ON im.DrinksId = d.Id ORDER BY d.Id, im.DisplayOrder;"
    q = "SELECT d.Id as DrinkId, d.Category, d.Glass, d.Prelude, d.Instructions, d.Name as DrinkName, ct.Id AS IngredientId, im.Quantity, im.Unit, ct.Name, im.DisplayText, im.DisplayOrder, im.PreferenceFor, im.IsGarnish FROM Drinks AS d JOIN IngredientsMap2 AS im ON im.DrinksId = d.Id JOIN CategoryTree AS ct ON im.IngredientId = ct.Id ORDER BY d.Id, im.DisplayOrder;"
    drinks = {}
    for row in c.execute(q):
        # Drink Meta
        drinkid = row[0]
        if drinkid not in drinks:
            category = row[1]
            glass = row[2]
            prelude = row[3]
            instructions = row[4]
            name = row[5]
            drinks[drinkid] = {"DrinkId": drinkid, "Category": category, "Glass": glass, "Prelude": prelude, "Instructions": instructions, "Name": name, "Ingredients": []}
        
        # Ingredient Meta
        ingId = row[6]
        quantity = row[7]
        unit = row[8]
        iname = row[9]
        dtext = row[10]
        dorder = row[11]
        pref = row[12]
        isGarnish = row[13] == 1

        ing = {"IngredientId": ingId, "Quantity": quantity, "Unit": unit, "IngredientName": iname, "DisplayText": dtext, "DisplayOrder": dorder, "PreferenceFor": pref, "IsGarnish": isGarnish}
        drinks[drinkid]["Ingredients"].append(ing)

    return list(drinks.values())

def GetIngredientTree():
    conn = sqlite3.connect(db)
    c = conn.cursor()
    
    cats = {}
    q = "SELECT Id, Name, Parent, DistanceFromParent, Symbol, UnitPreference FROM CategoryTree ORDER BY Parent ASC" # Start at the root and go down.
    for catr in c.execute(q):
        id = catr[0]
        name = catr[1]
        parent = catr[2]
        distanceFromParent = catr[3]
        symbol = catr[4]
        upref = catr[5]
        cat =  {"name": name, "id": id, "parent": parent, "children": [], "distance": distanceFromParent, "symbol": symbol, 'unitpreference': upref} #Category(name, id, parent)
        cats[id] = cat
        #finding parent if exists
        if parent in cats:
            cats[parent]["children"].append(cat)

    return [x for x in  cats.values() if x["parent"] is None]

def GetUnits():
    conn = sqlite3.connect(db)
    c = conn.cursor()

    q = "SELECT um.UnitType AS UnitTypeId, ut.TypeName AS UnitTypeName, um.Unit AS UnitId, u.Name AS UnitName, u.Plural as Plural, um.OrderPreference AS OrderPref FROM UnitMap AS um JOIN UnitTypes AS ut ON ut.Id=um.UnitType JOIN Units AS u ON u.Id=um.Unit;"
    Units = {}
    UnitTypes = {}

    for u in c.execute(q):
        # broad unit container
        unitTypeId = u[0]
        unitTypeName = u[1]
        if unitTypeId in UnitTypes:
            unitType = UnitTypes[unitTypeId]
        else:
            unitType = {'Id': unitTypeId, 'Name': unitTypeName, 'Units': []}
            UnitTypes[unitTypeId] = unitType

        # unit
        unitId = u[2]
        unitName = u[3]
        unitPlural = u[4]

        if unitId in Units:
            unit = Units[unitId]
        else:
            unit = {'Id': unitId, 'Name': unitName, 'Plural': unitPlural}
            Units[unitId] = unit

        # order pref
        pref = u[5]

        UnitWrapper = {'Id': unitId, 'Unit': unit, 'OrderPerference': pref}
        unitType['Units'].append(UnitWrapper)

    return [x for x in UnitTypes.values()]




def writeJson(o, fname = "drinks.json"):
    with open(fname, 'w', encoding="utf8") as f:
        json.dump(o, f)

def main():
    drinks = GetDrinks()
    ingTree = GetIngredientTree()
    units = GetUnits()

    j = {
        "drinks": drinks,
        "ingredientTree": ingTree,
        "unitTypes": units
    }
    
    writeJson(j, os.path.join("./src/json/drinks.json"))

if __name__ == "__main__":
    main()