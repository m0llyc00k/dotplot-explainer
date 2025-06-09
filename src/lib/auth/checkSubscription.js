/* eslint-disable prettier/prettier */
import { getAuthData } from "./auth.js";

// export async function getAuthStatus() {
//   const { isSubscriber, isLoggedIn } = await getAuthData();
//   return { isSubscriber, isLoggedIn };
// }

// export async function shouldRenderBlock(index) {
//   const { isSubscriber, isLoggedIn } = await getAuthData();
//   return (isSubscriber && isLoggedIn) || index === 1;
// }

const isInternalEnv = () => {
  const host = window?.location?.hostname || "";
  const pathname = window?.location?.pathname || "";

  const isDevIframe =
    pathname.includes("/asset/") && pathname.endsWith("iframe.html");

  return (
    isDevIframe ||
    host.includes("localhost") ||
    host.includes("dev.barrons.com") ||
    host.endsWith(".dowjones.io") ||
    host.endsWith(".wsj.net")
  );
};

export async function getAuthStatus() {
  const { isSubscriber, isLoggedIn, hasGiftAccess, isFreeArticle } = await getAuthData();

  if (isInternalEnv()) {
    return {
      isSubscriber: true,
      isLoggedIn: true,
      hasGiftAccess: true,
      isFreeArticle: true,
    };
  }

  return {
    isSubscriber,
    isLoggedIn,
    hasGiftAccess,
    isFreeArticle,
  };
}

export async function shouldRenderBlock(index) {
  if (isInternalEnv()) return true;

  const { isSubscriber, isLoggedIn, hasGiftAccess, isFreeArticle } = await getAuthStatus();

  // Always show first block regardless of user status
  if (index === 1) return true;
  
  // Always show content for gift articles or free articles
  if (hasGiftAccess || isFreeArticle) return true;
  
  // Only show content if user is logged in AND is a subscriber
  return isSubscriber && isLoggedIn;
}
