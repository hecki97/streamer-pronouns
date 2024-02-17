import { elementReady, get } from './util';
import PRONOUNS_FALLBACK_ARRAY from './pronouns-fallback';

const PRONOUNS_API = 'https://pronouns.alejo.io/api/';
const STREAMER_NAME_SELECTOR = '.channel-info-content a:not(.tw-halo)';
const FULLSCREEN_THEATER_STREAMER_SELECTOR = 'p[data-a-target="player-info-title"]';

const pronounIdMap = new Map();
let streamer = null;

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
    pronouns = PRONOUNS_FALLBACK_ARRAY;
  }
  pronouns.forEach(({ name, display }) => pronounIdMap.set(name, display));
}

async function main() {
  const rootElement = await elementReady('#root');
  await initializePronounsMap();

  // Don't fetch streamer object on homepage
  if (document.location.pathname !== '/') {
    streamer = await getStreamerObj();
  }

  const observer = new MutationObserver((mutationRecords) => Promise.all(
    mutationRecords.map(async (node) => {
      const [addedNode] = node.addedNodes;

      // Disable logic on homepage
      if (document.location.pathname === '/') {
        return;
      }

      if (document.location.pathname !== streamer?.url) {
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
