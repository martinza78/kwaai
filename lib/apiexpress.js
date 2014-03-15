//*********************************************************************************************************************************************************************
//requires
//*********************************************************************************************************************************************************************
var express=require('express');
var webcrudtools=require('./webcrud-tools.js');
//*********************************************************************************************************************************************************************
//exports
//*********************************************************************************************************************************************************************


var tools=
{
    createApiExpress:
        function()
        {
            var app=express();
            schemaRegistered=false;

            //set the body parsing middleware
            //ensure json worability
            app.use(ensureValidContentTypes);
            app.use(express.json());
            app.use(handleJsonError);
            //will accept urlencoded content
            app.use(express.urlencoded());

            //allow put/delete isntead of as a parameter on post
            app.use(express.methodOverride());

            app.schemas={};

            function registerSchema(schema)
            {
                //check chema
                if(!schemaRegistered){
                    app.get("/schemas",function(req,res){res.send(200,app.schemas);});
                    schemaRegistered=true;
                }

                if (!RegExp(/^[a-zA-Z0-9]/).test(schema.title)){
                    throw "Invalid schema title";    
                }
                app.schemas[schema.title]=schema;
                
            }

            app.schemaMaps={};
            app.mapSchemasToCollection=mapSchemasToCollection;
            function mapSchemasToCollection(mappings)
            {
                for (var i=0;i<mappings.length;i++)
                {
                    mapSchemaToCollection(mappings[i]);
                }    
            }

            app.mapSchemaToCollection=mapSchemaToCollection;
            function mapSchemaToCollection(mapping)
            {
                if (!RegExp(/^[a-zA-Z0-9]/).test(mapping.name)){
                    throw "Invalid mapping name";    
                }
                app.schemaMaps[mapping.name]=mapping;
                registerSchema(mapping.schema)
            }

            app.registerApiRoutes=registerApiRoutes;
            function registerApiRoutes(options)
            {
                for (var i=0;i<options.length;i++)
                {
                    registerApiRoute(options[i]);
                }    
            }

            app.registerApiRoute=registerApiRoute;
            function registerApiRoute(options)
            {
                var allow=["OPTIONS"];
                var validKeys=["get","post","put","patch","delete"];
                var schemaMap;
                for(var key in options)
                {
                    if (validKeys.indexOf(key)==-1){continue;}
                    if (options.schemaMap){schemaMap=app.schemaMaps[options.schemaMap]}
                    if (options[key].schemaMap){schemaMap=app.schemaMaps[options[key].schemaMap]}
                    if(schemaMap){
                        options[key].middleware.unshift(function(req,res,next){
                            req.apimakerargs={};
                            req.apimakerargs.collection=schemaMap.collection; 
                            req.apimakerargs.schema=schemaMap.schema; 
                            next();
                        });
                    }
                    if (options[key].roles){options[key].middleware.unshift(webcrudtools.onlyForRoles(options[key].roles));}
                    app[key](options.route,options[key].middleware);
                }

               if(schemaMap){optionSchema=schemaMap.schema}
               app.options(options.route,function(req,res){sendOptions(res,allow,optionSchema);});
            }
          
            return app;
        }
}
module.exports=tools;

//*********************************************************************************************************************************************************************
//private functions
//*********************************************************************************************************************************************************************

//ensures a valid content type
 function ensureValidContentTypes(req, res, next) {

     var regexp= /^application\/([\w!#\$%&\*`\-\.\^~]*\+)?json$/i;
     if (!regexp.test(req.headers['content-type']))
     {
         res.send(415, 'Unsupported contet type');
     }
     else
     {
         next();
     }
}

function handleJsonError(err, req, res, next){

    res.send(400,err);
}

function sendOptions(res,allow,schema)
{
    
    res.set('Allow',allow.join(","));
    if (schema) {res.send(200,schema)}
    else{res.send(200)}

}



