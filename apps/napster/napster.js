/**
 * Napster v2.0 BETA – Namespace + song database.
 * Songs popular with 9-12 year olds, circa 2000-2003.
 */
(function () {
  'use strict';

  // Songs: [artist, title, length_seconds, genre]
  var SONGS = [
    // Pop
    ['Backstreet Boys', 'I Want It That Way', 215, 'Pop'],
    ['Backstreet Boys', "Everybody (Backstreet's Back)", 244, 'Pop'],
    ['Backstreet Boys', 'Shape of My Heart', 219, 'Pop'],
    ['*NSYNC', 'Bye Bye Bye', 200, 'Pop'],
    ['*NSYNC', "It\'s Gonna Be Me", 235, 'Pop'],
    ['*NSYNC', 'Tearin\' Up My Heart', 213, 'Pop'],
    ['Britney Spears', '...Baby One More Time', 211, 'Pop'],
    ['Britney Spears', 'Oops!... I Did It Again', 204, 'Pop'],
    ['Britney Spears', 'Toxic', 198, 'Pop'],
    ['Christina Aguilera', 'Genie In A Bottle', 220, 'Pop'],
    ['Christina Aguilera', 'Beautiful', 234, 'Pop'],
    ['Destiny\'s Child', 'Say My Name', 238, 'R&B'],
    ['Destiny\'s Child', 'Survivor', 243, 'R&B'],
    ['Destiny\'s Child', 'Bootylicious', 219, 'R&B'],
    ['Kelly Clarkson', 'A Moment Like This', 258, 'Pop'],
    ['Kelly Clarkson', 'Miss Independent', 210, 'Pop'],
    ['Spice Girls', 'Wannabe', 173, 'Pop'],
    ['Spice Girls', 'Spice Up Your Life', 175, 'Pop'],
    ['Nelly Furtado', "I'm Like A Bird", 244, 'Pop'],
    ['P!nk', 'Get The Party Started', 195, 'Pop'],
    ['P!nk', 'Just Like A Pill', 228, 'Pop'],
    ['No Doubt', 'Hella Good', 228, 'Pop Rock'],
    ['No Doubt', "Don't Speak", 255, 'Pop Rock'],
    // Pop-punk / Rock
    ['Blink-182', 'All The Small Things', 167, 'Pop Punk'],
    ['Blink-182', "What's My Age Again", 149, 'Pop Punk'],
    ['Blink-182', 'I Miss You', 228, 'Pop Punk'],
    ['Blink-182', 'Dammit', 172, 'Pop Punk'],
    ['Sum 41', 'Fat Lip', 139, 'Pop Punk'],
    ['Sum 41', 'In Too Deep', 198, 'Pop Punk'],
    ['Sum 41', 'Still Waiting', 200, 'Pop Punk'],
    ['Avril Lavigne', 'Complicated', 244, 'Pop Punk'],
    ['Avril Lavigne', 'Sk8er Boi', 194, 'Pop Punk'],
    ['Avril Lavigne', 'I\'m With You', 227, 'Pop Punk'],
    ['Simple Plan', "I\'m Just A Kid", 207, 'Pop Punk'],
    ['Simple Plan', 'Addicted', 200, 'Pop Punk'],
    ['Good Charlotte', 'The Anthem', 207, 'Pop Punk'],
    ['Good Charlotte', 'Lifestyles of the Rich & Famous', 232, 'Pop Punk'],
    ['Good Charlotte', 'Girls & Boys', 195, 'Pop Punk'],
    ['Green Day', 'Minority', 168, 'Punk Rock'],
    ['Green Day', 'Basket Case', 181, 'Punk Rock'],
    // Alt / Rock
    ['Linkin Park', 'In The End', 216, 'Nu Metal'],
    ['Linkin Park', 'Crawling', 209, 'Nu Metal'],
    ['Linkin Park', 'Numb', 187, 'Nu Metal'],
    ['Linkin Park', 'Breaking The Habit', 196, 'Nu Metal'],
    ['Evanescence', 'Bring Me To Life', 223, 'Rock'],
    ['Evanescence', 'My Immortal', 225, 'Rock'],
    ['Nickelback', 'How You Remind Me', 223, 'Rock'],
    ['Nickelback', 'Someday', 214, 'Rock'],
    ['Puddle of Mudd', 'Blurry', 278, 'Rock'],
    ['Lifehouse', 'Hanging by a Moment', 224, 'Rock'],
    ['Lifehouse', 'Everything', 240, 'Rock'],
    ['The Calling', 'Wherever You Will Go', 220, 'Rock'],
    ['Train', 'Drops of Jupiter', 268, 'Rock'],
    ['Coldplay', 'Yellow', 269, 'Alternative'],
    ['Default', 'Wasting My Time', 208, 'Rock'],
    // Hip-Hop / R&B
    ['Eminem', 'Without Me', 295, 'Hip-Hop'],
    ['Eminem', 'Lose Yourself', 326, 'Hip-Hop'],
    ['Eminem', 'The Real Slim Shady', 284, 'Hip-Hop'],
    ['Nelly', 'Hot In Herre', 215, 'Hip-Hop'],
    ['Nelly', 'Dilemma (feat. Kelly Rowland)', 239, 'Hip-Hop'],
    ['Nelly', 'Ride Wit Me', 210, 'Hip-Hop'],
    ['50 Cent', 'In Da Club', 193, 'Hip-Hop'],
    ['50 Cent', 'Candy Shop', 198, 'Hip-Hop'],
    ['Outkast', 'Hey Ya!', 234, 'Hip-Hop'],
    ['Black Eyed Peas', 'Where Is The Love', 263, 'Hip-Hop'],
    ['Alicia Keys', "Fallin'", 213, 'R&B'],
    ['Alicia Keys', 'If I Ain\'t Got You', 215, 'R&B'],
    ['Missy Elliott', 'Work It', 256, 'Hip-Hop'],
    ['Chingy', 'Right Thurr', 198, 'Hip-Hop'],
    // Pop / Dance / Other
    ['Smash Mouth', 'All Star', 199, 'Pop Rock'],
    ['Smash Mouth', 'I\'m A Believer', 174, 'Pop Rock'],
    ['Shaggy', "It Wasn't Me", 220, 'Reggae Pop'],
    ['Shaggy', 'Angel', 247, 'Reggae Pop'],
    ['Nelly Furtado', 'Turn Off the Light', 234, 'Pop'],
    ['Michelle Branch', 'Everywhere', 210, 'Pop Rock'],
    ['Michelle Branch', 'Goodbye to You', 218, 'Pop Rock'],
    ['Vanessa Carlton', 'A Thousand Miles', 236, 'Pop'],
    ['3 Doors Down', 'Kryptonite', 236, 'Rock'],
    ['3 Doors Down', 'Here Without You', 227, 'Rock'],
    ['Matchbox Twenty', 'Unwell', 238, 'Rock'],
    ['Wheatus', 'Teenage Dirtbag', 213, 'Pop Rock'],
    ['The White Stripes', 'Seven Nation Army', 231, 'Rock'],
    ['Dashboard Confessional', 'Vindicated', 191, 'Emo'],
    ['Taking Back Sunday', 'Cute Without The E', 221, 'Emo'],
    ['Jimmy Eat World', 'The Middle', 162, 'Pop Punk'],
    ['Jimmy Eat World', 'Sweetness', 195, 'Pop Punk'],
    ['Saves The Day', 'At Your Funeral', 163, 'Emo'],
    ['New Found Glory', 'My Friends Over You', 180, 'Pop Punk'],
  ];

  // Realistic P2P usernames
  var USERNAMES = [
    'mp3freak2003','xXnapsterXx','kazaagod','limewireman','ilikepie99',
    'Emub7','d00dster','sk8rpunk','WiNaMpRuLeS','broadband_bob',
    'slipknotfan01','napster4life','g0nzt5hi','cable_dude','dsl_rox',
    'CSUF_student','p2p_pwns','BitTwist','freemuzik','dl_king99',
    'matbai','Tinh69','bmathis27','Wingma','adie_m','bg_bang_',
    'raybauduc','angel9339','catalina136','stearch','Creano1',
    'KASDJFLKI','4phantom_','hiltermbiter','f4phantomm','dude_way',
    'cyberm00se','4StringMF','aoldude57','tubbebird','TYLERSEX',
    'lhull','mrbrin','lhudpockets','idhull',
  ];

  var LINE_SPEEDS = ['56K Modem','Cable','DSL','T1','T3','ISDN','Unknown'];

  // Format seconds → M:SS
  function fmtLen(s) {
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  // Format bytes → comma-separated
  function fmtSize(b) {
    return b.toLocaleString();
  }

  // Random int in [min, max]
  function rnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[rnd(0, arr.length - 1)];
  }

  // Generate file name variations for a song
  function makeFilenames(artist, title) {
    var clean = artist + ' - ' + title;
    var initials = artist.split(' ').map(function (w) { return w[0]; }).join('');
    var noSpace = (artist + title).replace(/[^a-zA-Z0-9]/g, '');
    return [
      clean + '.mp3',
      clean + ' (Radio Edit).mp3',
      clean + ' [128kbps].mp3',
      artist.toLowerCase().replace(/\s/g, '_') + '-' + title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.mp3',
      'Music\\' + clean + '.mp3',
      initials + ' - ' + title + '.mp3',
      '0' + rnd(1, 9) + ' - ' + title + '.mp3',
      clean + ' (live).mp3',
      title + ' - ' + artist + '.mp3',
      noSpace.slice(0, 20) + '.mp3',
    ];
  }

  // Generate search results for a query
  function search(query) {
    if (!query || !query.trim()) return [];
    var q = query.trim().toLowerCase();
    var matched = SONGS.filter(function (s) {
      return s[0].toLowerCase().indexOf(q) !== -1 ||
             s[1].toLowerCase().indexOf(q) !== -1;
    });

    // Expand each match into multiple result rows
    var results = [];
    matched.forEach(function (song) {
      var artist = song[0], title = song[1], len = song[2];
      var names = makeFilenames(artist, title);
      var count = Math.min(names.length, rnd(3, 8));
      for (var i = 0; i < count; i++) {
        var bitrate = pick([128, 128, 128, 160, 192, 96]);
        var sizeBytes = Math.round(len * bitrate * 1000 / 8);
        sizeBytes += rnd(-80000, 120000); // noise
        var dots = ['dot-green','dot-green','dot-green','dot-yellow','dot-red'];
        results.push({
          filename: names[i],
          filesize: fmtSize(sizeBytes),
          filesizeBytes: sizeBytes,
          bitrate: bitrate,
          freq: pick([44100, 44100, 44100, 22050]),
          length: fmtLen(len + rnd(-5, 5)),
          user: pick(USERNAMES),
          linespeed: pick(LINE_SPEEDS),
          ping: rnd(1, 9999),
          dot: pick(dots),
          rawArtist: artist,
          rawTitle: title,
        });
      }
    });

    // Shuffle
    for (var j = results.length - 1; j > 0; j--) {
      var k = rnd(0, j);
      var tmp = results[j]; results[j] = results[k]; results[k] = tmp;
    }

    return results.slice(0, Math.min(results.length, 100));
  }

  window.Napster97 = {
    SONGS: SONGS,
    USERNAMES: USERNAMES,
    LINE_SPEEDS: LINE_SPEEDS,
    search: search,
    fmtLen: fmtLen,
    fmtSize: fmtSize,
    rnd: rnd,
    pick: pick,
    downloads: [],      // active downloads
    searchResults: [],  // last search results
    selectedRow: null,  // selected result index
  };
})();
