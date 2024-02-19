import { elementReady } from './util';
import PronounsDomElement from './pronouns-dom-element';
import { FULLSCREEN_THEATER_STREAMER_SELECTOR, STREAMER_TITLE_CONTAINER_SELECTOR, STREAMER_TITLE_SELECTOR } from './config';
import Pronouns from './pronouns';

async function main() {
  const rootElement = await elementReady('#root');
  await Pronouns.initialize();

  let currentPath = document.location.pathname;
  let name = currentPath.slice(1);
  let pronouns = await Pronouns.get(name);

  const observer = new MutationObserver((mutationRecords) => Promise.all(
    mutationRecords
      .map((node) => node.addedNodes[0])
      .filter((addedNode) => addedNode?.nodeName === 'DIV')
      .map(async (addedNode) => {
        const { pathname } = document.location;
        if (pathname !== currentPath) {
          currentPath = pathname;
          name = pathname.slice(1);
          pronouns = await Pronouns.get(name);

          PronounsDomElement.update(pronouns);
        }

        // Inject streamer pronouns into player info in theater and fullscreen mode
        if (addedNode?.querySelector(FULLSCREEN_THEATER_STREAMER_SELECTOR)) {
          PronounsDomElement.inject(FULLSCREEN_THEATER_STREAMER_SELECTOR, pronouns);
        }

        // Inject streamer pronouns when channel is loaded for the first time
        if (addedNode?.querySelector(STREAMER_TITLE_SELECTOR)) {
          PronounsDomElement.inject(STREAMER_TITLE_CONTAINER_SELECTOR, pronouns);
        }
      }),
  ));
  observer.observe(rootElement, { childList: true, subtree: true });
}

main();
