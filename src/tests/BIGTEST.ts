import { IDrink } from '../models/IDrink';
import { IIngredientNode, IIngredient } from '../models/IIngredient';
import { KVP } from '../models/KVP';
import { fs2 } from '../services/SubstituteService';

const drinks: Array<IDrink> = [];
const ingredientFlat: KVP<IIngredientNode> = {};

const pantry: Array<IIngredientNode> = [
  {
    'name': 'Fruit',
    'id': 5,
    'parent': null,
    'children': [
      {
        'name': 'Citrus',
        'id': 149,
        'parent': 5,
        'children': [
          {
            'name': 'Pineapple',
            'id': 152,
            'parent': 149,
            'children': [
              {
                'name': 'Pineapple Juice',
                'id': 153,
                'parent': 152,
                'children': [],
                'distance': -1
              },
              {
                'name': 'Pineapple Wedge',
                'id': 227,
                'parent': 152,
                'children': [],
                'distance': -1
              },
              {
                'name': 'Pineapple Slice',
                'id': 228,
                'parent': 152,
                'children': [],
                'distance': -1
              },
              {
                'name': 'Pineapple Ring',
                'id': 229,
                'parent': 152,
                'children': [],
                'distance': -1
              }
            ],
            'distance': -1
          },
          {
            'name': 'Orange',
            'id': 154,
            'parent': 149,
            'children': [
              {
                'name': 'Orange Juice',
                'id': 155,
                'parent': 154,
                'children': [],
                'distance': -1
              },
              {
                'name': 'Orange Wedge',
                'id': 236,
                'parent': 154,
                'children': [],
                'distance': -1
              },
              {
                'name': 'Orange Slice',
                'id': 237,
                'parent': 154,
                'children': [],
                'distance': -1
              },
              {
                'name': 'Orange Ring',
                'id': 238,
                'parent': 154,
                'children': [],
                'distance': -1
              },
              {
                'name': 'Orange Twist',
                'id': 239,
                'parent': 154,
                'children': [],
                'distance': -1
              }
            ],
            'distance': -1
          },
          {
            'name': 'Grapefruit',
            'id': 156,
            'parent': 149,
            'children': [
              {
                'name': 'Grapefruit Juice',
                'id': 157,
                'parent': 156,
                'children': [],
                'distance': -1
              },
              {
                'name': 'Grapefruit Twist',
                'id': 242,
                'parent': 156,
                'children': [],
                'distance': -1
              }
            ],
            'distance': -1
          },
          {
            'name': 'Lime',
            'id': 158,
            'parent': 149,
            'children': [
              {
                'name': 'Lime Juice',
                'id': 159,
                'parent': 158,
                'children': [],
                'distance': -1
              },
              {
                'name': 'Lime Wedge',
                'id': 233,
                'parent': 158,
                'children': [],
                'distance': -1
              },
              {
                'name': 'Lime Ring',
                'id': 234,
                'parent': 158,
                'children': [],
                'distance': -1
              },
              {
                'name': 'Lime Slice',
                'id': 235,
                'parent': 158,
                'children': [],
                'distance': -1
              },
              {
                'name': 'Lime Twist',
                'id': 241,
                'parent': 158,
                'children': [],
                'distance': -1
              }
            ],
            'distance': -1
          },
          {
            'name': 'Lemon',
            'id': 160,
            'parent': 149,
            'children': [
              {
                'name': 'Lemon Juice',
                'id': 161,
                'parent': 160,
                'children': [],
                'distance': -1
              },
              {
                'name': 'Lemon Slice',
                'id': 230,
                'parent': 160,
                'children': [],
                'distance': -1
              },
              {
                'name': 'Lemon Wedge',
                'id': 231,
                'parent': 160,
                'children': [],
                'distance': -1
              },
              {
                'name': 'Lemon Ring',
                'id': 232,
                'parent': 160,
                'children': [],
                'distance': -1
              },
              {
                'name': 'Lemon Twist',
                'id': 240,
                'parent': 160,
                'children': [],
                'distance': -1
              }
            ],
            'distance': -1
          }
        ],
        'distance': -1
      },
      {
        'name': 'Berry',
        'id': 150,
        'parent': 5,
        'children': [
          {
            'name': 'Strawberry',
            'id': 162,
            'parent': 150,
            'children': [],
            'distance': -1
          },
          {
            'name': 'Blackberry',
            'id': 163,
            'parent': 150,
            'children': [],
            'distance': -1
          }
        ],
        'distance': -1
      },
      {
        'name': 'Cherry',
        'id': 151,
        'parent': 5,
        'children': [
          {
            'name': 'Bandied Cherry',
            'id': 164,
            'parent': 151,
            'children': [],
            'distance': 0
          },
          {
            'name': 'Maraschino Cherry',
            'id': 165,
            'parent': 151,
            'children': [
              {
                'name': 'Luxardo Cherry',
                'id': 244,
                'parent': 165,
                'children': [],
                'distance': 0
              }
            ],
            'distance': 0
          }
        ],
        'distance': -1
      }
    ],
    'distance': -1
  },
  {
    'name': 'Simple Syrup',
    'id': 132,
    'parent': 15,
    'children': [],
    'distance': 1
  },
  {
    'name': 'Avua Amburana',
    'id': 26,
    'parent': 25,
    'children': [],
    'distance': 0
  }
];


