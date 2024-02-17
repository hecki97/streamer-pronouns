import { get } from './util';
import { PRONOUNS_API } from './config';
import PRONOUNS_FALLBACK_ARRAY from './pronouns-fallback';

export default class Pronouns {
  static #map = new Map();

  static async initialize() {
    let pronouns;
    try {
      pronouns = await get(`${PRONOUNS_API}pronouns`);
    } catch (error) {
      console.warn(`Pronoun map initialization failed due to: '${error.name}: ${error.message}'`);
      console.log('Falling back to hardcoded list');
      pronouns = PRONOUNS_FALLBACK_ARRAY;
    } finally {
      pronouns.forEach(({ name, display }) => Pronouns.#map.set(name, display));
    }
  }

  static async get(name) {
    // Don't fetch streamer object on homepage
    if (document.location.pathname === '/') {
      return null;
    }

    const [user] = await get(`${PRONOUNS_API}users/${name}`);
    return Pronouns.#map.get(user?.pronoun_id) ?? null;
  }
}
