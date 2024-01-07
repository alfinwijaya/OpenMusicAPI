/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable('playlist_song', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    song_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
  });

  pgm.addConstraint('playlist_song', 'fk_playlist_song.playlist_id_playlist.id', 'FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE');
  pgm.addConstraint('playlist_song', 'fk_playlist_song.playlist_id_songs.id', 'FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE');
};

exports.down = (pgm) => {
  pgm.dropTable('playlist_song');
};
