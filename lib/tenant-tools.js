var crudtools=require("./crud-tools.js");
var helpers=require("./helpers.js");
var jsonschema=require("./jsonschema-tools.js");
var webcrud=require("./webcrud-tools.js");
var passport=require("passport");
var BasicStrategy = require('passport-http').BasicStrategy;
passport.use(new BasicStrategy({passReqToCallback:true},verifyUser));

var globalOptions={};

var multiTenantTools={
    createTenant:
        function(req,res,next){

            function tenantCreated(err,tenant){
                if (err){return next(err)}
                return res.send(200,tenant)
            }

            var invalid=jsonschema.validateToSchema(req.body,globalOptions.schemas.create)
            if (invalid){return res.send(400,invalid)}

            //todo check if tenant name exists


            var tenantToCreate={
                name:req.body.name,
                description:req.body.description,
                users:[
                    {
                        email:req.body.adminUser.email,
                        password:helpers.createHash(req.body.adminUser.password,req.body.adminUser.email),
                        roles:[globalOptions.adminRole]
                    }
                ]
            }

            crudtools.insert({collection:globalOptions.tenantsCollection,schema:globalOptions.schemas.storage,data:tenantToCreate},tenantCreated)

        }

    ,getTenantById:
        function(req,res,next){
            req.kwaaioptions={
                collection:globalOptions.tenantsCollection,
                sendresponse:true
            }

            webcrud.getById(req,res,next);
        }

    ,getTenantsByQuery:
        function(req,res,next){
            req.kwaaioptions={
                collection:globalOptions.tenantsCollection,
                sendresponse:true
            }

            webcrud.getByQuery(req,res,next);
        }

    ,updateTenantFull:
        function(req,res,next){

            req.kwaaioptions={
                collection:globalOptions.tenantsCollection,
                schema:tenantSchema,
                sendresponse:true
            }

            webcrud.updateFull(req,res,next);

        }

    ,updateTenantPart:
        function(req,res,next){

            req.kwaaioptions={
                collection:globalOptions.tenantsCollection,
                schema:tenantSchema,
                sendresponse:true
            }

            webcrud.updatePart(req,res,next);

        }

    ,deleteTenant:
        function(req,res,next){
            req.kwaaioptions={
                collection:globalOptions.tenantsCollection,
                sendresponse:true
            }

            webcrud.delete(req,res,next);

        }

    ,checkTenantExists:
        function(req,res,next){
            function tenantRetrieved(err,tenant){
                if (err){return next(err)}
                if (tenant){return res.send(409,globalOptions.name + " name exists")}
                next();
            }
            if (req.params.id){
                crudtools.getByQuery({collection: globalOptions.tenantsCollection, rawQuery: {"name": req.body.name.toLowerCase(),_id:{$ne:new mongo.ObjectID(req.params.id)}}}, tenantRetrieved)
            }else {
                crudtools.getByQuery({collection: globalOptions.tenantsCollection, rawQuery: {"name": req.body.name.toLowerCase()}}, tenantRetrieved)
            }
        }

    ,addAdminTenant:
        function(req,res,next){
            function adminRetrieved(err,adminTenant){
                if(err){return next(err)}
                req.body[globalOptions.name + "_id"]=adminTenant._id;
                next();
            }
            service.getTenantbyName("admin",adminRetrieved)
        }

    ,resetPassword:
        function(req,res,next){


        }

    ,updatePassword:
        function(req,res,next){

        }

    ,getUsers:
        function(req,res,next){
            function tenantRetrieved(err,tenant){
                if (err) {return next(err)}
                return res.send(200,tenant.users);
            }
            getTenantbyName(req[globalOptions.name].name,tenantRetrieved);
        }

    ,createUser:
        function (req,res,next){
            function tenantRetrieved(err,tenant){
                function userAdded(err,addedTenant){
                    if (err) {return next(err)}
                    res.send(200,req)    ;
                }

                if (err) {return next(err)}
                if(!tenant){return res.send(404,tenantOptions.name + " not found.")}
                for (var i=0;i<tenant.users.length;i++){
                    if (tenant.users[i].email.toLowerCase()==req.email.toLowerCase()){
                        return res.send(409,"User exists");
                    }
                }

                req.password=helpers.createHash(req.password,req.email)
                tenant.users.push(req);

                crudtools.updateFull({collection:globalOptions.tenantsCollection,schema:tenantOptions.schemas.storage,data:tenant},userAdded)
            }

            var invalid=jsonschema.validateToSchema(req.body,tenantOptions.schemas.user)
            if (invalid){return res.send(400,invalid)}

            crudtools.getById({collection: globalOptions.tenantsCollection, id:req.params.id,query:req.query}, tenantRetrieved)
        }

    ,deleteUser:
        function(req,res,next){
            function tenantRetrieved(err,tenant){
                function userDeleted(err){
                    if (err) {return next(err)}
                    res.send(200);
                }

                if (err) {return next(err)}
                if(!tenant){return res.send(404,tenantOptions.name + " not found.")}

                var foundUser=-1;
                for (var i=0;i<tenant.users.length;i++){
                    if (tenant.users[i].email.toLowerCase()==req.email.toLowerCase()){
                        foundUser=i;
                        break;
                    }
                }
                if (foundUser==-1){return res.send(404,"user not found.")}
                tenant.users.splice(foundUser,1);

                crudtools.updateFull({collection:globalOptions.tenantsCollection,schema:tenantOptions.schemas.storage,data:tenant},userDeleted)
            }
            crudtools.getById({collection: globalOptions.tenantsCollection, id:req.params.id,query:req.query}, tenantRetrieved)
        }

    ,updateUser:
        function(req,res,next){
            function tenantRetrieved(err,tenant){
                function userUpdated(err,result){

                    if (err) {return next(err)}
                    if (result==0){return res.send(304)}
                    res.send(204);
                }

                if (err) {return next(err)}
                if(!tenant){return res.send(404,tenantOptions.name + " not found.")}

                var foundUser=-1;
                for (var i=0;i<tenant.users.length;i++){
                    if (tenant.users[i].email.toLowerCase()==req.email.toLowerCase()){
                        foundUser=i;
                        break;
                    }
                }
                if (foundUser==-1){return res.send(404,"user not found.")}

                req.password=tenant.users[i].password;
                tenant.users[i]=req;

                crudtools.updateFull({collection:globalOptions.tenantsCollection,schema:tenantOptions.schemas.storage,data:tenant},userUpdated)
            }


            var invalid=jsonschema.validateToSchema(req.body,tenantOptions.schemas.user)
            if (invalid){return res.send(400,invalid)}
            crudtools.getById({collection: globalOptions.tenantsCollection, id:req.params.id,query:req.query}, tenantRetrieved)

        }


    ,checkTenantSecurity:
        function(req,res,next){
            function setTenanttoReq(err,tenant)
            {
                function passportChecked(){
                    if(req.user){
                        if(req.user.password){delete req.user.password}
                        req.body.user=req.user;}
                    next();
                }

                function passportInitialized(){
                    checkPassport()(req,res,passportChecked);
                }

                if (err){return next(err)}
                if (tenant==null){return res.send(404,"Invalid " + globalOptions.name + " name")}

                //todo active
                req[globalOptions.name]=tenant;
                req.body[globalOptions.name+ "_id"]=req[globalOptions.name]._id;
                req.body[globalOptions.name+ "_name"]=req[globalOptions.name].name;



                if (!req.query){req.query={}}
                req.query[globalOptions.name+ "_id"]=req[globalOptions.name]._id;


                passport.initialize()(req,res,passportInitialized);


            }

            var tenantNameEnd = req.url.indexOf('/', 1);
            var tenantName="";
            if (tenantNameEnd==-1){
                tenantName = req.url.substring(1);
            }
            else {
                tenantName = req.url.substring(1, tenantNameEnd);
            }
            if (!tenantName||tenantName==""){return res.send(404,"Invalid " + globalOptions.name + " name")}

            getTenantbyName(tenantName,setTenanttoReq)
        }

 }

var service={
    tenantTools: function(options){
        globalOptions=options;
        return multiTenantTools;
    }

}

module.exports=service;

function getTenantbyName(name,callback){
    function tenantRetrieved(err,tenants){
        if (err){return callback(err)}
        if(!tenants){return callback(null,null)}
        if(tenants.length==0){return callback(null,null)}
        return callback(null,tenants[0])
    }
    crudtools.getByQuery({collection:globalOptions.tenantsCollection,query:{"name":name.toLowerCase()}},tenantRetrieved)
}

function verifyUser(req,username, password, done)
{
    if (req[globalOptions.name])
    {
        var lowerUsername = username.toLowerCase();
        for (var i=0;i<req[globalOptions.name].users.length;i++){
            var currentUser=req[globalOptions.name].users[i];
            if (currentUser.email==lowerUsername){
                if (currentUser.password==helpers.createHash(password,lowerUsername)){
                    return done(null,currentUser);
                }else{
                    return done(null,false);
                }
            }
        }
        return done(null,false);
    }
    else
    {
        return done(null,false);
    }
}



function checkPassport()
{
    return passport.authenticate('basic', { session: false }) ;
}


