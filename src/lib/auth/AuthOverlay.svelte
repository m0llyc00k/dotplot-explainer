<script>
  import { getAuthData } from './auth.js';

  const { showBlock = false } = $props();

  let isLoggedIn = $state(true);
  let isSubscriber = $state(true);
  let hasGiftAccess = $state(false);
  let isFreeArticle = $state(false);
  let isDevEnv = $state(false);

  let articleUrl = $state('');
  let loginUrl = $state('');

  const baseSrc = 'https://piano.vx.barrons.com/checkout/template/cacheableShow';
  const queryParams = [
    'aid=ETbHfCPwpu',
    'templateId=OTNQZSM19027',
    'templateVariantId=OTVV5MJFCAA82',
    'offerId=fakeOfferId',
    'experienceId=EXAL1X4TS0S0',
    'iframeId=offer_d85cb4e75bb61384edbd-0',
    'displayMode=inline',
    'pianoIdUrl=https%3A%2F%2Fpiano.auth.barrons.com%2Fid%2F',
    'widget=template',
  ];

  const isInternalEnv = () => {
    const host = window?.location?.hostname || '';
    const pathname = window?.location?.pathname || '';

    const isDevIframe = pathname.includes('/asset/') && pathname.endsWith('iframe.html');

    return (
      isDevIframe ||
      host.includes('localhost') ||
      host.includes('dev.barrons.com') ||
      host.endsWith('.dowjones.io') ||
      host.endsWith('.wsj.net')
    );
  };

  $effect(async () => {
    const {
      isLoggedIn: logged,
      isSubscriber: sub,
      hasGiftAccess: giftAccess,
      isFreeArticle: freeArticle,
    } = await getAuthData();

    isLoggedIn = logged;
    isSubscriber = sub;
    hasGiftAccess = giftAccess;
    isFreeArticle = freeArticle;
    isDevEnv = isInternalEnv();

    const { origin, pathname, hostname } = window.location;
    const searchParams = new URLSearchParams(window.location.search);

    const isDev = hostname.includes('dev');
    const loginHost = isDev ? 'https://www.s.dev.barrons.com' : 'https://www.barrons.com';

    const target = encodeURIComponent(`${origin}${pathname}`);

    const externalParams = [];
    for (const [key, value] of searchParams.entries()) {
      externalParams.push(`${key}=${encodeURIComponent(value)}`);
    }

    const extra = externalParams.length ? `&${externalParams.join('&')}` : '';

    loginUrl = `${loginHost}/client/login?opts=0&target=${target}${extra}`;
  });

  const fullIframeSrc = $derived(`${baseSrc}?${queryParams.join('&')}&url=${articleUrl}`);
</script>

