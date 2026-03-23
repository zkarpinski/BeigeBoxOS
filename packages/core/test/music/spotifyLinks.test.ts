import { spotifySearchUrlForTrack } from '../../music/spotifyLinks';

describe('spotifySearchUrlForTrack', () => {
  it('builds open.spotify.com search URL', () => {
    const url = spotifySearchUrlForTrack('Backstreet Boys', 'I Want It That Way');
    expect(url).toMatch(/^https:\/\/open\.spotify\.com\/search\//);
    expect(url).toContain(encodeURIComponent('backstreet-boys-i-want-it-that-way'));
  });
});
