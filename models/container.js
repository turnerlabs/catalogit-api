var helpers = require('../restit').helpers;
var schema = module.exports;

schema.container = {
  _metadata: {
    topLevel: true,
    userEditable: true,
    updates: false,
    deletes: false,
    find: true,
    default: 'name',
    andFields: ['version']
  },
  name: {
    type: String,
    unique: true,
    create: true,
    update: false,
    required: true,
    test: helpers.isValidName,
    description: "Name of container. Must be unique in combination with version.",
    requirement: 'Must be a string using only [A-Za-z0-9_-]'
  },
  version: {
    type: String,
    unique: false,
    create: true,
    update: false,
    required: true,
    test: helpers.isString,
    description: "The docker version. Must be unique in combination with name.",
    requirement: "Must be a string"
  },
  image: {
    type: String,
    unique: false,
    create: true,
    update: false,
    required: true,
    test: helpers.isValidDockerLink,
    description: "The docker image tag.",
    requirement: "must be a valid docker link (formatted docker-image-name:tag. With no underscores!"
  },
  active: {
    type: Boolean,
    unique: false,
    create: true,
    update: true,
    required: false,
    default: true,
    test: helpers.isBoolean,
    description: "Wether the name/version pair is active. Inactive means it will not be shown",
    requirement: "Must be a boolean value."
  }
}
