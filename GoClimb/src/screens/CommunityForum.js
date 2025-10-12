import React, { useMemo, useState } from 'react';

export default function CommunityForumPage() {
  const [posts, setPosts] = useState(createSamplePosts());
  const [lightbox, setLightbox] = useState({ isOpen: false, postId: null, index: 0 });

  const rankings = useMemo(
    () => [
      { username: 'CragQueen', tops: 27 },
      { username: 'GraniteGoat', tops: 22 },
      { username: 'PebbleWizard', tops: 19 },
    ],
    []
  );

  const trendingSpots = useMemo(
    () => [
      { id: 'spot-1', name: 'Red River Gorge', image: unsplash('climb,rock,1') },
      { id: 'spot-2', name: 'Yosemite', image: unsplash('yosemite,climb,granite') },
      { id: 'spot-3', name: 'Kalymnos', image: unsplash('climb,sea,limestone') },
    ],
    []
  );

  function toggleLike(postId) {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {
              ...p,
              likedByUser: !p.likedByUser,
              likes: p.likedByUser ? p.likes - 1 : p.likes + 1,
            }
          : p
      )
    );
  }

  async function sharePost(post) {
    const url = `https://goclimb.app/post/${post.id}`;
    const text = `Check out ${post.user}'s climb at ${post.title} — ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'GoClimb', text, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } else {
        prompt('Copy this link', url);
      }
    } catch {
      // user cancelled share; no-op
    }
  }

  function openLightbox(postId, index) {
    setLightbox({ isOpen: true, postId, index });
  }

  function closeLightbox() {
    setLightbox({ isOpen: false, postId: null, index: 0 });
  }

  function stepLightbox(delta) {
    if (!lightbox.isOpen) return;
    const post = posts.find(p => p.id === lightbox.postId);
    if (!post) return;
    const next = (lightbox.index + delta + post.images.length) % post.images.length;
    setLightbox(lb => ({ ...lb, index: next }));
  }

  const activeLightboxImage = (() => {
    if (!lightbox.isOpen) return null;
    const post = posts.find(p => p.id === lightbox.postId);
    return post ? post.images[lightbox.index] : null;
  })();

  return (
    <div style={styles.page}>
      {/* Top Bar */}
      <div style={styles.topbar}>
        <div style={styles.hamburger} aria-hidden>
          ☰
        </div>
        <input
          style={styles.search}
          placeholder="Find Routes..."
          aria-label="Search routes"
        />
        <div style={styles.avatar} aria-hidden />
      </div>

      {/* Upgrade banner */}
      <div style={styles.banner}>
        <div style={{ fontWeight: 800, color: '#ff8a00' }}>Tentative</div>
        <div>
          <div style={{ fontWeight: 700 }}>Upgrade to Climb+</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>To access premium features</div>
        </div>
      </div>

      {/* Monthly Rankings */}
      <section style={styles.section}>
        <h2 style={styles.h2}>Monthly Rankings (Tops)</h2>
        <div>
          {rankings.map((r, i) => (
            <div key={r.username} style={styles.rankRow}>
              <div style={styles.rankLeft}>
                <span style={styles.rankNum}>{i + 1}</span>
                <span style={{ fontWeight: 600 }}>{r.username}</span>
              </div>
              <div style={{ fontWeight: 700 }}>{r.tops} routes</div>
            </div>
          ))}
        </div>
        <button type="button" style={styles.ghostButton}>
          See Full List
        </button>
      </section>

      {/* Trending Spots */}
      <section style={styles.section}>
        <h2 style={styles.h2}>Trending Spots</h2>
        <div style={styles.cardRow}>
          {trendingSpots.map(spot => (
            <button
              type="button"
              key={spot.id}
              style={styles.spotCard}
              onClick={() => alert(`Open details for ${spot.name}`)}
            >
              <img src={spot.image} alt={spot.name} style={styles.spotImg} />
              <div style={styles.spotLabel}>{spot.name}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Community Posts */}
      <section style={{ ...styles.section, paddingBottom: 96 }}>
        <h2 style={styles.h2}>User Posts</h2>
        <div style={{ display: 'grid', gap: 16 }}>
          {posts.map(post => (
            <article key={post.id} style={styles.postCard}>
              <header style={styles.postHeader}>
                <div style={styles.userRow}>
                  <div style={styles.userAvatar} aria-hidden />
                  <div style={{ fontWeight: 700 }}>@{post.user}</div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {new Date(post.createdAt).toLocaleString()}
                </div>
              </header>

              {/* Images */}
              <div style={styles.postImages}>
                {post.images.map((src, idx) => (
                  <button
                    type="button"
                    key={src}
                    onClick={() => openLightbox(post.id, idx)}
                    style={styles.imageBtn}
                    aria-label={`Open image ${idx + 1} from ${post.title}`}
                  >
                    <img src={src} alt={`${post.title} ${idx + 1}`} style={styles.postImg} />
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div style={styles.actionsRow}>
                <button
                  type="button"
                  onClick={() => toggleLike(post.id)}
                  style={styles.iconBtn}
                  aria-pressed={post.likedByUser}
                  aria-label={post.likedByUser ? 'Unlike' : 'Like'}
                >
                  <HeartIcon filled={post.likedByUser} />
                  <span style={{ marginLeft: 6 }}>{post.likes}</span>
                </button>

                <button
                  type="button"
                  onClick={() => sharePost(post)}
                  style={styles.iconBtn}
                  aria-label="Share post"
                >
                  <ShareIcon />
                  <span style={{ marginLeft: 6 }}>Share</span>
                </button>
              </div>

              {/* Text */}
              <h3 style={styles.postTitle}>{post.title}</h3>
              <p style={styles.postBody}>{post.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Bottom Nav */}
      <nav style={styles.bottomNav} aria-label="Primary">
        <NavIcon label="Home">🏠</NavIcon>
        <NavIcon label="Climbs">🧗</NavIcon>
        <NavIcon label="Map">📍</NavIcon>
        <NavIcon label="Chat">💬</NavIcon>
        <NavIcon label="Routes">🧭</NavIcon>
      </nav>

      {/* Lightbox */}
      {lightbox.isOpen && activeLightboxImage && (
        <div style={styles.lightboxBackdrop} onClick={closeLightbox} role="dialog" aria-modal>
          <div style={styles.lightboxBody} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={closeLightbox} style={styles.lightboxClose} aria-label="Close">
              ✕
            </button>
            <button type="button" onClick={() => stepLightbox(-1)} style={styles.lightboxArrow} aria-label="Previous image">
              ‹
            </button>
            <img src={activeLightboxImage} alt="Post" style={styles.lightboxImg} />
            <button type="button" onClick={() => stepLightbox(1)} style={styles.lightboxArrow} aria-label="Next image">
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Helpers & Small Components ---------- */

function NavIcon({ children, label }) {
  return (
    <button type="button" style={styles.navBtn} aria-label={label} title={label}>
      <span style={{ fontSize: 22 }}>{children}</span>
    </button>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 21s-6.716-4.438-9.243-7.106C.73 11.77.514 8.6 2.627 6.49 4.74 4.377 7.91 4.594 9.894 6.577L12 8.682l2.106-2.105c1.983-1.984 5.154-2.2 7.267-.088 2.113 2.112 1.897 5.282-.13 7.404C18.716 16.562 12 21 12 21z"
        fill={filled ? '#ff3b3b' : 'none'}
        stroke={filled ? '#ff3b3b' : '#222'}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M15 8l-6 3m6 5l-6-3M18 5a3 3 0 11-6 0 3 3 0 016 0zM21 19a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0z"
        fill="none"
        stroke="#222"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function createSamplePosts() {
  return [
    {
      id: 'p-101',
      user: 'mossyFeet',
      title: 'Perfect fall day at Red River Gorge',
      body:
        'Got on a few long pumpy lines at Solar Collector. The exposure was unreal and the crowd energy was great!',
      createdAt: Date.now() - 1000 * 60 * 60 * 5,
      likes: 12,
      likedByUser: false,
      images: [
        unsplash('red river gorge rock climb 1'),
        unsplash('limestone cliff climb 2'),
        unsplash('forest wall climbing 3'),
      ],
    },
    {
      id: 'p-102',
      user: 'sloper_sam',
      title: 'Granite dreams in Yosemite',
      body:
        'Linked a few pitches on Reed’s. The friction today was chef’s kiss. Who’s around this weekend?',
      createdAt: Date.now() - 1000 * 60 * 60 * 18,
      likes: 31,
      likedByUser: true,
      images: [
        unsplash('yosemite granite crack climb 1'),
        unsplash('valley wall granite 2'),
        unsplash('trad gear rack 3'),
      ],
    },
  ];
}

function unsplash(query) {
  const q = encodeURIComponent(query);
  return `https://images.unsplash.com/photo-154${Math.floor(
    Math.random() * 90 + 10
  )}0000?auto=format&fit=crop&w=1200&q=60&ixid=&q=${q}`;
}

/* ---------- Styles (inline objects for portability) ---------- */

const styles = {
  page: {
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: '#f2f2f2',
    color: '#111',
    minHeight: '100vh',
  },
  topbar: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 40px',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    backgroundColor: '#222',
    color: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  hamburger: { fontSize: 24, textAlign: 'center' },
  search: {
    width: '100%',
    borderRadius: 8,
    border: 0,
    padding: '10px 12px',
    outline: 'none',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '2px solid #fff',
    background:
      'radial-gradient(circle at 30% 30%, #ddd, #999)',
    justifySelf: 'end',
  },
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    backgroundColor: '#d9d9d9',
  },
  section: {
    backgroundColor: '#fff',
    margin: '12px',
    padding: 12,
    borderRadius: 10,
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  },
  h2: { margin: '4px 0 12px', fontSize: 22 },
  rankRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 8px',
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 8,
  },
  rankLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  rankNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    display: 'inline-grid',
    placeItems: 'center',
    fontWeight: 700,
    boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
  },
  ghostButton: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #cfcfcf',
    background: '#fafafa',
    cursor: 'pointer',
    marginTop: 8,
  },
  cardRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
  },
  spotCard: {
    display: 'grid',
    gridTemplateRows: '120px auto',
    gap: 6,
    border: '1px solid #e7e7e7',
    borderRadius: 10,
    overflow: 'hidden',
    background: '#fff',
    cursor: 'pointer',
  },
  spotImg: { width: '100%', height: 120, objectFit: 'cover', display: 'block' },
  spotLabel: { textAlign: 'left', padding: '6px 8px', fontWeight: 600 },
  postCard: {
    background: '#efefef',
    borderRadius: 12,
    padding: 10,
  },
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 4px',
    background: '#cfcfcf',
    borderRadius: 8,
    marginBottom: 8,
  },
  userRow: { display: 'flex', alignItems: 'center', gap: 8 },
  userAvatar: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #bbb, #888)',
  },
  postImages: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
  },
  imageBtn: { padding: 0, border: 0, background: 'transparent', cursor: 'zoom-in' },
  postImg: { width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, display: 'block' },
  actionsRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    padding: '8px 2px',
  },
  iconBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: 999,
    padding: '6px 10px',
    cursor: 'pointer',
  },
  postTitle: { margin: '2px 0 6px', fontSize: 18 },
  postBody: { margin: 0, opacity: 0.9, lineHeight: 1.45 },
  bottomNav: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    background: '#1f1f1f',
    color: '#fff',
  },
  navBtn: {
    border: 0,
    background: 'transparent',
    color: '#fff',
    cursor: 'pointer',
  },
  lightboxBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 100,
    padding: 16,
  },
  lightboxBody: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: '40px 1fr 40px',
    alignItems: 'center',
    gap: 8,
    maxWidth: 900,
    width: '100%',
  },
  lightboxImg: {
    width: '100%',
    maxHeight: '75vh',
    objectFit: 'contain',
    borderRadius: 10,
    background: '#000',
  },
  lightboxClose: {
    position: 'absolute',
    top: -10,
    right: -10,
    background: '#fff',
    border: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    cursor: 'pointer',
  },
  lightboxArrow: {
    background: '#fff',
    border: 0,
    width: 40,
    height: 40,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 22,
    fontWeight: 700,
  },
};