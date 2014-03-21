//*********************************************************************************************************************************************************************
//requires
//*********************************************************************************************************************************************************************

var crudtools=require('./crud-tools.js');


//*********************************************************************************************************************************************************************
//exports
//*********************************************************************************************************************************************************************

var tools=
{
    getById:
        function(req,res)
        {
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res)}
            collection=req.kwaaioptions.collection;
            schema=req.kwaaioptions.schema;
            if (!req.kwaaioptions.fail){fail=defaultFail}
            else{fail=req.kwaaioptions.fail}

            function documentFound(err,document){
                if (err){return  fail(err,req,res)}
                else if (document==null){res.send(404,"document not found")}
                else{res.send(200,document)}
            }

            try{
                crudtools.getById({collection:collection,schema:schema,id:req.params.id,query:req.query},documentFound);
            }catch(exp){
                return fail(exp,req,res);
            }
        }

    ,getByQuery:
       function(req,res)
        {
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res)}
            collection=req.kwaaioptions.collection;
            schema=req.kwaaioptions.schema;
            if (!req.kwaaioptions.fail){fail=defaultFail}
            else{fail=req.kwaaioptions.fail}
            
            function documentsFound(err,documents){
                if (err){return  fail(err,req,res)}
                else if (documents==null){res.send(404,"document not found")}
                else{res.send(200,documents)}
            }

            try{
                crudtools.getByQuery({collection:collection,schema:schema,query:req.query},documentsFound);
            }catch(exp){
                return  fail(exp,req,res);
            }
        }

    ,insert:
        function(req,res)
        {
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res)}
            collection=req.kwaaioptions.collection;
            schema=req.kwaaioptions.schema;
            if (!req.kwaaioptions.fail){fail=defaultFail}
            else{failreq.kwaaioptions.fail}

            function documentInserted(err,document){
                if (err){return fail(err,req,res)}
                else if (document==null){res.send(204)}
                else{res.send(201,document)}
            }
            
            try{
                crudtools.insert({collection:collection,schema:schema,data:req.body},documentInserted);
            }catch(exp){
                 return fail(exp,req,res);
            }
        }

    ,delete:
        function(req,res)
        {
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res)}
            collection=req.kwaaioptions.collection;
            if (!req.kwaaioptions.fail){fail=defaultFail}
            else{fail=req.kwaaioptions.fail}

            function documentDeleted(err){
                if (err){return fail(err,req,res)}
                else{res.send(200)}
            }

            try{
                crudtools.delete({collection:collection,id:req.params.id,query:req.query},documentDeleted);
            }catch(exp){
                 return fail(exp,req,res);
            }
        }

    ,updateFull:
        function(req,res)
        {
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res)}
            collection=req.kwaaioptions.collection;
            schema=req.kwaaioptions.schema;
            if (!req.kwaaioptions.fail){fail=defaultFail}
            else{fail=req.kwaaioptions.fail}

            function documentUpdated(err,result){
                if (err){return fail(err,req,res)}
                else if (result==0){return res.send(404,"Document not found")}
                else{res.send(204)}
            }

            try{
               crudtools.updateFull({collection:collection,schema:schema,id:req.params.id,data:req.body,query:req.query},documentUpdated);
            }
            catch(exp){
                return fail(exp,req,res);
            }
        }

    ,updatePart:
        function(req,res)
        {
            if (!req.kwaaioptions){return defaultFail("kwaai options not set",req,res)}
            collection=req.kwaaioptions.collection;
            schema=req.kwaaioptions.schema;
            if (!req.kwaaioptions.fail){fail=defaultFail}
            else{fail=req.kwaaioptions.fail}

            function documentUpdated(err,result){
                if (err){return fail(err,req,res)}
                else if (result==0){return res.send(404,"Document not found")}
                else{res.send(204)}
            }

            try{
                crudtools.updatePart({collection:collection,schema:schema,id:req.params.id,data:req.body,query:req.query},documentUpdated);
            }catch(exp){
                return fail(exp,req,res);
            }
        }

    ,onlyForRoles:
        function(arg)
        {
            
            return function checkRole(req,res,next)
            {
                if (!arg){return next();};
                if (!req.user.roles){return res.send(401,"Not authorised");}
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
}

module.exports=tools;


function defaultFail(err,req,res)
{
    res.send(500,err);
}