var kwaaiCrud=require("kwaai-crud");
var helpers=require("./helpers.js");
var kwaaiSchema=require("kwaai-schema");
var webcrud=require("kwaai-crudware");
var passport=require("passport");
var BasicStrategy = require('passport-http').BasicStrategy;
var hasher = require('password-hash-and-salt'); 

passport.use(new BasicStrategy({passReqToCallback:true},verifyUser));

var globalOptions={};

var multiTenantTools={
    createTenant:
        function(req,res,next){
            function passwordHashed(err,hash) {
                function tenantCreated(err, tenant) {
                    if (err) {
                        return next(err)
                    }
                    return res.send(200, tenant)
                }

                var tenantToCreate=req.body;
                tenantToCreate.users=[
                    {
                        email:req.body.adminUser.email,
                        password:hash,
                        roles:[globalOptions.tenantAdminRole]
                    }
                ]

                delete tenantToCreate.adminUser;
                kwaaiCrud.insert({collection:globalOptions.tenantsCollection,schema:globalOptions.schemas.storage,data:tenantToCreate},tenantCreated)

            }
            var invalid=kwaaiSchema.validateToSchema(req.body,globalOptions.schemas.create)
            if (invalid){return res.send(400,invalid)}

            //todo check if tenant name exists
            hasher(req.body.adminUser.password).hash(passwordHashed)
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
                kwaaiCrud.getByQuery({collection: globalOptions.tenantsCollection, rawQuery: {"name": req.body.name.toLowerCase(),_id:{$ne:new mongo.ObjectID(req.params.id)}}}, tenantRetrieved)
            }else {
                kwaaiCrud.getByQuery({collection: globalOptions.tenantsCollection, rawQuery: {"name": req.body.name.toLowerCase()}}, tenantRetrieved)
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
                    console.log("User created"); 
                    res.send(204);
                }

                if (err) {return next(err)}
                if(!tenant){return res.send(404,globalOptions.name + " not found.")}
                for (var i=0;i<tenant.users.length;i++){
                    if (tenant.users[i].email.toLowerCase()==req.body.email.toLowerCase()){
                        return res.send(409,"User exists");
                    }
                }

                hasher(req.body.password).hash(function(error, hash) {

                    var newUser={
                        email:req.body.email,
                        password:hash
                    }

                    if (req.body.roles){newUser.roles=req.body.roles}
                    if (req.body.additonalInfo){newUser.additonalInfo=req.body.additonalInfo}

                    tenant.users.push(newUser);

                    kwaaiCrud.updateFull({collection:globalOptions.tenantsCollection,schema:globalOptions.schemas.storage,id:tenant._id,data:tenant},userAdded)
                }); 
            }
            console.log("creating new user..."); 
            var invalid=kwaaiSchema.validateToSchema(req.body,globalOptions.schemas.user)
            if (invalid){return res.send(400,invalid)}

            kwaaiCrud.getById({collection: globalOptions.tenantsCollection, id:req[globalOptions.name]._id}, tenantRetrieved)
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

                kwaaiCrud.updateFull({collection:globalOptions.tenantsCollection,schema:tenantOptions.schemas.storage,data:tenant},userDeleted)
            }
            kwaaiCrud.getById({collection: globalOptions.tenantsCollection, id:req.params.id,query:req.query}, tenantRetrieved)
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

                kwaaiCrud.updateFull({collection:globalOptions.tenantsCollection,schema:tenantOptions.schemas.storage,data:tenant},userUpdated)
            }


            var invalid=kwaaiSchema.validateToSchema(req.body,tenantOptions.schemas.user)
            if (invalid){return res.send(400,invalid)}
            kwaaiCrud.getById({collection: globalOptions.tenantsCollection, id:req.params.id,query:req.query}, tenantRetrieved)

        }

    ,checkTenantSecurity:
        function(req,res,next){
            function setTenanttoReq(err,tenant)
            {
                function passportChecked(){

                    if(req.user){
                        console.log("found user " + req.user.email); 
                        var saveUser={
                            email:req.user.email
                        }
                        if(req.user.roles){saveUser.roles=req.user.roles}
                        if(req.user.additonalInfo){saveUser.additonalInfo=req.user.additonalInfo}
                        req.body.user=req.saveUser;
                    }
                    else {
                        console.log("no user found..."); 
                    }    

                    next();
                }

                function passportInitialized(){
                    checkPassport()(req,res,passportChecked);
                }


                if (err){return next(err)}
                if (tenant==null){return res.send(404,"Invalid " + globalOptions.name + " name")}

                console.log("tenant " + tenant.name + " found"); 
                //todo active
                req[globalOptions.name]=tenant;
                req.body[globalOptions.name+ "_id"]=req[globalOptions.name]._id;
                req.body[globalOptions.name+ "_name"]=req[globalOptions.name].name;



                if (!req.query){req.query={}}
                req.query[globalOptions.name+ "_id"]=req[globalOptions.name]._id;


                // cross domain
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

                // intercept OPTIONS method
                if ('OPTIONS' == req.method) {
                  return res.send(200);
                }


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

            console.log("checking security for tenant " + tenantName); 
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
    kwaaiCrud.getByQuery({collection:globalOptions.tenantsCollection,query:{"name":name.toLowerCase()}},tenantRetrieved)
}

function verifyUser(req,username, password, done)
{

    function hashedChecked(error, verified){

        if (error) throw new Error('Something went wrong while verifying the user`s password!');

        if (!verified){
            console.log("user not verified");
            return done(null, false); 
        } else {
            console.log("user verified");
            return done(null, userToVerify); 
        }
    }

    var userToVerify = null; 
    console.log("user : " + username + " requesting login"); 
    if (req[globalOptions.name])
    {
        var found = false; 
        var lowerUsername = username.toLowerCase();
        for (var i=0;i<req[globalOptions.name].users.length;i++){
            var currentUser=req[globalOptions.name].users[i];
            if (currentUser.email==lowerUsername){
                found = true; 
                userToVerify = currentUser; 
                hasher(password).verifyAgainst(currentUser.password,hashedChecked); 
                break; 
            }
        }
        if (!found)
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


