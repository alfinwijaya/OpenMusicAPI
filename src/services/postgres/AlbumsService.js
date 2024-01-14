const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapAlbumDBToModel, mapAlbumsDBToModel } = require('../../utils');

class AlbumService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;
    const createdAt = new Date().toISOString();

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $4) RETURNING id',
      values: [id, name, year, createdAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbums() {
    const result = await this._pool.query('SELECT * FROM albums');
    return result.rows.map(mapAlbumsDBToModel);
  }

  async getAlbumById(id) {
    let query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    query = {
      text: 'SELECT id, title, performer FROM songs WHERE album_id = $1',
      values: [id],
    };

    const songs = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const album = mapAlbumDBToModel(result.rows[0]);
    album.songs = songs.rows;

    return album;
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async updateAlbumCoverById(albumId, coverUrl) {
    const query = {
      text: 'UPDATE albums SET cover_url = $1 WHERE id = $2',
      values: [coverUrl, albumId],
    };

    await this._pool.query(query);
  }

  async addLike(albumId, userId) {
    let query = {
      text: 'SELECT 1 FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    let result = await this._pool.query(query);
    if (result.rowCount) {
      throw new InvariantError('Sudah pernah dilike');
    }

    const id = `likes-${nanoid(16)}`;

    query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Like gagal ditambahkan');
    }

    await this._cacheService.delete(`album:${albumId}`);
    return result.rows[0].id;
  }

  async deleteLike(albumId, userId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Like gagal dihapus');
    }

    await this._cacheService.delete(`album:${albumId}`);
  }

  async getLikesAlbumCount(albumId) {
    try {
      const result = await this._cacheService.get(`album:${albumId}`);
      const json = JSON.parse(result);
      json.cache = true;
      return json;
    } catch (error) {
      const query = {
        text: 'Select Count(1) FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);

      const count = result.rows[0];
      await this._cacheService.set(`album:${albumId}`, JSON.stringify(count));

      return count;
    }
  }
}

module.exports = AlbumService;
