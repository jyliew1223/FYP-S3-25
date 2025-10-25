// GoClimb/src/services/api/PostsService.js
// Mock API for forum posts + comments. Swap to real endpoints later.
// Real endpoints (when backend is ready):
//  - GET  post/get_post/?post_id=...                 → 1 post (with comments if your API supports)
//  - POST post/get_random_post/                      → feed ({ count, blacklist })
//  - POST post/get_post_by_user_id/                  → posts by user ({ id_token })

// ===== MOCK DATA =====
const MOCK_POSTS = [
  {
    id: 'p001',
    author: { id: 'u001', name: 'Aly', avatar: null },
    title: 'Best shoes for granite slabs?',
    body: 'Been slipping on the turtle again 🙃 Any shoe suggestions for Singapore granite? Short list so far: Katana, Kubo, Theory…',
    createdAt: Date.now() - 3600 * 1000 * 2, // 2h
    tags: ['gear', 'boulder'],
    imageUrl: null, // text-only post
    likes: 12,
    comments: 3,
  },
  {
    id: 'p002',
    author: { id: 'u002', name: 'Ben', avatar: null },
    title: 'Beta for “Shredder” 6B+',
    body: 'Finally linked the middle section. Right hand crimp → left bump to the dish, toe hook helps a ton.',
    createdAt: Date.now() - 3600 * 1000 * 5,
    tags: ['beta', 'dairy-farm'],
    imageUrl: 'placeholder://grey', // image post → grey placeholder in UI
    likes: 31,
    comments: 7,
  },
  {
    id: 'p003',
    author: { id: 'u003', name: 'Cheryl', avatar: null },
    title: 'Morning circuit @ Yawning Turtle',
    body: 'Fun mileage today. Conditions were crisp. Anyone down for Saturday 7am?',
    createdAt: Date.now() - 3600 * 1000 * 8,
    tags: ['partner', 'session'],
    imageUrl: null,
    likes: 9,
    comments: 1,
  },
  {
    id: 'p004',
    author: { id: 'u004', name: 'Dee', avatar: null },
    title: 'Rocksteady send!',
    body: 'Big thanks to everyone for the spot 🙌',
    createdAt: Date.now() - 3600 * 1000 * 12,
    tags: ['send', 'video'],
    imageUrl: 'placeholder://grey',
    likes: 54,
    comments: 12,
  },
];

const MOCK_COMMENTS = {
  p001: [
    { id: 'c1', author: { id: 'u010', name: 'JR' }, text: 'Katana Lace grips well on slick granite.', createdAt: Date.now() - 3600 * 1000 * 1.6 },
    { id: 'c2', author: { id: 'u011', name: 'Ming' }, text: 'Try soft rubber + good footwork. Theory is nice.', createdAt: Date.now() - 3600 * 1000 * 1.2 },
  ],
  p002: [
    { id: 'c3', author: { id: 'u012', name: 'Pao' }, text: 'Toe hook beta saved me too!', createdAt: Date.now() - 3600 * 1000 * 3.5 },
  ],
  p003: [
    { id: 'c4', author: { id: 'u013', name: 'Iqbal' }, text: 'Sat 7am I’m in.', createdAt: Date.now() - 3600 * 1000 * 7.7 },
  ],
  p004: [
    { id: 'c5', author: { id: 'u014', name: 'Wei' }, text: 'Huge send! Congrats!', createdAt: Date.now() - 3600 * 1000 * 10.3 },
    { id: 'c6', author: { id: 'u015', name: 'SW' }, text: 'Video or it didn’t happen 😜', createdAt: Date.now() - 3600 * 1000 * 9.8 },
  ],
};

function delay(ms) { return new Promise((res) => setTimeout(res, ms)); }

// Feed (pretend: post/get_random_post/)
export async function fetchRandomPosts({ count = 10, blacklist = [] } = {}) {
  await delay(300);
  const pool = MOCK_POSTS.filter((p) => !blacklist.includes(p.id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length));
  return { success: true, data: shuffled, message: 'ok' };
}

// Single post (pretend: post/get_post/?post_id=...)
export async function fetchPostById(postId) {
  await delay(200);
  const post = MOCK_POSTS.find((p) => p.id === postId);
  if (!post) return { success: false, data: null, message: 'Not found' };
  return { success: true, data: post };
}

// Comments for a post (many APIs return them separately)
export async function fetchCommentsByPostId(postId) {
  await delay(200);
  return { success: true, data: MOCK_COMMENTS[postId] ?? [] };
}

// Optional: posts by user (pretend: post/get_post_by_user_id/)
export async function fetchPostsByUserId({ id_token }) {
  await delay(300);
  return { success: true, data: MOCK_POSTS.slice(0, 2), message: 'ok' };
}
