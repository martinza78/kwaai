//*********************************************************************************************************************************************************************
//requires
//*********************************************************************************************************************************************************************
var mquery=require('mquery');
var jsonschematools=require('./jsonschema-tools.js');
var mongotools=require('./mongo-tools.js');
var mongo=require('mongodb');
var jsonpatch=require('jsonpatch');

//*********************************************************************************************************************************************************************
//exports
//*********************************************************************************************************************************************************************

var tools=
{
    getById:
        function(collection,schema,id,callback,additionalQueryOptions)
        {
            function documentFound(err,document)
            {
                if (err) 
                {
                    return  callback(err)
                }
                else if (document==null)
                {
                    return callback(null,null)
                }
                else{
                    try
                    {
                        jsonschematools.mergeSchemaLinks(document,schema);
                    }
                    catch(exp)
                    {
                        return callback(exp);
                    }
                    return callback(null,document);
                    
                }
            }
            try
            {
                var query=mquery(collection).findOne({_id:new mongo.ObjectID(id)});
                if(additionalQueryOptions)
                {
                    mongotools.buildQueryFromOptions(query,additionalQueryOptions);
                }
                query.exec(documentFound);
            }
            catch(exp)
            {
                return callback(exp);
            }
        }

     ,getByQuery:
        function(collection,schema,queryOptions,callback){
            function documentsFound(err,documents)
            {
                if (err) 
                {
                    return  callback(err)
                }
                else if (documents==null)
                {
                    return callback(null,null)
                }
                else    
                {
                    try
                    {
                        for (var i=0;i<documents.length;i++)
                        {
                            jsonschematools.mergeSchemaLinks(documents[i],schema);
                        }
                    }
                    catch(exp)
                    {
                        return callback(exp);
                    }
                    return callback(null,documents);
                 }
            }

            try
            {
                var query=mquery(collection).find();
                mongotools.buildQueryFromOptions(query,queryOptions);
                query.exec(documentsFound);
            }
            catch(exp)
            {
                return callback(exp);
            }
        }

     ,insert:
        function(collection,schema,data,callback)
        {
            function documentInserted(err,document)
            {
                if (err){return callback(err);}
                else if (document==null){return callback(null,null);}
                else {
                    try{
                        jsonschematools.mergeSchemaLinks(document,schema);
                    } catch(exp){
                        return callback(exp);
                    }
                    callback(null,document);
                }
            }
 
            var valid=jsonschematools.validateToSchema(data,schema);
            if (!valid)
            {
                 return callback(valid);
            }

            try
            {
                if (data.dateCreated)
                {
                    delete data.dateCreated;
                }
                data.dateCreated=new Date();
                collection.insert(req.body,{safe: true},documentInserted);
            }
            catch(exp)
            {
                 return callback(exp);
            }
        }

     ,delete:
        function(collection,id,callback,additionalQueryOptions)
        {
            function documentDeleted(err)
            {
                if (err) 
                {
                    callback(err);
                }
                else    
                {
                    callback();
                }
            }

            try
            {

                var query=mquery(collection).find({_id:new mongo.ObjectID(id)});
                if(additionalQueryOptions)
                {
                    mongotools.buildQueryFromOptions(query,additionalQueryOptions);
                }
                query.findOneAndRemove(documentDeleted);
            }
            catch(exp)
            {
                 return callback(exp);
            }
        }

     ,updateFull:
        function(collection,schema,id,data,callback,additionalQueryOptions)
        {
            function documentUpdated(err,result)
            {
                if (err) 
                {
                    return callback(err);
                }
                else if (result!=1)
                {
                    return callback(null,0);
                }
                else    
                {
                    return callback(null,1);
                }
            }

            var invalid=jsonschematools.validateToSchema(data,schema);
            if (invalid)
            {
                 return callback(invalid);
            }

            try
            {
                if(data._id)
                {
                    delete data._id;
                }

                //use mquery in case of additional where bits & pieces
                var query=mquery(collection).findOne({_id:new mongo.ObjectID(id)});
                if(additionalQueryOptions)
                {
                    mongotools.buildQueryFromOptions(query,additionalQueryOptions);
                }
                query.update(data);
                query.setOptions({ overwrite: true });
                query.exec(documentUpdated);
            }
            catch(exp)
            {
                return callback(exp);
            }
        }

    ,updatePart:
        function(collection,schema,id,data,callback,additionalQueryOptions)
        {
            function documentUpdated(err,result)
            {
                if (err) 
                {
                    return callback(err);
                }
                else if (result!=1)
                {
                    return callback(null,1);
                }
                else    
                {
                    return callback(null,0);
                }
            }



            function documentFound(err,document)
            {
                if (err) {
                    return callback(err);
                }
                else if (document==null)
                {
                    return callback({notfound:true});
                }
                else    
                {
                    var patcheddoc={};
                    try
                    {
                        patcheddoc = jsonpatch.apply_patch(document, data);
                    }
                    catch(exp)
                    {
                        return callback(exp);
                    }
                
                    var invalid=jsonschematools.validateToSchema(data,schema);
                    if (invalid)
                    {
                         return callback(invalid);
                    }

                    if(patcheddoc._id)
                    {
                       delete patcheddoc._id;
                    }

                    try{
                        //use mquery in case of additional where bits & pieces

                        var query=mquery(collection).findOne({_id:new mongo.ObjectID(id)});
                        if(additionalQueryOptions)
                        {
                            mongotools.buildQueryFromOptions(query,additionalQueryOptions);
                        }
                        query.update(patcheddoc);
                        query.setOptions({ overwrite: true });
                        query.exec(documentUpdated);
                        
                    }
                    catch(exp)
                    {
                        return callback(exp);
                    }
                }
            }

            try
            {
                var query=mquery(collection).findOne({_id:new mongo.ObjectID(id)});
                if(additionalQueryOptions)
                {
                    mongotools.buildQueryFromOptions(query,additionalQueryOptions);
                }
                query.exec(documentFound);
            }
            catch(exp)
            {
                return callback(exp);
            }
        }
}

module.exports=tools;