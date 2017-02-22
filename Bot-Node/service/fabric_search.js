var httpntlm = require('httpntlm');

module.exports = {
    searchFabric: function (fabricNO) {
        var queryEntity = {
            "filterType": "LEAF",
            "filters": [
                {}
            ],
            "attributeName": "item_number",
            "searchOperator": "eq",
            "filterValue": fabricNO
        }

        var options = {
            url: 'http://getnt130.gfg1.esquel.com/InstantNoodle_SIT/Workbench/api/v1/fabriclibrary/search/1/1',
            username: 'chenwes',
            password: 'Bot77@',
            domain: 'gfg1',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            json: queryEntity
        };

        var fabrics = [];

        return new Promise(function (resolve, reject) {
            httpntlm.post(options,
                function (err, resp) {
                    if (err) {
                        reject(err);
                    }
                    //no error
                    if (resp.statusCode === 200) {
                        var getresult = JSON.parse(resp.body);
                        if (getresult.resultType === "SUCCESS" && getresult.exceptionDetail == null) {
                            getresult.results[0].data.forEach(function (getfabric) {
                                fabrics.push(getfabric);
                            });
                        }
                    }
                });

            setTimeout(() => resolve(fabrics), 1000);
        });
    }
};