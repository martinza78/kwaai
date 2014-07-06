//*********************************************************************************************************************************************************************
//requires
//*********************************************************************************************************************************************************************

var crudtools=require('./crud-tools.js');


//*********************************************************************************************************************************************************************
//exports
//*********************************************************************************************************************************************************************

var tools=
{
    //CREATE************************************************************************************************************************************************
    insert:
        function(req,res,next)
        {
            if (!req.kwaaioptions){return next("kwaai options not set")}
            getKwaaiOptionDefaults(req);

            function documentInserted(err,document){
                if (err){return next(err)}
                else if (document==null){
                    if (req.kwaaioptions.sendresponse){
                        res.send(204)
                    }
                    else{
                        req.kwaaires.status=204;
                        req.kwaaires.value=null;
                        next();
                    }
                }
                else{
                    if (req.kwaaioptions.sendresponse){
                        res.send(201,document)
                    }
                    else{
                        req.kwaaires.status=201;
                        req.kwaaires.value=document;
                        next();
                    }

                }
            }

            try{
                crudtools.insert({collection:req.kwaaioptions.collection,schema:req.kwaaioptions.schema,data:req.body,validate:req.kwaaioptions.validate,coerce:req.kwaaioptions.coerce},documentInserted);
            }catch(exp){
                return next(exp);
            }
        }

    //RETRIEVE************************************************************************************************************************************************
    ,getById:
        function(req,res,next)
        {
            if (!req.kwaaioptions){return next("kwaai options not set")}
            getKwaaiOptionDefaults(req);

            function documentFound(err,document){
                if (err){return  next(err)}
                else if (document==null){res.send(404,{error:"document not found"})}
                else{
                    if (req.kwaaioptions.sendresponse){
                        res.send(200,document)
                    }
                    else{
                        req.kwaaires.status=200;
                        req.kwaaires.value=document;
                        next();
                    }
                }
            }

            try{
                crudtools.getById({collection:req.kwaaioptions.collection,schema:req.kwaaioptions.schema,id:req.params.id,query:req.query},documentFound);
            }catch(exp){
                return next(exp);
            }
        }

    ,getByQuery:
       function(req,res,next)
        {
            if (!req.kwaaioptions){return next("kwaai options not set")}
            getKwaaiOptionDefaults(req);
            
            function documentsFound(err,documents){
                if (err){return next(err)}
                else if (documents==null){res.send([])}
                else{
                    if (req.kwaaioptions.sendresponse){
                        res.send(200,documents)
                    }
                    else{
                        req.kwaaires.status=200;
                        req.kwaaires.value=documents;
                        next();
                    }
                }
            }

            try{
                crudtools.getByQuery({collection:req.kwaaioptions.collection,schema:req.kwaaioptions.schema,query:req.query},documentsFound);
            }catch(exp){
                return  next(exp);
            }
        }



    //UPDATE************************************************************************************************************************************************

    ,updateFull:
        function(req,res,next)
        {
            if (!req.kwaaioptions){return next("kwaai options not set")}
            getKwaaiOptionDefaults(req);

            function documentUpdated(err,result){
                if (err){return next(err)}
                else if (result==0){return res.send(404,{error:"document not found"})}
                else{
                    if (req.kwaaioptions.sendresponse){
                        res.send(204)
                    }
                    else{
                        req.kwaaires.status=204;
                        req.kwaaires.value=null;
                        next();
                    }
                }
            }

            try{
               crudtools.updateFull({collection:req.kwaaioptions.collection,schema:req.kwaaioptions.schema,id:req.params.id,data:req.body,query:req.query,validate:req.kwaaioptions.validate,coerce:req.kwaaioptions.coerce},documentUpdated);
            }
            catch(exp){
                return next(exp);
            }
        }

    ,updatePart:
        function(req,res,next)
        {
            if (!req.kwaaioptions){return next("kwaai options not set")}
            getKwaaiOptionDefaults(req);

            function documentUpdated(err,result){
                if (err){return next(err)}
                else if (result==0){return res.send(404,{error:"Document not found"})}
                else{
                    if (req.kwaaioptions.sendresponse){
                        res.send(204)
                    }
                    else{
                        req.kwaaires.status=204;
                        req.kwaaires.value=null;
                        next();
                    }
                }
            }

            try{
                crudtools.updatePart({collection:req.kwaaioptions.collection,schema:req.kwaaioptions.schema,id:req.params.id,data:req.body,query:req.query,validate:req.kwaaioptions.validate,coerce:req.kwaaioptions.coerce},documentUpdated);
            }catch(exp){
                return next(exp);
            }
        }

    //DELETE************************************************************************************************************************************************
    ,delete:
    function(req,res,next)
    {
        if (!req.kwaaioptions){return next("kwaai options not set")}
        getKwaaiOptionDefaults(req);

        function documentDeleted(err){
            if (err){return next(err)}
            else{
                if (req.kwaaioptions.sendresponse){
                    res.send(200)
                }
                else{
                    req.kwaaires.status=200;
                    req.kwaaires.value=null;
                    next();
                }
            }
        }

        try{
            crudtools.delete({collection:req.kwaaioptions.collection,id:req.params.id,query:req.query},documentDeleted);
        }catch(exp){
            return next(exp);
        }
    }

    ,onlyForRoles:
        function(forRoles)
        {
            return function checkRole(req,res,next)
            {
                if (!forRoles){return next();};
                if (!req.user){return res.send(401,"Not authorised");}
                var roles=[];
                if (req.user.roles) {
                    if (Array.isArray(req.user.roles)) {
                        roles = req.user.roles;
                    }
                    else {
                        roles = [req.user.roles];
                    }
                }

                for (var r=0; i<roles.length; r++){
                    console.log("user's roles are: " + roles[r]); 
                }

                console.log("user's roles are: " + roles); 
                for (var i=0;i<forRoles.length;i++)
                {
                    console.log(forRoles[i]); 
                    if (roles.indexOf(forRoles[i])!=-1)
                    {

                        return next();    
                    }
                }
                return res.send(401,"No valid role");
            }
        }
   ,validateData:
        function(req,res,next){
            if (!req.kwaaioptions){return next("kwaai options not set")}
            getKwaaiOptionDefaults(req);

            function validated(err){
                if (err){return res.send(400,err)}
                next();
            }

            try{
                crudtools.validateData({data:req.body,schema:req.kwaaioptions.schema},validated)
            }catch(exp){next(exp)}

        }

    ,coerceData:
        function(req,res,next){
            if (!req.kwaaioptions){return next("kwaai options not set")}
            getKwaaiOptionDefaults(req);

            function coerced(err,coercedData){
                if (err){return next(err)}
                req.body=coercedData;
                next();
            }

            try{
                crudtools.coerceData({data:req.body,schema:req.kwaaioptions.schema},coerced)
            }catch(exp){next(exp)}
        }
    ,patchData:
        function(req,res,next){
            if (!req.kwaaioptions){return next("kwaai options not set")}
            getKwaaiOptionDefaults(req);

            function dataPatched(err,patchedDoc){
                if (err){return next(err)}
                req.body=patchedDoc;
                next();
            }

            try {
                crudtools.generateDataPatch({collection: req.kwaaioptions.collection, schema: req.kwaaioptions.schema, id: req.params.id, data: req.body, query: req.query}, dataPatched);
            }catch(exp){next(exp)}
        }


}

module.exports=tools;


function getKwaaiOptionDefaults(req)
{
    if(!req.kwaaioptions.validate){req.kwaaioptions.validate=true}
    if(!req.kwaaioptions.coerce){req.kwaaioptions.coerce=false}
    if(!req.kwaaioptions.sendresponse){req.kwaaioptions.sendresponse=true}
}

