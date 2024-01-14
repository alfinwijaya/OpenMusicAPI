/* eslint-disable camelcase */
const mapSongsDBToModel = ({
  id,
  title,
  performer,
}) => ({
  id,
  title,
  performer,
});

const mapSongDBToModel = ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  album_id,
  created_at,
  updated_at,
}) => ({
  id,
  title,
  year: parseInt(year, 10),
  genre,
  performer,
  duration: parseInt(duration, 10),
  albumId: album_id,
  createdAt: created_at,
  updatedAt: updated_at,
});

const mapAlbumsDBToModel = ({
  id,
  name,
  year,
  created_at,
  updated_at,
}) => ({
  id,
  name,
  year: parseInt(year, 10),
  createdAt: created_at,
  updatedAt: updated_at,
});

const mapAlbumDBToModel = ({
  id,
  name,
  year,
  cover_url,
  songs,
  created_at,
  updated_at,
}) => ({
  id,
  name,
  year: parseInt(year, 10),
  coverUrl: cover_url,
  songs,
  createdAt: created_at,
  updatedAt: updated_at,
});

module.exports = {
  mapAlbumsDBToModel,
  mapAlbumDBToModel,
  mapSongsDBToModel,
  mapSongDBToModel,
};
