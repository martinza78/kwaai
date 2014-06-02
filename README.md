#Kwaai Tools

A set of tools that help in the building of fully restful API's on Node, Mongo and Express.

##APIExpress
kwaai.tools.apiexpress

usage:
```javascript
var app=require('kwaai').tools.apiexpress.createApiExpress();
```

operation:
preMW,validation,coercion,preActionMW,action,postMW

###registerSchemaRoute(options,callback)
options:
* `schema`
* `collection`
* `roles`
* `preMW`
* `preCreateMW`
* `preReadMW`
* `preUpdateMW`
* `preDeleteMW`
* `postMW`

##Crud Tools
kwaai.tools.crud
usage:
```javascript
var kwaaicrud=require('kwaai').tools.crud;
```

###getById(options,callback)
options:
* `collection`
* `schema` 
* `id`
* `query`

###getByQuery(options,callback)
options:
* `collection`
* `schema`
* `query`
* `rawQuery`
* `limit`

###insert(options,callback)
options:
* `collection`
* `schema`
* `data`

###delete(options,callback)
options:
* `collection`
* `id`
* `query`

###updateFull(options,callback)
options:
* `collection`
* `schema`
* `id`
* `query`
* `data`


###updatePart(options,callback)
options:
* `collection`
* `schema`
* `id`
* `query`
* `data`


##Web Crud Tools
Kwaai web crud tools are a set of middleware that can be used to create fully restful api's. 

