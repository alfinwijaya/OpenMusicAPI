const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }
    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT p.id, p.name, u.username
      FROM playlists p
      LEFT JOIN users u on p.owner = u.id
      WHERE p.owner = $1
      OR Exists (Select 1 From collaborations c where c.playlist_id = p.id and c.user_id = $1)`,
      values: [owner],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getPlaylistById(id) {
    let query = {
      text: `SELECT p.id, p.name, u.username
      FROM playlists p
      LEFT JOIN users u on p.owner = u.id
      WHERE p.id = $1`,
      values: [id],
    };
    const playlist = await this._pool.query(query);
    if (!playlist.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    query = {
      text: `SELECT s.id, s.title, s.performer
      FROM playlist_song ps
      LEFT JOIN songs s on ps.song_id = s.id
      WHERE Exists (Select 1 From playlists p Where p.id = ps.playlist_id
                    and p.id = $1)`,
      values: [id],
    };

    const songs = await this._pool.query(query);
    const result = playlist.rows[0];
    result.songs = songs.rows;
    return result;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async addPlaylistSong(playlistId, songId, userId) {
    let id = `playlist_song-${nanoid(16)}`;

    let query = {
      text: 'INSERT INTO playlist_song VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }

    id = `playlist_activities-${nanoid(16)}`;
    query = {
      text: 'INSERT INTO playlist_activities VALUES($1, $2, $3, $4, $5, $6)',
      values: [id, playlistId, songId, userId, 'add', new Date().toISOString()],
    };

    await this._pool.query(query);

    return result.rows[0].id;
  }

  async deletePlaylistSong(playlistId, songId, userId) {
    let query = {
      text: 'DELETE FROM playlist_song WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Lagu gagal dihapus dari playlist');
    }

    const id = `playlist_activities-${nanoid(16)}`;
    query = {
      text: 'INSERT INTO playlist_activities VALUES($1, $2, $3, $4, $5, $6)',
      values: [id, playlistId, songId, userId, 'delete', new Date().toISOString()],
    };

    await this._pool.query(query);
  }

  async getPlaylistActivitiesById(id) {
    let query = {
      text: `SELECT p.id playlistId
      From playlists p
      WHERE p.id = $1`,
      values: [id],
    };
    const playlist = await this._pool.query(query);
    if (!playlist.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    query = {
      text: `SELECT u.username, s.title, pa.action, pa.time
      FROM playlist_activities pa
      LEFT JOIN songs s on pa.song_id = s.id
      LEFT JOIN users u on pa.user_id = u.id
      WHERE pa.playlist_id = $1`,
      values: [id],
    };

    const activities = await this._pool.query(query);
    return activities.rows;
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    const note = result.rows[0];
    if (note.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;
