// GoClimb/src/services/api/CragService.js
// Mock-first; swap to real requests later.

import { CustomApiRequest, RequestMethod, BaseApiResponse } from './ApiHelper';

// ===== MOCK (works offline now) =====
export async function getCragInfo(cragId) {
  await delay(300);
  // You can vary this mock by cragId if you want.
  return {
    success: true,
    data: {
      id: cragId,
      name: cragId === 'df-yawning' ? 'Dairy Farm – Yawning Turtle' : 'Sample Crag',
      country: 'Singapore',
      description: 'Classic granite bouldering with pockets and ripple features.',
      // Typical shape you’d get from backend: sectors[] with routes[] inside
      sectors: [
        {
          id: 'yawning',
          name: 'Yawning Turtle',
          routes: [
            { id: 'bebop', name: 'Bebop', grade: '6B' },
            { id: 'rocksteady', name: 'Rocksteady', grade: '6B' },
            { id: 'shredder', name: 'Shredder', grade: '6B+' },
          ],
        },
      ],
      access: 'Short approach. Respect closures.',
      photos: [],
    },
  };
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

/* ===== REAL REQUEST (enable when backend is ready) =====

const BASE_URL = '<YOUR_BACKEND_BASE_URL>/'; // e.g. https://api.yourdomain.com/

export async function getCragInfo(cragId) {
  const req = new CustomApiRequest(
    RequestMethod.GET,
    BASE_URL,
    `crag/get_crag_info/?crag_id=${encodeURIComponent(cragId)}`,
    null,
    true // include App Check header via your helper
  );
  const ok = await req.sendRequest(BaseApiResponse);
  return ok ? req.parsedResponse : { success: false, data: null };
}

*/
