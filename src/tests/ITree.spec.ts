import { DownloadMainJson } from '../services/DownloadService';

describe('ITree Tests', function () {
    let mainobj:  {ingredientTree: any, drinks: any} = null;

    beforeEach(function(done) {
        window.setTimeout(function() {
          done();
        }, 0);
      });

    // beforeAll(function(done) {
    //     (new Promise(function (resolve) {
    //       return DownloadMainJson();
    //     }))
    //     .then(function(x: any) {
    //         mainobj = x;
    //       console.log('Calling done');
    //       done();
    //     });
    //   }, 20000);

    // // beforeAll(async () => {
    // //     mainobj = await DownloadMainJson();
    // // });

    it('should exist', () => {
        expect(mainobj.drinks.length).toBeGreaterThan(0);
        console.log(mainobj);
    });
});