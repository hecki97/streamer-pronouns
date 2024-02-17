export default class PronounsDomElement {
  static #generate(pronouns) {
    const pronounSpan = document.createElement('span');
    pronounSpan.id = 'streamer-pronouns';
    pronounSpan.classList.add('streamer-pronouns');
    pronounSpan.innerText = pronouns ? `(${pronouns})` : '';

    return pronounSpan;
  }

  static update(pronouns) {
    const pronounContainer = document.querySelector('.streamer-pronouns');
    if (document.querySelector('h1.tw-title') && pronounContainer) {
      pronounContainer.innerText = pronouns ? `(${pronouns})` : '';
    }
  }

  static inject(selector, pronouns) {
    const container = document.querySelector(selector);
    container.after(PronounsDomElement.#generate(pronouns));
  }
}
