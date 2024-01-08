const PRONOUNS_API = 'https://pronouns.alejo.io/api/';
const STREAMER_NAME_SELECTOR = '.channel-info-content a:not(.tw-halo)';
const FULLSCREEN_THEATER_STREAMER_SELECTOR = 'p[data-a-target="player-info-title"]';
const PRONOUNS_LIST_FALLBACK = [
  { name: 'aeaer', display: 'Ae/Aer' },
  { name: 'any', display: 'Any' },
  { name: 'eem', display: 'E/Em' },
  { name: 'faefaer', display: 'Fae/Faer' },
  { name: 'hehim', display: 'He/Him' },
  { name: 'heshe', display: 'He/She' },
  { name: 'hethem', display: 'He/They' },
  { name: 'itits', display: 'It/Its' },
  { name: 'other', display: 'Other' },
  { name: 'perper', display: 'Per/Per' },
  { name: 'sheher', display: 'She/Her' },
  { name: 'shethem', display: 'She/They' },
  { name: 'theythem', display: 'They/Them' },
  { name: 'vever', display: 'Ve/Ver' },
  { name: 'xexem', display: 'Xe/Xem' },
  { name: 'ziehir', display: 'Zie/Hir' },
];

const pronounIdMap = new Map();
let streamer = null;

/* #region Util Functions */

/**
 * Waits for an element satisfying selector to exist, then resolves promise with the element.
 *
 * Based on this gist by [jwilson8767](https://gist.github.com/jwilson8767): https://gist.github.com/jwilson8767/db379026efcbd932f64382db4b02853e
 *
 * @param {string} selector valid html selector
 * @returns {Promise<Element>} HTML element
 */
function elementReady(selector) {
  return new Promise((resolve) => {
    Array.from(document.querySelectorAll(selector)).forEach((element) => {
      resolve(element);
    });

    const mutObserver = new MutationObserver((_, observer) => {
      // Query for elements matching the specified selector
      Array.from(document.querySelectorAll(selector)).forEach((element) => {
        resolve(element);
        // Once we have resolved we don't need the observer anymore.
        observer.disconnect();
      });
    });

    mutObserver.observe(document.documentElement, { childList: true, subtree: true });
  });
}

async function get(url) {
  return (await fetch(url)).json();
}

/* #endregion */

async function fetchPronouns(name) {
  const [user] = await get(`${PRONOUNS_API}users/${name}`);
  return pronounIdMap.get(user?.pronoun_id) ?? null;
}

async function getStreamerObj() {
  const url = document.location.pathname;
  const name = url.slice(1);
  const pronouns = await fetchPronouns(name);

  return { url, name, pronouns };
}

function getPronounsElement(pronouns) {
  const pronounSpan = document.createElement('span');
  pronounSpan.id = 'streamer-pronouns';
  pronounSpan.classList.add('streamer-pronouns');
  pronounSpan.innerText = `(${pronouns})`;

  return pronounSpan;
}

// FIXME: Pronouns get not applied when clicking on joining stream from twitch home (sidebar or video player)
// FIXME: Loading channel with no pronouns and then going back to cached channel with pronouns breaks extension (no container is generated when loading first page)

async function initializePronounsMap() {
  let pronouns;
  try {
    pronouns = await get(`${PRONOUNS_API}pronouns`);
  } catch (error) {
    console.warn(`Pronoun map initialisation failed due to: '${error.name}: ${error.message}'`);
    console.log('Falling back to hardcoded list');
    pronouns = PRONOUNS_LIST_FALLBACK;
  }
  pronouns.forEach(({ name, display }) => pronounIdMap.set(name, display));
}

async function main() {
  const rootElement = await elementReady('#root');
  await initializePronounsMap();
  streamer = await getStreamerObj();

  const observer = new MutationObserver(async (mutationRecords) => Promise.all(
    mutationRecords.map(async (node) => {
      const [addedNode] = node.addedNodes;

      if (document.location.pathname !== streamer.url) {
        streamer = await getStreamerObj();
        // Url changed but streamer link immeditaley exists -> Page was cached
        const pronounContainer = document.querySelector('.streamer-pronouns');
        if (document.querySelector('h1.tw-title') && pronounContainer) {
          pronounContainer.innerText = streamer.pronouns ? `(${streamer.pronouns})` : '';
        }
      }

      // Inject streamer pronouns into player info in theater and fullscreen mode
      if (addedNode?.nodeName === 'DIV' && addedNode?.querySelector(FULLSCREEN_THEATER_STREAMER_SELECTOR)) {
        const container = document.querySelector(FULLSCREEN_THEATER_STREAMER_SELECTOR);
        if (streamer.pronouns) {
          container.appendChild(getPronounsElement(streamer.pronouns));
        }
      }

      // Inject streamer pronouns when channel is loaded for the first time
      if (addedNode?.nodeName === 'DIV' && addedNode?.querySelector('h1.tw-title')) {
        const container = document.querySelector(STREAMER_NAME_SELECTOR);
        if (streamer.pronouns) {
          container.after(getPronounsElement(streamer.pronouns));
        }
      }
    }),
  ));
  observer.observe(rootElement, { childList: true, subtree: true });
}

main();
