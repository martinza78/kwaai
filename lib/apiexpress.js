//*********************************************************************************************************************************************************************
//requires
//*********************************************************************************************************************************************************************
var express=require('express');
var kwaaiCrudware=require('kwaai-crudware');
var tenanttools=require("./tenant-tools.js")
var connect=require('connect');
var hasher = require('password-hash-and-salt'); 
//*********************************************************************************************************************************************************************
//exports
//*********************************************************************************************************************************************************************


var tools=
{
    createApiExpress:
        function(apiOptions)
        {
            var app=express();
            schemaRegistered=false;

            //set the body parsing middleware
            //ensure json worability
            app.use(ensureValidContentTypes);
            app.use(connect.json());
            app.use(handleJsonError);
            //will accept urlencoded content
            app.use(connect.urlencoded());

            //allow put/delete isntead of as a parameter on post
            app.use(connect.methodOverride());

            if (apiOptions&&apiOptions.tenantOptions){
                var loadedTenantTools = tenanttools.tenantTools(apiOptions.tenantOptions);
                app.use(loadedTenantTools.checkTenantSecurity);
                app.get("/admin/" + apiOptions.tenantOptions.plural,kwaaiCrudware.onlyForRoles([apiOptions.tenantOptions.adminRole]),loadedTenantTools.getTenantsByQuery);
                app.post("/admin/" + apiOptions.tenantOptions.plural,kwaaiCrudware.onlyForRoles([apiOptions.tenantOptions.adminRole]),loadedTenantTools.checkTenantExists,loadedTenantTools.createTenant);
                app.get("/:" +  apiOptions.tenantOptions.name + "/users",kwaaiCrudware.onlyForRoles([apiOptions.tenantOptions.tenantAdminRole]),loadedTenantTools.getUsers);
                app.post("/:" + apiOptions.tenantOptions.name + "/users",kwaaiCrudware.onlyForRoles([apiOptions.tenantOptions.tenantAdminRole]),loadedTenantTools.createUser);
            }

            app.schemas={};

            function registerSchema(schema)
            {
                //check chema
                if(!schemaRegistered){
                    app.get("/schemas",function(req,res){res.send(200,app.schemas);});
                    app.get("/schemas/:schemaName",function(req,res){res.send(200,app.schemas[req.params.schemaName]);});
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

            app.registerRoutes=registerRoutes;
            function registerRoutes(options)
            {
                for (var i=0;i<options.length;i++)
                {
                    registerRoute(options[i]);
                }    
            }

            app.registerRoute=registerRoute;
            function registerRoute(options)
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
                            req.kwaaioptions={collection:schemaMap.collection,schema:schemaMap.schema};
                            next();
                        });
                    }
                    if (options[key].roles){options[key].middleware.unshift(kwaaiCrudware.onlyForRoles(options[key].roles));}
                    app[key](options.route,options[key].middleware);
                }

               if(schemaMap){optionSchema=schemaMap.schema}
               app.options(options.route,function(req,res){sendOptions(res,allow,optionSchema);});
            }

            app.registerSchemaRoute=registerSchemaRoute;
            
            function registerSchemaRoute(options,callback){
                //check some properties are correct
                if (!options.apiPrefix){options.apiPrefix=""}
                if (!options.preMW){options.preMW=[]}
                if (!options.preCreateMW){options.preCreateMW=[]}
                if (!options.preReadMW){options.preReadMW=[]}
                if (!options.preUpdateMW){options.preUpdateMW=[]}
                if (!options.preDeleteMW){options.preDeleteMW=[]}
                if (!options.postCreateMW){options.postCreateMW=[]}
                if (!options.postReadMW){options.postReadMW=[]}
                if (!options.postUpdateMW){options.postUpdateMW=[]}
                if (!options.postDeleteMW){options.postDeleteMW=[]}
                if (!options.postMW){options.postMW=[]}

                registerSchema(options.schema);

                //add settings to the base class
                var route=options.apiPrefix+options.routeName;
                options.preMW.push(kwaaiCrudware.setKwaaiOptions({collection: options.collection, schema: options.schema,validate:false,coerce:false,sendresponse:false}));

                if (options.roles){ options.preMW.push(kwaaiCrudware.onlyForRoles(options.roles));}

                options.postMW.push(function(req,res){
                    if (req.kwaaires.data){res.send(req.kwaaires.status, req.kwaaires.data)}
                    else{res.send(req.kwaaires.status)}
                });

                app.get(route,[].concat(options.preMW).concat(options.preReadMW).concat(kwaaiCrudware.getByQuery).concat(options.postReadMW).concat(options.postMW));
                app.post(route,[].concat(options.preMW).concat([kwaaiCrudware.validateData,kwaaiCrudware.coerceData]).concat(options.preCreateMW).concat(kwaaiCrudware.insert).concat(options.postCreateMW).concat(options.postMW));
                app.options(route,function(req,res){sendOptions(res,["GET","POST"],options.schema);});

                app.get(route+"/schema",function(req,res){res.send(options.schema)})

                app.get(route+"/:id",[].concat(options.preMW).concat(options.preReadMW).concat(kwaaiCrudware.getById).concat(options.postReadMW).concat(options.postMW));
                app.put(route+"/:id",[].concat(options.preMW).concat([kwaaiCrudware.validateData,kwaaiCrudware.coerceData]).concat(options.preUpdateMW).concat(kwaaiCrudware.updateFull).concat(options.postUpdateMW).concat(options.postMW));
                app.patch(route+"/:id",[].concat(options.preMW).concat([kwaaiCrudware.validateData,kwaaiCrudware.coerceData]).concat(options.preUpdateMW).concat(kwaaiCrudware.updatePart).concat(options.postUpdateMW).concat(options.postMW));
                app.delete(route+"/:id",[].concat(options.preMW).concat(options.preDeleteMW).concat(kwaaiCrudware.delete).concat(options.postDeleteMW).concat(options.postMW));
                app.options(route,function(req,res){sendOptions(res,["GET","PUT","PATCH","DELETE"],options.schema);});

                if(callback){callback()}
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
     return next();
     if (req.method=="OPTIONS"){
        return next(); 
     }
          
     if (req.method=="GET"){
        res.contentType="application/json";
        return next(); 
     }

     var regexp= /^application\/([\w!#\$%&\*`\-\.\^~]*\+)?json/i;
     if (!regexp.test(req.headers['content-type']))
     {
         res.send(415, 'Unsupported content type');
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
    console.log("sending options..."); 
    res.set('Allow',allow.join(","));
    if (schema) {res.send(200,schema)}
    else{res.send(200)}

}



