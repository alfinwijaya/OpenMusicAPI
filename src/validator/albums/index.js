const InvariantError = require('../../exceptions/InvariantError');
const { AlbumPayloadSchema, CoverPayloadSchema } = require('./schema');

const AlbumValidator = {
  validateAlbumPayload: (payload) => {
    const validationResult = AlbumPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
  validateCoverHeaders: (headers) => {
    const validationResult = CoverPayloadSchema.validate(headers);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = AlbumValidator;
