
module.exports=require('./lib/apiexpress.js').createApiExpress;

var apimakertools=
{
    jsonSchema:require('./lib/jsonschema-tools.js')
    ,helpers:require('./lib/helpers.js')
    ,mongo:require('./lib/mongo-tools.js')
    ,crud:require('./lib/crud-tools.js')
    ,webcrud:require('./lib/webcrud-tools.js')
}

module.exports.tools=apimakertools;





