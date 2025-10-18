// src/services/api/MockProfile.js
export async function fetchUserClimbStatsMock() {
  console.log('[MockProfile] Fetching climb stats (mock)...');
  // simulate delay
  await new Promise((res) => setTimeout(res, 800));

  return {
    success: true,
    message: 'Mock stats fetched successfully',
    data: {
      on_sight: 12,
      red_point: 34,
      avg_grade: '6C+',
      avg_attempts: 18,
    },
  };
}
