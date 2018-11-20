const { expect } = require('chai');

const playlist = require('../../src/state/playlist');

const mockApp = require('../_utils/mocking/platforms/app');

describe('playlist', () => {
  let app;

  beforeEach(() => {
    app = mockApp({
      getData: {
        playlist: {
          current: 1,
          items: [
            { track: 1, title: 'song 1' },
            { track: 2, title: 'song 2' },
            { track: 3, title: 'song 3' },
          ],
        },
      },
    });
  });

  describe('extra parameters', () => {
    beforeEach(() => {
      app = mockApp();
    });

    it('should have empty extra parameters by default', () => {
      expect(playlist.getExtra(app)).to.be.undefined;
    });

    it('should allow to store extra parameters', () => {
      playlist.setExtra(app, 'hello world!');
      expect(playlist.getExtra(app)).to.be.equal('hello world!');
    });
  });

  describe('reducers', () => {
    describe('create', () => {
      it('should populate list of items and reset current song', () => {
        playlist.create(app, [
          { track: 3, title: 'song 3' },
          { track: 4, title: 'song 4' },
        ]);

        expect(playlist.getCurrentSong(app)).to.have.property('title', 'song 3');
      });
    });

    describe('next', () => {
      it('should move pointer to the next song', () => {
        playlist.next(app);
        expect(app.persist.getData('playlist')).to.have.property('current', 2);
      });
    });

    describe('isEmpty', () => {
      it('should be true for empty playlist', () => {
        app = mockApp();
        expect(playlist.isEmpty(app)).to.be.true;
      });

      it('should be false for non-empty playlist', () => {
        playlist.create(app, [1, 2, 3]);
        expect(playlist.isEmpty(app)).to.be.false;
      });
    });
  });

  describe('loop', () => {
    it('should be off by default', () => {
      expect(playlist.isLoop(app)).to.be.false;
    });

    it('should be on when enabled', () => {
      playlist.setLoop(app, true);
      expect(playlist.isLoop(app)).to.be.true;
    });

    it('should exist after create', () => {
      playlist.setLoop(app, true);
      playlist.create(app);
      expect(playlist.isLoop(app)).to.be.true;
    });
  });

  describe('selectors', () => {
    describe('getCurrentSong', () => {
      it('should return current song', () => {
        const song = playlist.getCurrentSong(app);
        expect(song).to.have.property('track', 2);
        expect(song).to.have.property('title', 'song 2');
      });
    });

    describe('getNextItem', () => {
      it('should return next song', () => {
        const song = playlist.getNextItem(app);
        expect(song).to.have.property('track', 3);
        expect(song).to.have.property('title', 'song 3');
      });

      it('should loop next song if loop is on', () => {
        playlist.next(app);
        playlist.setLoop(app, true);
        const song = playlist.getNextItem(app);
        expect(song).to.have.property('track', 1);
        expect(song).to.have.property('title', 'song 1');
      });

      it('should return no song if loop is off', () => {
        playlist.next(app);
        playlist.setLoop(app, false);
        expect(() => {
          playlist.getNextItem(app);
        }).to.throw(playlist.errors.PlaylistStateError);
      });
    });

    describe('hasNextSong', () => {
      it('should return true if we have next song', () => {
        expect(playlist.hasNextSong(app)).to.be.true;
      });

      it('should return false if we do not have next song', () => {
        app = mockApp({
          getData: {
            playlist: {
              current: 2,
              items: [
                { track: 1, title: 'song 1' },
                { track: 2, title: 'song 2' },
                { track: 3, title: 'song 3' },
              ],
            },
          },
        });
        expect(playlist.hasNextSong(app)).to.be.false;
      });
    });
  });
});
