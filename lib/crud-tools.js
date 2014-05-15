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
        function(options,callback)
        {
            if (!callback){callback=function(){}}

            function documentFound(err,document){
                if (err){return callback(err)}
                else if (document==null){return callback(null,null)}
                else{
                    try{
                        jsonschematools.mergeSchemaLinks(document,options.schema);
                    }catch(exp){
                        return callback(exp);
                    }
                    return callback(null,document);
                }
            }

            function collectionConnected(err,collection)
            {
                 try {
                    if (options.id instanceof mongo.ObjectID) { id = options.id }
                    else { id=new mongo.ObjectID(options.id) }
                    var query=mquery(collection).findOne({_id:id});
                    if(options.query){mongotools.buildQueryFromOptions(query,options.query);}           
                    query.exec(documentFound);
                }catch(exp){
                    return callback(exp);
                }            
            }

            if(options.collection instanceof mongo.Collection){
                collectionConnected(null,options.collection)
            }else{
                mongotools.connectToCollection(options.collection.name,options.collection.connectionString, collectionConnected);   
            }
           
        }

     ,getByQuery:
        function(options,callback){
            if (!callback){callback=function(){}}

            function documentsFound(err,documents){
                if (err){return  callback(err)}
                else if (documents==null){return callback(null,null)}
                else{
                    try{
                        for (var i=0;i<documents.length;i++){
                            jsonschematools.mergeSchemaLinks(documents[i],options.schema);
                        }
                    }catch(exp){
                        return callback(exp);
                    }
                    return callback(null,documents);
                 }
            }

            function collectionConnected(err,collection)
            {
                try{
                    var query=mquery(collection).find();
                    if(options.query){mongotools.buildQueryFromOptions(query,options.query)}
                    if (options.limit){query.limit(options.limit)}
                    query.exec(documentsFound);
                }catch(exp){
                    return callback(exp);
                }
            }

            if(options.collection instanceof mongo.Collection){
                collectionConnected(null,options.collection)
            }else{
                mongotools.connectToCollection(options.collection.name,options.collection.connectionString,collectionConnected);   
            }

        }

     ,insert:
        function(options,callback)
        {
            if (!callback){callback=function(){}}

            function documentInserted(err,document)
            {
                if (err){return callback(err);}
                else if (document==null){return callback(null,null);}
                else {
                    document = document[0];
                    try{
                        jsonschematools.mergeSchemaLinks(document,options.schema);
                    } catch(exp){
                        return callback(exp);
                    }
                    return callback(null,document);
                }
            }
 
            function collectionConnected(err,collection)
            {
                try{
                    if (options.data.dateCreated){
                        delete options.data.dateCreated;
                    }
                    options.data.dateCreated=new Date();
                    collection.insert(options.data,{safe: true},documentInserted);
                }catch(exp){
                     return callback(exp);
                }
            }

            var invalid = jsonschematools.validateToSchema(options.data, options.schema);
            if (invalid) { return callback(invalid) }

            if(options.collection instanceof mongo.Collection){
                collectionConnected(null,options.collection)
            }else{
                mongotools.connectToCollection(options.collection.name,options.collection.connectionString,collectionConnected);   
            }
        }

     ,delete:
        function(options,callback)
        {
            if (!callback){callback=function(){}}

            function documentDeleted(err){
                if (err){return callback(err)}
                else{return callback()}
            }

            function collectionConnected(err,collection)
            {
                try {
                    if (options.id instanceof mongo.ObjectID) { id = options.id }
                    else { id = new mongo.ObjectID(options.id) }
                    var query=mquery(collection).find({_id:id});
                    if(options.query){
                        mongotools.buildQueryFromOptions(query,options.query);
                    }
                    query.findOneAndRemove(documentDeleted);
                }catch(exp){
                     return callback(exp);
                }
            }

            if(options.collection instanceof mongo.Collection){
                collectionConnected(null,options.collection)
            }else{
                mongotools.connectToCollection(options.collection.name,options.collection.connectionString,collectionConnected);   
            }
        }

     ,updateFull:
        function(options,callback)
        {
            if (!callback){callback=function(){}}

            function documentUpdated(err,result){
                if (err){return callback(err)}
                else if (result!=1){return callback(null,0)}
                else{return callback(null,1)}
            }

            function collectionConnected(err,collection)
            {
                try{
                    if(options.data._id){delete options.data._id}

                    //use mquery in case of additional where bits & pieces
                    if (options.id instanceof mongo.ObjectID) { id = options.id }
                    else { id = new mongo.ObjectID(options.id) }
                    var query=mquery(collection).findOne({_id:id});
                    if(options.query){
                        mongotools.buildQueryFromOptions(query,options.query);
                    }
                    query.update(options.data);
                    query.setOptions({ overwrite: true });
                    query.exec(documentUpdated);
                }catch(exp){
                    return callback(exp);
                }
            }

            var invalid=jsonschematools.validateToSchema(options.data,options.schema);
            if (invalid){return callback(invalid)}

            if(options.collection instanceof mongo.Collection){
                collectionConnected(null,options.collection)
            }else{
                mongotools.connectToCollection(options.collection.name,options.collection.connectionString,collectionConnected);   
            }
        }

    ,updatePart:
        function(options,callback)
        {
            if (!callback){callback=function(){}}

            function documentUpdated(err,result){
                if (err){return callback(err)}
                else if (result!=1){return callback(null,0)}
                else{return callback(null,1)}
            }

            function documentFound(err,document)
            {
                if (err) {return callback(err);}
                else if (document==null){return callback(null,0)}
                else {
                    var patcheddoc={};
                    try{
                        patcheddoc = jsonpatch.apply_patch(document, options.data);
                    }catch(exp){
                        return callback(exp);
                    }
                
                    var invalid = jsonschematools.validateToSchema(patcheddoc, options.schema);
                    if (invalid){return callback(invalid)}

                    if(patcheddoc._id){delete patcheddoc._id}

                    try{
                        //use mquery in case of additional where bits & pieces
                        if (options.id instanceof mongo.ObjectID) { id = options.id }
                        else { id = new mongo.ObjectID(options.id) }

                        var query=mquery(options.collection).findOne({_id:id});
                        if(options.query){
                            mongotools.buildQueryFromOptions(query,options.query);
                        }
                        query.update(patcheddoc);
                        query.setOptions({ overwrite: true });
                        query.exec(documentUpdated);
                        
                    }catch(exp){
                        return callback(exp);
                    }
                }
            }
            
            function collectionConnected(err,collection)
            {
                try {
                    if (options.id instanceof mongo.ObjectID) { id = options.id }
                    else { id = new mongo.ObjectID(options.id) }
                    var query = mquery(collection).findOne({ _id: id });
                    if(options.query){
                        mongotools.buildQueryFromOptions(query,options.query);
                    }
                    query.exec(documentFound);
                }catch(exp){
                    return callback(exp);
                }
            }

            if(options.collection instanceof mongo.Collection){
                collectionConnected(null,options.collection)
            }else{
                mongotools.connectToCollection(options.collection.name,options.collection.connectionString,collectionConnected);   
            }
        }
}

module.exports=tools;