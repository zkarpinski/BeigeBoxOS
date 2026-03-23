/**
 * Shared mock catalog for P2P-style search and library-style music apps.
 * Tuple: [artist, title, durationSeconds, genre] or add optional 5th: album name.
 */
export type StreamingSongTuple =
  | [string, string, number, string]
  | [string, string, number, string, string];

/** Same catalog used for LimeWire-style search / downloads and U2 album rows for iTunes. */
export const MOCK_STREAMING_SONGS: StreamingSongTuple[] = [
  ['Backstreet Boys', 'I Want It That Way', 215, 'Pop'],
  ['Backstreet Boys', "Everybody (Backstreet's Back)", 244, 'Pop'],
  ['*NSYNC', 'Bye Bye Bye', 200, 'Pop'],
  ['*NSYNC', "It's Gonna Be Me", 235, 'Pop'],
  ['Britney Spears', '...Baby One More Time', 211, 'Pop'],
  ['Britney Spears', 'Oops!... I Did It Again', 204, 'Pop'],
  ['Britney Spears', 'Toxic', 198, 'Pop'],
  ['Christina Aguilera', 'Genie In A Bottle', 220, 'Pop'],
  ["Destiny's Child", 'Say My Name', 238, 'R&B'],
  ["Destiny's Child", 'Survivor', 243, 'R&B'],
  ['Blink-182', 'All The Small Things', 167, 'Pop Punk'],
  ['Blink-182', "What's My Age Again", 149, 'Pop Punk'],
  ['Blink-182', 'I Miss You', 228, 'Pop Punk'],
  ['Sum 41', 'Fat Lip', 139, 'Pop Punk'],
  ['Avril Lavigne', 'Complicated', 244, 'Pop Punk'],
  ['Avril Lavigne', 'Sk8er Boi', 194, 'Pop Punk'],
  ['Simple Plan', "I'm Just A Kid", 207, 'Pop Punk'],
  ['Good Charlotte', 'The Anthem', 207, 'Pop Punk'],
  ['Green Day', 'Minority', 168, 'Punk Rock'],
  ['Linkin Park', 'In The End', 216, 'Nu Metal'],
  ['Linkin Park', 'Numb', 187, 'Nu Metal'],
  ['Evanescence', 'Bring Me To Life', 223, 'Rock'],
  ['Nickelback', 'How You Remind Me', 223, 'Rock'],
  ['Coldplay', 'Yellow', 269, 'Alternative'],
  ['Eminem', 'Without Me', 295, 'Hip-Hop'],
  ['Eminem', 'Lose Yourself', 326, 'Hip-Hop'],
  ['Nelly', 'Hot In Herre', 215, 'Hip-Hop'],
  ['50 Cent', 'In Da Club', 193, 'Hip-Hop'],
  ['Outkast', 'Hey Ya!', 234, 'Hip-Hop'],
  ['Black Eyed Peas', 'Where Is The Love', 263, 'Hip-Hop'],
  ['Alicia Keys', "Fallin'", 213, 'R&B'],
  ['Smash Mouth', 'All Star', 199, 'Pop Rock'],
  ['Shaggy', "It Wasn't Me", 220, 'Reggae Pop'],
  ['Vanessa Carlton', 'A Thousand Miles', 236, 'Pop'],
  ['3 Doors Down', 'Kryptonite', 236, 'Rock'],
  ['The White Stripes', 'Seven Nation Army', 231, 'Rock'],
  ['Jimmy Eat World', 'The Middle', 162, 'Pop Punk'],
  // U2 — Songs of Innocence (2014)
  ['U2', 'The Miracle (Of Joey Ramone)', 256, 'Rock', 'Songs of Innocence'],
  ['U2', 'Every Breaking Wave', 253, 'Rock', 'Songs of Innocence'],
  ['U2', 'California (There Is No End To Love)', 240, 'Rock', 'Songs of Innocence'],
  ['U2', 'Song For Someone', 227, 'Rock', 'Songs of Innocence'],
  ['U2', 'Iris (Hold Me Close)', 320, 'Rock', 'Songs of Innocence'],
  ['U2', 'Volcano', 194, 'Rock', 'Songs of Innocence'],
  ['U2', 'Raised By Wolves', 244, 'Rock', 'Songs of Innocence'],
  ['U2', 'Cedarwood Road', 266, 'Rock', 'Songs of Innocence'],
  ['U2', 'Sleep Like A Baby Tonight', 302, 'Rock', 'Songs of Innocence'],
  ['U2', 'This Is Where You Can Reach Me Now', 306, 'Rock', 'Songs of Innocence'],
  ['U2', 'The Troubles', 286, 'Rock', 'Songs of Innocence'],
];