{#if showBlock && !hasGiftAccess && !isFreeArticle && !isDevEnv}
  <div class="container paywall-message">
    {#if !isLoggedIn && isSubscriber}
      <div class="sign-in-message">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="320"
          height="65"
          viewBox="0 0 320 65"
          fill="black"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M8.59828 42.1558C7.81281 49.0599 5.98324 48.8688 3.76306 49.4339C1.75255 49.9438 2.51993 51.1272 3.82692 50.9402C4.31225 50.8707 7.90541 50.5018 10.3619 50.5018C13.8028 50.5018 16.9256 50.8135 18.6093 50.8135C19.3118 50.8135 20.2324 49.8754 18.5316 49.4339C16.5647 48.926 11.7391 49.4339 11.2783 41.1513C10.943 35.0914 11.5018 14.3711 11.5018 14.3711C11.5018 12.9241 11.7136 12.7054 11.9935 12.7054C12.482 12.7054 12.995 13.5219 13.4697 14.0819L43.4975 50.7491C46.667 54.3053 46.8639 53.2374 46.8 49.6608C46.5914 38.1183 46.9629 6.26124 46.9629 6.26124C47.0544 -0.00817516 52.9423 2.5374 52.9423 0.654023C52.9423 0.218689 52.6623 0 52.2419 0C50.556 0 45.707 0.504824 43.3208 0.504824C41.0719 0.504824 39.7415 0.178834 37.6352 0.178834C37.2169 0.178834 36.8561 0.397523 36.8635 0.905412C36.8955 2.93799 44.4468 -0.413874 44.185 9.94012L44.2595 39.9363C44.2595 40.5147 44.2191 41.6551 43.2069 39.9363L11.7678 1.90791C11.3453 1.40104 10.7152 0.241171 9.94146 0.241171C8.88884 0.241171 5.40957 0.504824 4.35695 0.504824C3.23409 0.504824 2.18041 0.215623 1.05755 0.215623C0.707389 0.215623 -0.0610529 0.507889 0.00387086 0.939136C0.398735 3.47654 8.63128 0.467012 8.76432 12.3263C8.76432 12.3263 8.93567 39.177 8.59828 42.1558Z"
            transform="translate(223.224 5.74219)"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M5.65518 0.0576362C4.709 0.333552 3.20404 1.5251 2.58567 1.93897C1.87364 2.41825 1.88854 3.21023 2.2536 3.88571C4.02251 7.14867 5.77119 12.5341 1.4064 19.01C0.687981 20.0758 -0.423172 20.3896 0.166463 20.83C0.788028 21.296 2.79108 19.991 3.62658 19.197C8.33515 14.7404 10.0338 7.14867 7.35384 1.62627C6.80891 0.503189 6.58646 -0.214192 5.65518 0.0576362Z"
            transform="translate(275.074)"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M1.38886 48.3197C1.67942 49.6145 7.80354 52.1478 13.2263 52.1478C29.867 52.1478 33.8028 43.435 33.8028 37.4006C33.8028 18.3236 5.5674 25.3053 5.5674 11.7956C5.5674 5.18895 10.888 2.38483 16.6789 2.38483C23.133 2.38483 28.3397 6.37335 30.2437 11.2571C30.4896 11.8927 30.8068 13.3295 31.6125 13.3295C32.3479 13.3295 32.1765 12.8114 32.1063 12.236L31.0558 2.19782C30.9834 1.40584 30.6194 1.19124 30.1767 1.19124C29.4444 1.19124 28.9985 2.47169 27.6287 2.2203C26.6197 2.03636 24.8497 0.064073 17.2696 0.00071453C8.837 -0.0687754 1.65069 4.93245 1.65069 14.0571C1.65069 32.1296 29.0975 25.2256 29.2316 38.5308C29.2997 46.0735 24.2974 49.9507 17.3303 49.9507C7.2171 49.9507 2.75546 42.4223 1.87845 39.1184C1.5102 37.6101 1.35268 36.7977 0.567206 36.9223C-0.154405 37.0388 -0.0841597 37.8461 0.210658 39.283C0.210658 39.283 1.15791 42.3814 1.38886 48.3197Z"
            transform="translate(285.495 4.45117)"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M26.2058 53.2129C42.8997 53.2129 54.5051 42.5554 54.5051 26.0189C54.5051 10.8026 42.7517 0 27.4798 0C12.1301 0 0 11.0969 0 26.3867C0 41.8932 9.95568 53.2129 26.2058 53.2129ZM25.656 2.9082C40.2543 2.9082 49.0456 15.4338 49.0456 28.8095C49.0456 42.4091 39.8573 50.7264 28.9256 50.7264C14.0996 50.7264 5.47217 37.8494 5.47217 24.2539C5.47217 12.6399 13.0768 2.9082 25.656 2.9082Z"
            transform="translate(172.256 4.82812)"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M27.0806 25.3902C31.8222 23.3709 36.2721 18.8193 36.2721 13.1906C36.2721 -0.738016 20.6159 0.00695651 19.5314 0.00695651C16.0064 0.00695651 11.4383 0.656891 7.50454 0.656891C4.04975 0.656891 2.57673 0.275719 1.35701 0.275719C0.542805 0.275719 0 0.709009 0 1.1423C0 3.59591 7.84193 -0.0502703 7.64291 7.658V44.3926C7.64291 49.8751 3.69214 49.4235 2.84387 50.0489C2.48732 50.3135 2.10949 51.3048 2.51606 51.3048C5.09066 51.3048 7.9803 50.9931 10.556 50.9931C16.182 50.9931 19.6304 51.2619 20.2168 51.4213C21.2077 51.6829 21.6643 50.4903 20.5531 50.1133C19.1951 49.6534 13.1029 50.428 12.9975 44.4652V29.2377C12.9975 28.5142 12.5931 27.2511 14.7611 27.2163C21.5941 27.1111 21.4642 26.6114 22.6392 28.3047C22.6392 28.3047 35.6804 43.6701 42.773 50.0816C48.9695 55.6847 56.6231 59.5833 61.5647 59.8173C68.2316 60.127 71.8248 59.0499 71.8248 58.1833C71.8248 56.4522 66.0083 61.3226 50.1945 49.1476C40.6476 41.8 28.9017 28.0328 27.0806 25.7662C26.9327 25.5874 27.0955 25.4178 27.0806 25.3902ZM13.0065 4.9725C13.0065 2.15713 14.6125 2.4586 17.053 2.4586C23.6976 2.4586 30.3901 5.64185 30.3901 14.4466C30.3901 23.3965 23.3027 24.7638 20.3886 24.7638C17.2031 24.7638 12.999 25.1246 12.999 23.7542L13.0065 4.9725Z"
            transform="translate(126.885 5.12891)"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M26.9923 25.299C31.8361 23.2786 36.9044 18.5717 36.9044 12.943C36.9044 -0.986623 20.1051 0.0158716 18.995 0.0158716C15.3965 0.0158716 11.3127 0.659675 7.29704 0.659675C3.76668 0.659675 2.63105 0.289744 1.38472 0.289744C0.55455 0.289744 -0.005284 0.723034 3.76129e-05 1.15632C0.0106808 3.17562 7.55993 -0.0474873 7.43753 7.65976V44.3954C7.46095 50.0517 3.34414 49.8636 1.90731 49.8636C0.227803 49.8636 2.65978 51.465 3.07487 51.465C5.70481 51.465 7.77173 50.8048 10.4027 50.8048C16.148 50.8048 20.0168 51.3842 20.6309 51.4844C22.2327 51.744 22.5275 50.5882 20.9896 50.2417C18.5065 49.6766 12.9507 49.7379 12.9188 43.7536L12.906 29.2394C12.906 28.517 12.4909 27.2191 14.7058 27.2191C22.4583 27.2191 21.8644 26.8461 24.356 30.8888L32.9462 43.6361C35.5782 47.7503 38.2763 51.4302 43.3297 51.4302C43.9534 51.4302 48.7109 51.5222 48.6673 50.6556C48.6226 49.7788 49.5507 49.2995 47.5231 49.6122C45.8649 49.8708 42.6954 48.7252 39.4545 43.5646L26.9604 25.7394C26.7635 25.6127 26.9923 25.299 26.9923 25.299ZM13.0493 5.06719C13.0493 2.25387 14.5053 2.50526 16.9958 2.39694C24.2322 2.08526 30.7671 5.39216 30.7671 14.1959C30.7671 23.1448 24.2024 24.7379 21.2265 24.7379C17.9707 24.7379 13.0568 25.1692 13.0568 23.7978L13.0493 5.06719Z"
            transform="translate(83.1821 5.12695)"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M38.1102 42.0148C38.8031 44.0157 39.3949 46.3293 40.0292 47.8387C41.4022 51.1057 37.874 52.2963 36.502 52.1695C35.3909 52.0694 35.6506 53.9885 37.6249 53.6462C39.4672 53.3253 41.8151 53.1117 43.6905 53.1117C46.5333 53.1117 48.928 53.6462 51.7729 53.6462C52.2561 53.6462 53.6877 52.4833 52.4477 52.1695C51.5686 51.9488 48.9195 51.9805 47.3166 49.2581C45.7755 46.6349 44.6973 43.656 43.6564 40.9142L28.7484 2.74076C28.5409 2.14806 28.0556 0 27.2924 0C26.392 0 26.1845 1.18542 22.0932 10.5216L5.51958 48.3118C3.71449 52.5364 0 51.1538 0 52.7101C0 53.1557 0.664138 53.6462 1.08348 53.6462C2.88432 53.6462 4.95655 53.1761 6.82763 53.1761C8.77003 53.1761 10.7135 53.2477 13.2668 53.6523C14.9984 53.9252 15.4008 52.5078 13.8884 52.1695C11.9279 51.7311 8.98608 50.8748 9.40117 47.6445C9.96632 43.2595 13.9852 35.5788 13.9852 35.5788C14.6802 34.0245 16.3012 33.5084 17.6167 33.5084H32.8748C34.8151 33.5084 35.1972 34.232 35.8922 35.9375L38.1102 42.0148ZM25.0076 10.5203C25.4227 9.63125 25.7697 9.63125 26.1166 10.5203L33.3317 29.3878C33.6787 30.3535 33.7489 30.8717 32.2216 30.8717H17.7127C16.8123 30.8717 16.3249 30.5753 16.8123 29.5391L25.0076 10.5203Z"
            transform="translate(35.3301 2.94531)"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M6.22376 42.8518C6.22376 48.4753 3.71728 49.1426 2.91052 49.3624C1.59396 49.7936 0.166698 49.4267 0.294417 50.6776C0.363598 51.3234 2.12292 51.2151 2.48799 51.2151C5.85764 51.2151 7.97458 51.0557 11.3421 51.0557C13.8305 51.0557 20.0142 51.6841 22.6473 51.6841C36.921 51.6841 39.9501 41.3271 39.9681 35.9273C40.0001 25.6653 28.466 24.1488 28.466 23.0676C28.466 22.5638 35.6544 19.82 35.6544 12.4642C35.6544 7.12578 32.1337 0.157374 19.2511 0.157374C13.3962 0.157374 12.2116 0.690811 9.28263 0.690811C6.35574 0.690811 2.25171 0 0.788263 0C-0.0908687 0 -0.518727 0.940158 1.04902 1.56965C2.43584 2.12455 6.22376 1.88645 6.22376 7.36797V42.8518ZM11.4844 26.0786C11.4844 25.4286 11.1183 24.418 16.7549 24.418C33.5893 24.418 33.882 33.979 33.882 38.5929C33.882 42.9186 32.4186 49.5713 21.1783 49.6959C10.7862 49.8114 11.4844 47.7512 11.4844 42.5579V26.0786ZM11.4877 7.945C11.4877 3.7613 11.1237 2.62595 15.7333 2.53398C24.5491 2.35923 30.7754 7.08455 30.5955 14.8705C30.4955 19.1012 27.5888 22.776 17.9471 22.6288C11.3621 22.5266 11.4877 22.1526 11.4877 19.8421V7.945Z"
            transform="translate(0 5.41797)"
          />
        </svg>
        <p class="sign-in-title">Welcome back.</p>
        <p class="sign-in-desc">
          You're already a subscriber. <span
            ><a href={loginUrl}>Please sign in.</a></span
          >
        </p>

        <a class="btn-link" href={loginUrl}>Sign in</a>
      </div>
    {:else if (!isLoggedIn && !isSubscriber) || (isLoggedIn && !isSubscriber)}
      <iframe
        title="barron's"
        id="offer_d85cb4e75bb61384edbd-0"
        name="offer_d85cb4e75bb61384edbd-0"
        scrolling="no"
        allowtransparency="true"
        allow="payment"
        allowfullscreen="true"
        frameborder="0"
        style="overflow: hidden; background-color: transparent; border: 0px; width: 572px; height: 616px;"
        src={fullIframeSrc}
      ></iframe>
    {/if}
  </div>
{/if}

<style>
  .sign-in-message {
    position: relative;
    clear: left;
    padding: 48px 24px;
    gap: 40px;
    max-width: 620px;
    width: 93vw;
    height: 288px;
    margin-left: auto;
    margin-right: auto;
  }

  .sign-in-message .sign-in-title {
    font-family: 'Aileron', arial, sans-serif;
    line-height: 40px;
    text-align: center;
    font-style: normal;
    font-weight: 700;
    font-size: 20px;
    line-height: 120%;
    margin-top: 24px;
    margin-bottom: 7px;
  }

  .sign-in-message .sign-in-desc {
    font-family: Georgia, serif;
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 24px;
    text-align: center;
    margin-bottom: 5px;
  }

  .sign-in-message .btn-link {
    display: block;
    -webkit-flex: 1;
    -ms-flex: 1;
    flex: 1;
    font-family: 'Aileron', arial, sans-serif;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-align: center;
    padding: 0;
    cursor: pointer;
    line-height: 45px;
    height: 45px;
    border-radius: 2px;
    -webkit-text-decoration: none;
    text-decoration: none;
    color: white;
    background-color: #0274b6;
    margin: auto;
    height: 48px;
    margin-top: 30px;
    margin-bottom: 30px;
    width: 85px;
  }

  .sign-in-message svg {
    width: 180px;
    height: 36px;
    display: block;
    margin-left: auto;
    margin-right: auto;
  }

  @media only screen and (max-width: 480px) {
    iframe {
      width: 100% !important;
      height: auto;
    }
  }
</style>
