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
    //CREATE************************************************************************************************************************************************
    insert:
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
            if (err){return callback(err)}
            if(!collection){return callback("Unable to load collection")}

            try{
                if (options.data.dateCreated){
                    delete options.data.dateCreated;
                }
                if (options.data._id){
                    delete options.data._id;
                }
                options.data.dateCreated=new Date();
                collection.insert(options.data,{safe: true},documentInserted);
            }catch(exp){
                return callback(exp);
            }
        }


        function dataPrepped(err,preppedOptions){
            if (err) { return callback(err) }
            options=preppedOptions;

            if(options.collection instanceof mongo.Collection){
                collectionConnected(null,options.collection)
            }else{
                mongotools.connectToCollection(options.collection.name,options.collection.connectionString,collectionConnected);
            }
        }

        prepDataChange(options,dataPrepped)
    }

    //READ************************************************************************************************************************************************
    ,getById:
        function(options,callback)
        {
            if (!callback){callback=function(){}}

            function documentFound(err,document){
                if (err){return callback(err)}
                else if (document==null){return callback(null,null)}
                else{
                    try{
                        if (options.schema){
                            jsonschematools.mergeSchemaLinks(document,options.schema);
                        }
                    }catch(exp){
                        return callback(exp);
                    }
                    return callback(null,document);
                }
            }

            function collectionConnected(err,collection)
            {
                if (err){return callback(err)}
                if(!collection){return callback("Unable to load collection")}

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
                if (documents==null){return callback(null,null)}
                if (documents.length==0){return callback(null,null)}

                try{
                    if (options.schema){
                        for (var i=0;i<documents.length;i++){
                            jsonschematools.mergeSchemaLinks(documents[i],options.schema);
                        }
                    }
                }catch(exp){
                    return callback(exp);
                }
                return callback(null,documents);

            }

            function collectionConnected(err,collection)
            {
                if (err){return callback(err)}
                if(!collection){return callback("Unable to load collection")}

                try{
                    var query=null;
                    if (options.rawQuery){
                        query=mquery(collection).find(options.rawQuery);
                        query.exec(documentsFound);
                    }
                    else{
                        query=mquery(collection).find();
                        if(options.query){mongotools.buildQueryFromOptions(query,options.query)}
                        if (options.limit){query.limit(options.limit)}
                        query.exec(documentsFound);
                    }
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

    //UPDATE************************************************************************************************************************************************
    ,updateFull:
        function(options,callback)
        {
            if (!callback){callback=function(){}}
            if (!options.validate){options.validate=true;}
            if (!options.coerce){options.coerce=false;}

            function documentUpdated(err,result){
                if (err){return callback(err)}
                else if (result!=1){return callback(null,0)}
                else{return callback(null,1)}
            }

            function collectionConnected(err,collection)
            {
                if (err){return callback(err)}
                if(!collection){return callback("Unable to load collection")}

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

            function dataPrepped(err,preppedOptions){
                if (err) { return callback(err) }
                options=preppedOptions;

                if(options.collection instanceof mongo.Collection){
                    collectionConnected(null,options.collection)
                }else{
                    mongotools.connectToCollection(options.collection.name,options.collection.connectionString,collectionConnected);
                }
            }

            prepDataChange(options,dataPrepped);
        }

    ,updatePart:
        function(options,callback)
        {
            if (!callback){callback=function(){}}
            if (!options.validate){options.validate=true;}
            if (!options.coerce){options.coerce=false;}

            function documentUpdated(err,result){
                if (err){return callback(err)}
                else if (result!=1){return callback(null,0)}
                else{return callback(null,1)}
            }


            function documentPatched(err,patchedDoc){
                if (err) {return callback(err);}
                else if (document==null){return callback(null,0)}
                else {
                    options.data=patchedDoc;
                    tools.updateFull(options,callback);
                }
            }

            tools.generateDataPatch(options,documentPatched)

        }
    //DELETE************************************************************************************************************************************************
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
                if (err){return callback(err)}
                if(!collection){return callback("Unable to load collection")}

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



    ,validateData:
        function(options,callback){
            var invalid=jsonschematools.validateToSchema(options.data,options.schema);
            return callback(invalid);
        }

    ,coerceData:
        function(options,callback){
            return callback(null,options.data);
        }

    ,generateDataPatch:
        function(options,callback){
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

                    callback(null,patcheddoc)
                }
            }

            function collectionConnected(err,collection)
            {
                if (err){return callback(err)}
                if(!collection){return callback("Unable to load collection")}

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


function prepDataChange(options,callback){
    if (!options.validate){options.validate=true;}
    if (!options.coerce){options.coerce=false;}

    function coerced(err,data){
        if (err) { return callback(err) }
        options.data=data;
        return callback(null,options);
    }

    //coerce to schema
    function validated(invalid){
        if (invalid) { return callback(invalid) }
        if(options.coerce){tools.coerceData(options,coerced())}
        else{coerced(null,options.data)}
    }

    //validate to schema
    if (options.validate){tools.validateData(options,validated)}
    else{validated(null);}

}