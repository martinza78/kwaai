//*********************************************************************************************************************************************************************
//requires
//*********************************************************************************************************************************************************************

var crypto = require('crypto');
var handlebars=require('handlebars');

//*********************************************************************************************************************************************************************
//exports
//*********************************************************************************************************************************************************************

var tools=
{
    arrayToObject:
        function(key,arr){
            if (!Array.isArray(arr)){return null;}
            
            var ret={};
            for (var i=0;i<arr.length;i++){
                ret[arr[i][key]]=arr[i];
            }
            return ret;
        }
    
    ,createHash:
        function (pass, salt) 
        {
            var h = crypto.createHash('sha512');

            h.update(pass);
            h.update(salt);

            return h.digest('base64');
        }
    ,mergeText:
        function(sourceText,data)
        {
            var template = handlebars.compile(sourceText);    
            var result = template(data);
            return result;
        }
}

module.exports=tools;