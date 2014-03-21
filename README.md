#Kwaai Tools

A set of tools that help in the building of fully restful API's on Node, Mongo and Express.

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