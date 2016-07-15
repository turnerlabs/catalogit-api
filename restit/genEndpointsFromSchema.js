"use strict";

let plural   = require('pluralize').plural;
let documentToObject = require('./lib/documentToObject');
let genFields = require('./lib/genFields');

module.exports = (schemas, mongoose, config) => {

  let nils     = ['',null];
  let m = mongoose;

  function genEndpoints(schemas, mongoose, config) {
    let generatedEndpoints = getEndpoints(schemas, mongoose);
    let endpoints = [];
    generatedEndpoints.endpoints.forEach((endpoint) => {
        var generatedEndpoint = {path: config.versionPath + endpoint.path, type: endpoint.type, description: endpoint.description};
        generatedEndpoint.fields = genFields(endpoint.type, endpoint.fields);
        generatedEndpoint.function = (req, res) => {
            // add a promise wrapping function here todo generic auth stuff if requested.
            doer(endpoint,generatedEndpoint, req, res);
        };
        endpoints.push(generatedEndpoint);
    });

    return endpoints;
  }

  function getEndpoints(models, mongoose) {
    var r = {endpoints:[], m: mongoose};
    Object.keys(models).forEach(function(model) {
      if (typeof models[model]._metadata.topLevel === 'boolean' && models[model]._metadata.topLevel) {
        r[model] = populateFields(r.endpoints,model,models);
      }
    });
    return r;
  }

  function genFromSchema(endpoints,name,schema,myParent) {
    var r = populateFields(endpoints,name,schema);
    return r;
  }

  function populateFields(endpoints,name,schemaO,myParent) {
    var schema = schemaO[name];
    var r = {};
    r.amSub = false;
    r.singular = name;
    r.plural   = plural(name);
    if (typeof myParent === 'object') {
      r.parent = myParent;
      r.amSub  = true;
      r.parentAncestry = r.parent.parentAncestry.slice(0);
      r.parentAncestry.push(r.parent.model);
    } else {
      r.parent = false;
      r.parentAncestry = [];
    }
    r.model = r.singular[0].toUpperCase() + r.singular.slice(1);
    r.limitObjFind         = {};
    r.limitObjFindOne      = {};
    r.fields               = {};
    r.subObj               = [];
    r.validCreateFields    = [];
    r.validUpdateFields    = [];
    r.generatorFields      = [];
    r.metadata             = schema._metadata;
    r.checkCreate = spawnCheckCreate(r);
    r.create      = spawnCreate(r);
    r.delete      = spawnDelete(r);
    r.checkUpdate = spawnCheckUpdate(r);
    r.update      = spawnUpdate(r);
    r.basePath = '';
    if (r.parent) {
      r.basePath = r.parent.itemPath;
      var descString = ' under ' + r.parent.itemPath;
    } else {
      r.basePath = '';
      var descString = '';
    }
    r.itemPath = r.basePath + '/' + r.singular + '/:' + r.model;
    r.allPath  = r.basePath + '/' + r.plural;
    descString = r.singular + ' :' + r.model + descString;
    var createDesc = 'Creates new ' + descString + '. Returns new object if successful or error otherwise';
    var updateDesc = 'Updates '     + descString + '. Returns updated object if successful or error otherwise';
    var deleteDesc = 'Deletes '     + descString + '. Returns success status if successful or error otherwise';
    if(typeof r.metadata.userEditable === 'boolean' && r.metadata.userEditable) {
      endpoints.push({path: r.basePath + '/' + r.plural, type: 'post', function: r.create, fields: r.fields, description: createDesc});
      let andQuery = ((r.metadata.andFields && r.metadata.andFields.length > 0) ? ('/:' + r.metadata.andFields.join('/:')) : '');
      endpoints.push({path: r.basePath + '/' + r.singular + '/:' + r.metadata.default + andQuery, type: 'put', function: r.update, fields: r.fields, description: updateDesc});
      endpoints.push({path: r.basePath + '/' + r.singular + '/:' + r.metadata.default + andQuery, type: 'delete', function: r.delete, fields: r.fields, description: deleteDesc});
    }
    Object.keys(schema).forEach(function(field) { if (field !== '_metadata') {
      var obj = schema[field];
      if (Array.isArray(obj)) {
        r.subObj.push(populateFields(endpoints,obj[0],schemaO,r));
      } else {
        r.fields[field] = obj;
        if (!(typeof obj.hideFind === 'boolean' && obj.hideFind === true)) {
          r.limitObjFind[field] = 1;
        }
        r.limitObjFindOne[field] = 1;
        if(typeof obj.create === 'boolean' && obj.create === true) {
          r.validCreateFields.push(field);
        }
        if(typeof obj.update === 'boolean' && obj.update === true) {
          r.validUpdateFields.push(field);
        }
        if(typeof obj.generator === 'function') {
          r.generatorFields.push({field: field, generator: obj.generator});
        }
      }
    }});
    return r;
  }

  function generateAncestryId(o,ancestry) {
    var ret = '';
    ancestry.forEach(function(a) {
      ret += '/' + a + '_' + o[a];
    });
    return ret;
  };

  function spawnCheckCreate(r) {
    return function(o,callBack) {
      var err = [];
      if(typeof o !== 'object') {
        return 'no payload provided';
      }
      var callBackCount = r.validCreateFields.length;
      r.validCreateFields.forEach(function(field) {
        if (typeof o[field] === 'undefined') {
          if (typeof r.fields[field].required === 'boolean' && r.fields[field].required == true) {
            err.push(field + ' is required but is undefined');
          }
          callBackCount--;
          if(callBackCount <= 0) {
            callBack(err);
          }
        } else {
          r.fields[field].test(function(good) {
            if(! good) {
              err.push({
                field: field,
                requirement: r.fields[field].requirement,
                description: r.fields[field].descritpion
               });
            }
            callBackCount--;
            if(callBackCount <= 0) {
              callBack(err);
            }
          },o[field],r,o,m);
        }
      });
    }
  }

  function spawnCreate(r) {
    return function(o, callBack) {
      r.checkCreate(o,function(err) {
        if(err.length > 0) {
          callBack(false,{error: err});
          return;
        }
        var createObj = {};
        r.validCreateFields.forEach(function(field) {
          if(typeof o[field] !== 'undefined') {
            createObj[field] = o[field];
          }
        });
        r.generatorFields.forEach(function(g) {
          createObj[g.field] = g.generator(o,m);
        });
        createSetup(o,r,createObj,callBack);
      });
    }
  }

  function createSetup(o,r,createObj,callBack) {
    var findObj = {};
    findObj[r.metadata.default] = o[r.metadata.default];
    r.metadata.andFields.forEach((and) => findObj[and] = o[and]);
    if(r.amSub) {
      var cError = '';
      var cBool  = r.parentAncestry.some(function(a) {
        if(typeof o[a] === 'undefined') {
          cError = 'Somehow the ' + a + ' field is not defined';
          return true;
        } else {
          return false;
        }
      });
      if (cBool) {
        callBack(false, {error: cError});
        return;
      }
      var a = r.parentAncestry.slice(0);
      checkAncestryExistence(a,o,r,function(systemErr,userErr) {
        if      (systemErr) callBack(systemErr);
        else if (userErr)   callBack(false, userErr);
        else {
          var gID = generateAncestryId(o,r.parentAncestry);
          findObj['_parentId']   = gID;
          createObj['_parentId'] = gID;
          create(o,r,findObj,createObj,callBack);
        }
      });
    } else {
      create(o,r,findObj,createObj,callBack)
    }
  }

  function create(o,r,findObj,createObj,callBack) {
    if(r.metadata.andFields || typeof r.fields[r.metadata.default].unique === 'boolean' && r.fields[r.metadata.default].unique) {
      console.log('findObj', findObj)
      entryExists(r.model, findObj,function(err,exists) {
        console.log('exists', exists)
        if (err) {callBack(err); return}
        else if (exists) {
          callBack(false,{error: r.model + ' Error: There is already a combination of ' + o.name + ':' + o.version + '. Specify unique combinations.'});
        } else doCreate(r,createObj,callBack);
      });
    } else doCreate(r,createObj,callBack);
  }

  function checkAncestryExistence(ancestry,o,r,callBack) {
    if (ancestry.length <= 0 ) {
      callBack(false,false);
      return;
    }
    var a    = ancestry.pop();
    var findObj = {};
    if (ancestry.length > 0) {
      var gID  = generateAncestryId(o,ancestry);
      var newR = r.parent;
      findObj._parentId = gID;
    }
    var newR = r.parent;
    findObj[newR.metadata.default] = o[a];
    entryExists(a,findObj,function(err,exists) {
      if (err) {
        callBack(err,false);
        return;
      } else if (exists) {
        checkAncestryExistence(ancestry,o,newR,callBack);
      } else {
        callBack(false,{error: a + ': ' + o[a] + ' does not exist'});
      }
    });
  }

  function entryExists(model,findObj,callBack) {
    m[model].findOne(findObj).exec(function(err,result) {
      if (err) {callBack(err,false)}
      else     { callBack(false,(result !== null)) }
    });
  }

  function doCreate(r,createObj,callBack) {
    var newDoc = new m[r.model](createObj);
    newDoc.save(function(err, newDoc) {
       if(err) {callBack(err); return};
       callBack(false,documentToObject(newDoc));
    });
  }

  function spawnDelete(r) {
    return function(o,callBack) {
      if(typeof o[r.metadata.default] !== 'string') {
        callBack(false,{error: 'Type of default must be string. Contact API owner. ' + r.metadata.default});
        return;
      }
      var findObj = {};
      var gID = '';
      var callBackCount = 0;
      if (r.amSub) {
        gID = generateAncestryId(o,r.parentAncestry);
        findObj._parentId = gID;
      }
      findObj[r.metadata.default] = o[r.metadata.default];
      r.metadata.andFields.forEach((and) => findObj[and] = o[and]);
      var subGID = gID + '/' + r.model + '_' + o[r.metadata.default];
      deleteSubs(subGID,r);
      m[r.model].find(findObj).exec(function(err, results) {
        if(! Array.isArray(results) || results.length === 0) {
          callBack(false, {error: r.model + ' resource does not exist'});
          return;
        }
        callBackCount = 0;
        results.forEach(function(result) {
          callBackCount++;
          var errs = [];
          result.remove(function(err) {
            if (err) errs.push(err);
            callBackCount--;
            if(callBackCount <= 0) {
              if (errs.length > 0) {
                callBack(errs);
              } else {
                callBack(false, {status: 'ok'});
              }
            }
          });
        });
      });
    }
  }

  function deleteSubs(gID, r) {
    r.subObj.forEach(function(s) {
      m[s.model].find({_parentId: gID}).exec(function(err, results) {
        if(Array.isArray(results)) {
          results.forEach(function(result) {
            var subGID = gID + '/' + s.model + '_' + result[s.metadata.default];
            deleteSubs(subGID,s);
            result.remove();
          });
        }
      });
    });
    return;
  }

  function spawnCheckUpdate(r) {
    return function(f,o,callBack) {
      var err = [];
      if(typeof f !== 'object') {
        return 'no find payload provided';
      }
      if(typeof o !== 'object') {
        return 'no update payload provided';
      }
      if(typeof f[r.metadata.default] === 'undefined') {
        return 'key field ' + r.metadata.default + ' undefined';
      }
      var callBackCount = r.validUpdateFields.length;

      if (callBackCount === 0) {
          callBack([ r.plural + " are immutable."]);
      }

      r.validUpdateFields.forEach(function(field) {
        if (nils.indexOf(o[field]) !== -1) {
          if(r.fields[field].required) {
             err.push(field + ' is nil but is required to be set');
          }
          callBackCount--;
          if (callBackCount <= 0) {
            callBack(err);
          }
        } else if (typeof o[field] !== 'undefined') {
          r.fields[field].test(function(good) {
            if(! good) {
              err.push({
                field: field,
                requirement: r.fields[field].requirement,
                description: r.fields[field].descritpion
               });
            }
            callBackCount--;
            if(callBackCount <= 0) {
              callBack(err);
            }
          },o[field],r,o,m,f);
        } else {
          callBackCount--;
          if (callBackCount <= 0) {
            callBack(err);
          }
        }
      });
    }
  }

  function spawnUpdate(r) {
    return function (f, o, callBack) {
      r.checkUpdate(f,o,function(err) {
        if(err.length > 0) {
          callBack(false,{error: err});
          return;
        }
        var updateObj = {};
        var unsetObj = false;
        r.validUpdateFields.forEach(function(field) {
          if(typeof o[field] !== 'undefined') {
            if(nils.indexOf(o[field]) !== -1) {
              if(typeof unsetObj === 'boolean') unsetObj = {};
              unsetObj[field] = 1;
            } else {
              updateObj[field] = o[field];
            }
          }
        });
        if(unsetObj) {
          updateObj['$unset']=unsetObj;
        }
        update(f,r,updateObj,callBack);
      });
    }
  }

  function update(f,r,updateObj,callBack) {
    var findObj = {};
    if (r.amSub) {
      var gID = generateAncestryId(f,r.parentAncestry);
      findObj['_parentId']   = gID;
      updateObj['_parentId'] = gID;
    }
    findObj[r.metadata.default] = f[r.metadata.default];
    r.metadata.andFields.forEach((and) => findObj[and] = f[and]);
    m[r.model].findOne(findObj).exec(function(err, newDoc) {
      if(err) {callBack(err); return}
      if(newDoc === null) {
        callBack(false,{error: r.model + ' ' + JSON.stringify(findObj) + ' does not exist'});
        return;
      } else {
        newDoc.update(updateObj, function(err, newDoc) {
          if(err) {callBack(err); return}
          m[r.model].findOne(findObj).exec(function(err, newDoc) {
            if(err) {callBack(err); return}
            callBack(false,newDoc);
            return;
          });
        });
      }
    });
  }

  function finisher(err,o,res) {
    if(err) {
      res.status(500);
      res.send(JSON.stringify({
        error: 'DB connection went wrong',
        details: err
      }));
    } else {
      if(!o || typeof o.error !== 'undefined') {
        if (o.error.match(/Container Error.+Specify unique combinations/)) {
          res.status(409);
        } else {
          res.status(422);
        }
        res.send(JSON.stringify(o));
      } else {
        res.send(JSON.stringify(documentToObject(o)));
      }
    }
  }

  function doer(i,r,req,res) {
    if (i.type === 'post') {
      Object.keys(req.params).forEach(function(key) {
         req.body[key] = req.params[key];
      });
      i.function(req.body,function(err,o){finisher(err,o,res)});
    } else if (i.type === 'put') {
      i.function(req.params,req.body,function(err,o){finisher(err,o,res)});
    } else if (i.type === 'delete') {
      i.function(req.params,function(err,o){finisher(err,o,res)});
    } else {
      res.status(500);
      res.send(JSON.stringify({error: 'Deployit generated something it cannot run'}));
    }
  }

  return genEndpoints(schemas, mongoose, config);
};
