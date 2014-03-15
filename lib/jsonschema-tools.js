//*********************************************************************************************************************************************************************
//requires
//*********************************************************************************************************************************************************************

var tv4=require('tv4');
var jsonpath=require('JSONPath');
tv4.addFormat('date-time', function (data, schema) {
    if (data instanceof Date)
    {
        return null;
    }

    if (validDateTime(data))
    {
        return null;
    }
    else
    {
        return "invalid date format";
    }
   
});


//*********************************************************************************************************************************************************************
//exports
//*********************************************************************************************************************************************************************

var tools=
{
    validateToSchema:
        function(document,schema)
        {
            if (!tv4.validate(document, schema,true))
            {
                return tv4.error;
        
            }
            else
            {
                return null;
            }
        }

    ,coerceToSchema:
        function(document,schema)
        {

        }

    ,mergeSchemaLinks:
        function(document,schema)
        {
            if (!schema.links||!Array.isArray(schema.links))
            {
                return document;
            }
            document.links=[];

            for(var i=0;i<schema.links.length;i++)
            {
                var link=schema.links[i];

                var  rxp = /{([^}]+)}/g,
                    curMatch;

                while( curMatch = rxp.exec( link.href ) ) 
                {
                    var foundVal=jsonpath.eval(document, "$." + curMatch[1]);
                    if(foundVal.length>0)
                    {
                        link.href=link.href.replace(curMatch[0],foundVal[0]);
                    }
                }

                if(link.schema&&link.schema.$ref)
                {
                    var foundVal=jsonpath.eval(schema,link.schema.$ref.replace("#","$."));
                    if(foundVal.length>0)
                    { 
                        link.schema=foundVal[0];
                    }
                }

                document.links.push(link);
            }

            
            
        }

}

module.exports=tools;


//*********************************************************************************************************************************************************************
//private functions
//*********************************************************************************************************************************************************************

function validDateTime(data) 
{
        // A string instance is valid against this attribute if it is a valid date
        // representation as defined by RFC 3339, section 5.6 [RFC3339].
        // Based on http://stackoverflow.com/questions/11318634/how-to-convert-date-in-rfc-3339-to-the-javascript-date-objectmilliseconds-since
        var getDom = function(month, year) {
                var domTable = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

                if(month == 2) {
                        if((year % 4 == 0) && ((year % 100 != 0) || (year % 400 == 0))) {
                                domTable[month-1] = 29;
                        }
                }

                return(domTable[month-1]);
        };

        var matchDateRegEx = /^([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):([0-4][0-9]|5[0-9]):([0-5][0-9]|60)(\.[0-9]+)?(Z|([+-][01][0-9]|2[0-3]):([0-4][0-9]|5[0-9]))$/;

        try {
                var m = matchDateRegEx.exec(data);
                if(!m) { throw 'failed to match regex'; }
                var year   = +m[1];     // 4DIGIT : Any 4 digits
                var month  = +m[2];     // 2DIGIT : 01-12
                var day    = +m[3];     // 2DIGIT : 01-28, 01-29, 01-30, 01-31
                if(day > getDom(month, year)) { throw 'invalid number of days for month'; }
                var hour   = +m[4];     // 2DIGIT : 00-23
                var minute = +m[5];     // 2DIGIT : 00-59
                var second = +m[6];     // 2DIGIT : 00-58, 00-59, 00-60 based on leap second rules
                var msec   = +m[7];     // 1*DIGIT: (optional)
                var tzHour = +m[8];     // 2DIGIT : 00-23
                var tzMin  = +m[9];     // 2DIGIT : 00-59

               return true;
        }
        catch(e) {
                return false;
        }
};