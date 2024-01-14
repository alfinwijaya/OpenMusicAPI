const { Pool } = require('pg');

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
  }

  async getPlaylistById(id) {
    let queryStr = {
      text: `SELECT p.id, p.name
      FROM playlists p
      WHERE p.id = $1`,
      values: [id],
    };
    const playlist = await this._pool.query(queryStr);

    queryStr = {
      text: `SELECT s.id, s.title, s.performer
      FROM playlist_song ps
      LEFT JOIN songs s on ps.song_id = s.id
      WHERE Exists (Select 1 From playlists p Where p.id = ps.playlist_id
                    and p.id = $1)`,
      values: [id],
    };

    const songs = await this._pool.query(queryStr);
    const result = playlist.rows[0];
    result.songs = songs.rows;
    return result;
  }
}

module.exports = PlaylistsService;
