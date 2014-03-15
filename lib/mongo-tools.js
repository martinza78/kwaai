//*********************************************************************************************************************************************************************
//requires
//*********************************************************************************************************************************************************************

var mongo=require('mongodb');

//*********************************************************************************************************************************************************************
//exports
//*********************************************************************************************************************************************************************
tools=
{
     connectToCollection:
        function(name,connectionString,callback)
        {
            function collectionCreated(err,collection)
            {
                if (err)
                {
                    return callback(err);
                }  
                else 
                {
                    return callback(null,collection); 
                   
                }
            }

            function connectedToDB(err,db)
            {
                if (err)
                {
                    return callback(err);
                }  
                 
                var collection = db.collection(name);
                if (collection!=null)
                {
                    return callback(null,collection);    
                }
                db.createCollection(name,collectionCreated);
            }

            try{
                var db=mongo.connect(connectionString,connectedToDB);
            }
            catch(exp)
            {
                return callback(exp);
                
            }
        }

     ,connectToCollections:
        function(connectionString,callback){
            var i=0;
            var collections={};
            var collectionNames=Array.prototype.slice.call(arguments, 2);
            function connectedToCollection(err,collection){
                collections[collectionNames[i]]={};
                if (err){collections[collectionNames[i]].error=err}
                else{collections[collectionNames[i]].collection=collection}
                i++;
                if (i>=collectionNames.length){return callback(collections)};
                tools.connectToCollection(collectionNames[i],connectionString,connectedToCollection);
            }

            tools.connectToCollection(collectionNames[i],connectionString,connectedToCollection);
       }

     ,buildQueryFromOptions:
        function(query,options){
            var queryOptions = getQueryOptions(options);
        
            var arr, i, re;
            for (var key in options) {
                if(queryOptions.protected.indexOf(key)>-1)
                {
                    continue; 
                }
                query.where(key);
                var value = options[key];

                if ('~' === value[0]) {
                    re = new RegExp(value.substring(1), 'i');
                    query.where(key).regex(re);
                } else if ('>' === value[0]) {
                    if ('=' === value[1]) {
                        query.gte(value.substr(2));
                    } else {
                        query.gt(value.substr(1));
                    }
                } else if ('<' === value[0]) {
                    if ('=' === value[1]) {
                        query.lte(value.substr(2));
                    } else {
                        query.lt(value.substr(1));
                    }
                } else if ('!' === value[0] && '=' === value[1]) { //H+ for !=
                    query.ne(value.substr(2));
                } else if ('[' === value[0] && ']' === value[value.length - 1]) {
                    query.in(value.substr(1, value.length - 2).split(','));
                } else {
                    query.equals(value);
                }
            }

            //H+ exposes Query AND, OR and WHERE methods
            if (queryOptions.current.query) {
                query.where(JSON.parse(queryOptions.current.query,
                    jsonQueryParser));
            }
            //TODO - as introduction of QUERY param obsoletes need of $and, $or
            if (queryOptions.current.$and) {
                query.and(JSON.parse(queryOptions.current.$and, jsonQueryParser));
            }
            if (queryOptions.current.$or) {
                query.or(JSON.parse(queryOptions.current.$or, jsonQueryParser));
            }
            //H+ exposes Query AND, OR methods

            if (queryOptions.current.skip) {
                query.skip(queryOptions.current.skip);
            }
            if (queryOptions.current.limit) {
                query.limit(queryOptions.current.limit);
            }
            if (queryOptions.current.sort) {
                query.sort(queryOptions.current.sort);
            }
            var selectObj = {root: {}};
            if (queryOptions.current.select) {

                if (queryOptions.current.select) {
                    arr = queryOptions.current.select.split(',');
                    for (i = 0; i < arr.length; ++i) {
                        if (arr[i].match(/\./)) {
                            var subSelect = arr[i].split('.');
                            if (!selectObj[subSelect[0]]) {
                                selectObj[subSelect[0]] = {};
                                //selectObj.root[subSelect[0]] = 1;
                            }
                            selectObj[subSelect[0]][subSelect[1]] = 1;
                        } else {
                            selectObj.root[arr[i]] = 1;
                        }
                    }
                }
                query.select(selectObj.root);
            }

            //doesnt currently work
            //if (queryOptions.current.populate) {
            //    arr = queryOptions.current.populate.split(',');
            //    for (i = 0; i < arr.length; ++i) {
            //        if (!_.isUndefined(selectObj[arr[i]]) &&
            //            !_.isEmpty(selectObj.root)) {
            //            selectObj.root[arr[i]] = 1;
            //        }
            //        query = query.populate(arr[i], selectObj[arr[i]]);
            //    }
            //    query.select(selectObj.root);
            //}

            //return query;
    
        }
}


module.exports=tools;
//*********************************************************************************************************************************************************************
//private functions
//*********************************************************************************************************************************************************************
function jsonQueryParser(key, value) {
    if (_.isString(value)) {
        if ('~' === value[0]) { //parse RegExp
            return new RegExp(value.substring(1), 'i');
        } else if ('>' === value[0]) {
            if ('=' === value[1]) {
                return {$gte: value.substr(2)};
            } else {
                return {$gt: value.substr(1)};
            }
        } else if ('<' === value[0]) {
            if ('=' === value[1]) {
                return {$lte: value.substr(2)};
            } else {
                return {$lt: value.substr(1)};
            }
        } else if ('!' === value[0] && '=' === value[1]) {
            return {$ne: value.substr(2)};
        }
    } else if (_.isArray(value)) {
        if (model.schema.paths.hasOwnProperty(key)) {
            return {$in: value};
        }
    }
    return value;
}

function getQueryOptions(options)
{
    newQueryOptions = {
        protected: ['skip', 'limit', 'sort', 'populate', 'select', 'lean',
            '$and', '$or', 'query'],//H+ exposes OR, AND and WHERE methods
        current: {}
    };

    for (var key in options) {
        if (newQueryOptions.protected.indexOf(key) !== -1) {
            newQueryOptions.current[key] = options[key];
        }
    }
    return newQueryOptions;
}