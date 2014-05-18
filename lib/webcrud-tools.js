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
            collection=req.kwaaioptions.collection;
            schema=req.kwaaioptions.schema;
            if (!req.kwaaioptions.fail){fail=defaultFail}
            else{failreq.kwaaioptions.fail}
            if(!req.kwaaioptions.validate){req.kwaaioptions.validate=true}
            if(!req.kwaaioptions.coerce){req.kwaaioptions.coerce=false}

            function documentInserted(err,document){
                if (err){return fail(err,req,res,next)}
                else if (document==null){res.send(204)}
                else{res.send(201,document)}
            }

            try{
                crudtools.insert({collection:collection,schema:schema,data:req.body,validate:req.kwaaioptions.validate,coerce:req.kwaaioptions.coerce},documentInserted);
            }catch(exp){
                return fail(exp,req,res,next);
            }
        }

    //RETRIEVE************************************************************************************************************************************************
    ,getById:
        function(req,res,next)
        {
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res,next)}
            collection=req.kwaaioptions.collection;
            schema=req.kwaaioptions.schema;
            if (!req.kwaaioptions.fail){fail=defaultFail}
            else{fail=req.kwaaioptions.fail}

            function documentFound(err,document){
                if (err){return  fail(err,req,res,next)}
                else if (document==null){res.send(404,"document not found")}
                else{res.send(200,document)}
            }

            try{
                crudtools.getById({collection:collection,schema:schema,id:req.params.id,query:req.query},documentFound);
            }catch(exp){
                return fail(exp,req,res,next);
            }
        }

    ,getByQuery:
       function(req,res,next)
        {
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res,next)}
            collection=req.kwaaioptions.collection;
            schema=req.kwaaioptions.schema;
            if (!req.kwaaioptions.fail){fail=defaultFail}
            else{fail=req.kwaaioptions.fail}
            
            function documentsFound(err,documents){
                if (err){return  fail(err,req,res,next)}
                else if (documents==null){res.send(404,"document not found")}
                else{res.send(200,documents)}
            }

            try{
                crudtools.getByQuery({collection:collection,schema:schema,query:req.query},documentsFound);
            }catch(exp){
                return  fail(exp,req,res,next);
            }
        }



    //UPDATE************************************************************************************************************************************************

    ,updateFull:
        function(req,res,next)
        {
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res,next)}
            collection=req.kwaaioptions.collection;
            schema=req.kwaaioptions.schema;
            if (!req.kwaaioptions.fail){fail=defaultFail}
            else{fail=req.kwaaioptions.fail}
            if(!req.kwaaioptions.validate){req.kwaaioptions.validate=true}
            if(!req.kwaaioptions.coerce){req.kwaaioptions.coerce=false}

            function documentUpdated(err,result){
                if (err){return fail(err,req,res,next)}
                else if (result==0){return res.send(404,"Document not found")}
                else{res.send(204)}
            }

            try{
               crudtools.updateFull({collection:collection,schema:schema,id:req.params.id,data:req.body,query:req.query,validate:req.kwaaioptions.validate,coerce:req.kwaaioptions.coerce},documentUpdated);
            }
            catch(exp){
                return fail(exp,req,res,next);
            }
        }

    ,updatePart:
        function(req,res,next)
        {
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res,next)}
            collection=req.kwaaioptions.collection;
            schema=req.kwaaioptions.schema;
            if (!req.kwaaioptions.fail){fail=defaultFail}
            else{fail=req.kwaaioptions.fail}
            if(!req.kwaaioptions.validate){req.kwaaioptions.validate=true}
            if(!req.kwaaioptions.coerce){req.kwaaioptions.coerce=false}

            function documentUpdated(err,result){
                if (err){return fail(err,req,res,next)}
                else if (result==0){return res.send(404,"Document not found")}
                else{res.send(204)}
            }

            try{
                crudtools.updatePart({collection:collection,schema:schema,id:req.params.id,data:req.body,query:req.query,validate:req.kwaaioptions.validate,coerce:req.kwaaioptions.coerce},documentUpdated);
            }catch(exp){
                return fail(exp,req,res,next);
            }
        }

    //DELETE************************************************************************************************************************************************
    ,delete:
    function(req,res,next)
    {
        if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res,next)}
        collection=req.kwaaioptions.collection;
        if (!req.kwaaioptions.fail){fail=defaultFail}
        else{fail=req.kwaaioptions.fail}

        function documentDeleted(err){
            if (err){return fail(err,req,res,next)}
            else{res.send(200)}
        }

        try{
            crudtools.delete({collection:collection,id:req.params.id,query:req.query},documentDeleted);
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
            schema=req.kwaaioptions.schema;
            if (!req.kwaaioptions.fail){fail=defaultFail}
            else{fail=req.kwaaioptions.fail}

            function validated(err){
                if (err){return res.send(400,err)}
                next();
            }

            try{
                crudtools.validateData({data:req.body,schema:schema},validated)
            }catch(exp){defaultFail(exp,req,res,next)}

        }

    ,coerceData:
        function(req,res,next){
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res,next)}
            schema=req.kwaaioptions.schema;
            if (!req.kwaaioptions.fail){fail=defaultFail}
            else{fail=req.kwaaioptions.fail}

            function coerced(err,coercedData){
                if (err){return defaultFail(err,req,res,next)}
                req.body=coercedData;
                next();
            }

            try{
                crudtools.coerceData({data:req.body,schema:schema},coerced)
            }catch(exp){defaultFail(exp,req,res,next)}
        }
    ,patchData:
        function(req,res,next){
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res,next)}
            schema=req.kwaaioptions.schema;
            if (!req.kwaaioptions.fail){fail=defaultFail}
            else{fail=req.kwaaioptions.fail}

            function dataPatched(err,patchedDoc){
                if (err){return defaultFail(err,req,res,next)}
                req.body=patchedDoc;
                next();
            }

            crudtools.generateDataPatch({collection:collection,schema:schema,id:req.params.id,data:req.body,query:req.query},dataPatched);
        }
}

module.exports=tools;


function defaultFail(err,req,res,next)
{
    next(err)//res.send(500,err);
}