//*********************************************************************************************************************************************************************
//requires
//*********************************************************************************************************************************************************************

var tv4=require('tv4');
var jsonpath=require('JSONPath');
var deepcopy=require('deepcopy');

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
tv4.addFormat('email', valEmail);




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
            document.links=deepcopy(schema.links);

            for(var i=0;i<document.links.length;i++)
            {
                var link=document.links[i];

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

function valEmail(data, schema) {
    // A string instance is valid against this attribute if it is a valid Internet
    // email address as defined by RFC 5322, section 3.4.1 [RFC5322]
    try {
            var parts = data.split('@');
            if(!parts || (parts.length != 2)) {
                    throw 'wrong number of @';
            }

            // local-part regex from http://www.regular-expressions.info/email.html
            if(!parts[0].match(/^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")$/)) {
                    throw 'local-part failed validation';
            }

            if(valHostname(parts[1], schema)) {
                    throw 'hostname failed validation';
            }
    }
    catch(e) {
            return('Invalid data for format email: ' + e);
    }
};


function valHostname(data, schema) {
    // A string instance is valid against this attribute if it is a valid
    // representation for an Internet host name, as defined by
    // RFC 1034, section 3.1 [RFC1034].
    try {
            // Total length not > 255
            if(data.length > 255) { throw 'length too long'; }

            var parts = data.split(".");
            for(pidx in parts) {
                    var p = parts[pidx];

                    // Leading character [a-z]
                    // Optionally [0-9a-z-] upto 61 times
                    // Trailing character [0-9a-z]
                    if(!p.toLowerCase().match(/^[a-z][0-9a-z-]{0,61}[a-z0-9]$/)) {
                            throw 'invalid label: ' + p
                    }
            }

            return(null);
    }
    catch(e) {
            return('Invalid data for format hostname: ' + e);
    }
};