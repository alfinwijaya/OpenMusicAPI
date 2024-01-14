const Joi = require('joi');

const AlbumPayloadSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().required(),
});

const CoverPayloadSchema = Joi.object({
  'content-type': Joi.string().valid('image/apng', 'image/avif', 'image/gif', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp').required(),
}).unknown();

module.exports = { AlbumPayloadSchema, CoverPayloadSchema };
