/* eslint-disable prettier/prettier */
export async function getAuthData() {
  let jwt = null;
  let isLoggedIn = false;
  let isSubscriber = false;
  let userInfo = null;
  let hasGiftAccess = false;
  let isFreeArticle = false;

  try {
    // 🟢 Wait for the `entitlementsAsyncData` data
    const data = await window.entitlementsAsyncData;

    // 🔑 Extract JWT and authentication status
    jwt = data?.jwt || null;
    isLoggedIn = !!jwt;
    userInfo = data || null;

    // 🔎 Check if the user is a subscriber
    isSubscriber = !data?.isFree || (data?.tags?.includes("BARRONS-SUB") ?? false);
    
    // 🎁 Check if this is a gift article
    hasGiftAccess = 
      data?.access?.fullAccess === true &&
      data?.paywall?.experienceOutcome?.server_side_experience === "article-share";
    
    // 🆓 Check if this is a free article
    isFreeArticle = !!data?.isFree;

    // console.log("🔑 JWT found:", jwt);
    // console.log("🔐 User authenticated:", isLoggedIn);
    // console.log("👤 User information:", userInfo);
    // console.log("💳 User subscribed:", isSubscriber);

    return { jwt, isLoggedIn, isSubscriber, userInfo, hasGiftAccess, isFreeArticle };
  } catch (error) {
    // console.error("⚠️ Error retrieving authentication data:", error);
    return { 
      jwt: null, 
      isLoggedIn: false, 
      isSubscriber: false, 
      userInfo: null,
      hasGiftAccess: false,
      isFreeArticle: false
    };
  }
}

// export async function getAuthData() {
//   let jwt = null;
//   let isLoggedIn = false;
//   let isSubscriber = false;
//   let userInfo = null;

//   try {
//     if (!window.entitlementsAsyncData && window.location.hostname === 'localhost') {
//       // 🧪 MOCK para test local
//       window.entitlementsAsyncData = Promise.resolve({
//         jwt: 'fake.jwt.token',
//         isFree: false,
//         tags: ['BARRONS-SUB'],
//         userId: 'local-test-user',
//       });
//     }

//     const data = await window.entitlementsAsyncData;

//     jwt = data?.jwt || null;
//     isLoggedIn = !!jwt;
//     userInfo = data || null;
//     isSubscriber = !data?.isFree || (data?.tags?.includes('BARRONS-SUB') ?? false);

//     return { jwt, isLoggedIn, isSubscriber, userInfo };
//   } catch (error) {
//     return { jwt: null, isLoggedIn: false, isSubscriber: false, userInfo: null };
//   }
// }