// -- TESTS --\\
var TESTOBJ = {

    /* pantry contains 'fruit', 'simple syrup', and 'avua amburana' */

    /* We are trying to make substitutes for a  Daiquiri */
    drinkToTest: drinks[23],

    tests: {
        distance: function() {

            function distWhiteRum() {
                const whiterum = drinks[23].Ingredients[2]; // we need White Rum,
                const avua = ingredientFlat[26]; // but only have avua amburana
                const res = fs2(whiterum, [avua], ingredientFlat);
                if (!assert(res !== null)) {
                    return false;
                }
                if (!assert(res.any)) {
                    return false;
                }
                if (!assert(res.subs[3][0], 'Avua Amburana')) {
                    return false;
                }

                return true;
            }

            function distWhiteRumWithGin() {
                const whiterum = drinks[23].Ingredients[2]; // we need White Rum,
                const avua = ingredientFlat[26]; // but only have avua amburana
                const gin = ingredientFlat[39];
                const res = fs2(whiterum, [gin, avua], ingredientFlat);
                if (!assert(res !== null)) {
                    return false;
                }
                if (!assert(res.any)) {
                    return false;
                }
                if (!assert(res.subs[3][0], 'Avua Amburana')) {
                    return false;
                }

                return true;
            }

            function distOrangeCordials() {
                const curacao = drinks[3].Ingredients[1]; // we need curacao,
                const ts = ingredientFlat[110]; // but only have TripleSec and
                const ct = ingredientFlat[109]; // we also have Cointreau
                const gin = ingredientFlat[39]; // we also have gin because why not.
                const res = fs2(curacao, [gin, ts, ct], ingredientFlat);

                if (!assert(res !== null)) {
                    return false;
                }
                if (!assert(res.any)) {
                    return false;
                }
                // we should have ts and ct under subs[2];
                if (!assert(2, res.subs[2].length)) {
                    return false;
                }
                // only index should be two
                const ks = Object.keys(res.subs);
                const reduc = ks.reduce((p, c) => {return p && (c === '2'); }, true);
                if (!assert(reduc, true)) {
                    return false;
                }
                // if (!assert(res.subs[2].indexOf(ts) !== -1)) {
                //     return false;
                // }
                // if (!assert(res.subs[2].indexOf(ct) !== -1)) {
                //     return false;
                // }

                return true;
            }

            const tests = [
                distWhiteRum(),
                distWhiteRumWithGin(),
                distOrangeCordials(),
            ];

            return tests.reduce((p, c) => {return p && c; }, true);
        }
    }

};

function assert(expected: any, actual?: any) {
    if (typeof actual === 'undefined') {
        if (!expected) {
            console.error(`FAILED: Expected ${expected} got ${!expected}`);
        }
        return expected;
    } else if (expected !== actual) {
        const typeE = typeof expected;
        const typeA = typeof actual;
        const typediff = typeE !== typeA;
        console.error(`FAILED: Expected ${expected} ${typediff ? `(typeof: ${typeof expected})` : ''}, got ${actual} ${typediff ? `(typeof: ${typeof actual})` : ''}`);
        return false;
    }
    return true;
}