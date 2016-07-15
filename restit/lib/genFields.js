"use strict";

module.exports = function(type,fields,sub) {
  let f = [];

  Object.keys(fields).forEach(function(field) {
    var o = fields[field];
    if(type === 'post' && o.create) {
      if (o.subObj) {
        f.push({
          field: field,
          subObject: genFields('post',o.value,true)
        })
      } else {
        if(typeof o.type.name === 'undefined') {
          var myType = 'Array of ' + o.type[0].name + 's';
        } else {
          var myType = o.type.name;
        }
        f.push({
          field: field,
          type:  myType,
          required: o.required,
          description: o.description,
          requirement: o.requirement
        });
      }
    } else if (type === 'put' && o.update) {
      if (o.subObj) {
        f.push({
          field: field,
          subObject: genFields('post',o.value,true)
        })
      } else {
        if(typeof o.type.name === 'undefined') {
          var myType = 'Array of ' + o.type[0].name + 's';
        } else {
          var myType = o.type.name;
        }
        f.push({
          field: field,
          type:  myType,
          required: false,
          description: o.description,
          requirement: o.requirement
       });
      }
    }
  });
  return f;
}
