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
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res,next)}
            getKwaaiOptionDefaults(req);

            function documentInserted(err,document){
                if (err){return fail(err,req,res,next)}
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
                return fail(exp,req,res,next);
            }
        }

    //RETRIEVE************************************************************************************************************************************************
    ,getById:
        function(req,res,next)
        {
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res,next)}
            getKwaaiOptionDefaults(req);

            function documentFound(err,document){
                if (err){return  fail(err,req,res,next)}
                else if (document==null){res.send(404,"document not found")}
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
                return fail(exp,req,res,next);
            }
        }

    ,getByQuery:
       function(req,res,next)
        {
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res,next)}
            getKwaaiOptionDefaults(req);
            
            function documentsFound(err,documents){
                if (err){return  fail(err,req,res,next)}
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
                return  fail(exp,req,res,next);
            }
        }



    //UPDATE************************************************************************************************************************************************

    ,updateFull:
        function(req,res,next)
        {
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res,next)}
            getKwaaiOptionDefaults(req);

            function documentUpdated(err,result){
                if (err){return fail(err,req,res,next)}
                else if (result==0){return res.send(404,"Document not found")}
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
                return fail(exp,req,res,next);
            }
        }

    ,updatePart:
        function(req,res,next)
        {
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res,next)}
            getKwaaiOptionDefaults(req);

            function documentUpdated(err,result){
                if (err){return fail(err,req,res,next)}
                else if (result==0){return res.send(404,"Document not found")}
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
                return fail(exp,req,res,next);
            }
        }

    //DELETE************************************************************************************************************************************************
    ,delete:
    function(req,res,next)
    {
        if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res,next)}
        getKwaaiOptionDefaults(req);

        function documentDeleted(err){
            if (err){return fail(err,req,res,next)}
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
            return fail(exp,req,res,next);
        }
    }

    ,onlyForRoles:
        function(arg)
        {
            
            return function checkRole(req,res,next)
            {
                if (!arg){return next();};
                if (!req.user.roles){return res.send(401,"Not authorised");}

                if(Array.isArray(req.user.roles)){roles=req.user.roles;}
                else{roles=[req.user.roles];}

                for (var i=0;i<arg.length;i++)
                {
                    if (roles.indexOf(arg[i])!=-1)
                    {
                        return next();    
                    }
                }
                return res.send(401,"Not authorised");
            }
        }
   ,validateData:
        function(req,res,next){
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res,next)}
            getKwaaiOptionDefaults(req);

            function validated(err){
                if (err){return res.send(400,err)}
                next();
            }

            try{
                crudtools.validateData({data:req.body,schema:req.kwaaioptions.schema},validated)
            }catch(exp){defaultFail(exp,req,res,next)}

        }

    ,coerceData:
        function(req,res,next){
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res,next)}
            getKwaaiOptionDefaults(req);

            function coerced(err,coercedData){
                if (err){return defaultFail(err,req,res,next)}
                req.body=coercedData;
                next();
            }

            try{
                crudtools.coerceData({data:req.body,schema:req.kwaaioptions.schema},coerced)
            }catch(exp){defaultFail(exp,req,res,next)}
        }
    ,patchData:
        function(req,res,next){
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res,next)}
            getKwaaiOptionDefaults(req);

            function dataPatched(err,patchedDoc){
                if (err){return defaultFail(err,req,res,next)}
                req.body=patchedDoc;
                next();
            }

            crudtools.generateDataPatch({collection:req.kwaaioptions.collection,schema:req.kwaaioptions.schema,id:req.params.id,data:req.body,query:req.query},dataPatched);
        }


}

module.exports=tools;


function getKwaaiOptionDefaults(req)
{
    if (!req.kwaaioptions.fail){req.kwaaioptions.fail=defaultFail}
    if(!req.kwaaioptions.validate){req.kwaaioptions.validate=true}
    if(!req.kwaaioptions.coerce){req.kwaaioptions.coerce=false}
    if(!req.kwaaioptions.sendresponse){req.kwaaioptions.sendresponse=true}
}

function defaultFail(err,req,res,next)
{
    next(err)//res.send(500,err);
}