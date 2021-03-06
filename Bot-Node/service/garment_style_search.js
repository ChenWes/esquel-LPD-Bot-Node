var httpntlm = require('httpntlm');

module.exports = {
    searchGarmentStyle: function (garmentStyleNO) {

        var queryEntity = {
            "filterType": "LEAF",
            "filters": [
                {}
            ],
            "attributeName": "item_number",
            "searchOperator": "eq",
            "filterValue": garmentStyleNO
        }

        var options = {
            url: 'http://getnt130.gfg1.esquel.com/InstantNoodle_SIT/Workbench/api/v1/styleproduct/1/1',
            username: 'chenwes',
            password: 'Bot77@',
            domain: 'gfg1',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            json: queryEntity
        };

        var garmentstyles = [];

        return new Promise(function (resolve, reject) {
            httpntlm.post(options,
                function (err, resp) {
                    if (err) {
                        reject(err);
                    }
                    //no error
                    if (resp.statusCode === 200) {
                        var getresult = JSON.parse(resp.body);
                        //console.log(getresult);
                        if (getresult.resultType === "SUCCESS") {
                            getresult.results[0].data.forEach(function (getstyle) {
                                garmentstyles.push(getstyle);
                            });                            
                        }
                    }
                });

            setTimeout(() => resolve(garmentstyles), 1000);
        });
    }
};