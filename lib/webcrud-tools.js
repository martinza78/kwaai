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
            collection=req.apimakerargs.collection;
            schema=req.apimakerargs.schema;
            if (!req.apimakerargs.fail){fail=defaultFail}
            else{failreq.apimakerargs.fail}

            function documentFound(err,document)
            {
                if (err) 
                {
                    return  fail(err,req,res);
                }
                else if (document==null)
                {
                    res.send(404,"document not found");
                }
                else    
                {
                       res.send(200,document);
                }
            }
            try
            {
                crudtools.getById(collection,schema,req.params.id,documentFound,req.query);
            }
            catch(exp)
            {
                return fail(exp,req,res);
            }
        }

    ,getByQuery:
       function(req,res)
        {
            collection=req.apimakerargs.collection;
            schema=req.apimakerargs.schema;
            if (!req.apimakerargs.fail){fail=defaultFail}
            else{failreq.apimakerargs.fail}


            function documentsFound(err,documents)
            {
                if (err) 
                {
                    return  fail(err,req,res);
                }
                else if (documents==null)
                {
                    res.send(404,"documents not found");
                }
                else    
                {
                    res.send(200,documents);
                }
            }

            try
            {
                crudtools.getByQuery(collection,schema,req.query,documentsFound);
            }
            catch(exp)
            {
                return  fail(exp,req,res);
            }
        }

    ,insert:
        function(req,res)
        {
            collection=req.apimakerargs.collection;
            schema=req.apimakerargs.schema;
            if (!req.apimakerargs.fail){fail=defaultFail}
            else{failreq.apimakerargs.fail}

            function documentInserted(err,document)
            {
                if (err) 
                {
                    return fail(err,req,res);
                }
                else if (document==null)
                {
                    res.send(204);
                }
                else    
                {
                    if (next)
                    {
                        res.body=document;
                        res.statusCode=200;
                        next();
                    }
                    else
                    {
                        res.send(201,document);
                    }

                    
                }
            }
            
            try
            {
                crudtools.insert(collection,schema,req.body,documentInserted);
            }
            catch(exp)
            {
                 return fail(exp,req,res);
            }
        }

    ,delete:
        function(req,res)
        {
             collection=req.apimakerargs.collection;
            if (!req.apimakerargs.fail){fail=defaultFail}
            else{failreq.apimakerargs.fail}

            function documentDeleted(err)
            {
                if (err) 
                {
                    return fail(err,req,res);
                }
                else    
                {
                    if (next)
                    {
                        res.statusCode=200;
                        next();
                    }
                    else
                    {
                        res.send(200);
                    }
                }
            }

            try
            {
                crudtools.delete(collection,req.params.id,documentDeleted,req.query);
            }
            catch(exp)
            {
                 return fail(exp,req,res);
            }
        }

    ,updateFull:
        function(req,res)
        {
            collection=req.apimakerargs.collection;
            schema=req.apimakerargs.schema;
            if (!req.apimakerargs.fail){fail=defaultFail}
            else{failreq.apimakerargs.fail}

            function documentUpdated(err,result)
            {
                if (err) 
                {
                    if (err.notfound){
                        res.send(404,"Document not found");
                    }
                    else{
                        return fail(err,req,res);
                    }
                }
                else if (result!=1)
                {
                    res.send(304);
                }
                else    
                {
                    if (next)
                    {
                        res.statusCode=204;
                        next();
                    }
                    else
                    {
                        res.send(204);
                    }
                }
            }

          
            try
            {
               crudtools.updateFull(collection,schema,req.params.id,req.body,documentUpdated,req.query);
            }
            catch(exp)
            {
                return fail(exp,req,res);
            }
        }

    ,updatePart:
        function(req,res)
        {
            collection=req.apimakerargs.collection;
            schema=req.apimakerargs.schema;
            if (!req.apimakerargs.fail){fail=defaultFail}
            else{failreq.apimakerargs.fail}

            function documentUpdated(err,result)
            {

                if (err) 
                {
                    if (err.notfound){
                        res.send(404,"Document not found");
                    }
                    else{
                        return fail(err,req,res);
                    }
                }
                else if (result!=1)
                {
                    res.send(304);
                }
                else    
                {
                    if (next)
                    {
                        res.statusCode=204;
                        next();
                    }
                    else
                    {
                        res.send(204);
                    }
                }
            }

            try
            {
                crudtools.updatePart(collection,schema,req.params.id,req.body,documentUpdated,req.query);
            }
            catch(exp)
            {
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