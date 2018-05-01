(function () {
  const templates = {};

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(function(registration) {
        // Registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        registration.active.postMessage({what: 'fetchTemplates'});
      }).catch(function(err) {
        // registration failed :(
        console.log('ServiceWorker registration failed: ', err);
      });
      navigator.serviceWorker.addEventListener('message', event => {
        const what = event.data.what;
        switch (what) {
          case 'fetchFeed':
            const feed = event.data.result;
            updateFeed(feed);
            break;

          case 'fetchTemplates':
            Object.keys(event.data.result).forEach(key => {
              const dom = document.createElement('div');
              dom.innerHTML = event.data.result[key];
              templates[key] = dom.firstElementChild;
            })
            event.source.postMessage({what: 'fetchFeed'});
            break;
        }
      });
    });

    document.querySelector('#updateFeed').addEventListener('click', () => {
      const updateButtonDom = document.querySelector('#updateFeed');
      updateButtonDom.disabled = true;
      updateButtonDom.classList.add('is-loading');
      navigator.serviceWorker.controller.postMessage({what: 'fetchFeed'});
    });
  }

  function updateFeed(feed) {
    const updateButtonDom = document.querySelector('#updateFeed');
    const containerDom = document.querySelector('[data-container]').cloneNode();
    if (!feed || feed.isCache) {
      containerDom.appendChild(templates.offlineAlert.cloneNode(true));
    }
    if (feed) {
      feed.articles.forEach(article => {
        const articleDom = createArticleDom(article);
        containerDom.appendChild(articleDom);
      });
    }
    document.querySelector('[data-container]').replaceWith(containerDom);
    updateButtonDom.disabled = false;
    updateButtonDom.classList.remove('is-loading');
  }

  function createArticleDom(article) {
    const dom = templates.article.cloneNode(true);
    dom.querySelector('[data-datetime]').textContent = new Date(article.publishedAt).toLocaleString();
    dom.querySelector('[data-corp]').textContent = article.source.name;
    dom.querySelector('[data-author]').textContent = article.author;
    dom.querySelector('[data-subject]').textContent = article.title;
    dom.querySelector('[data-subject]').href = article.url;
    dom.querySelector('[data-content]').textContent = article.description;
    dom.querySelector('[data-thumbnail]').src = article.urlToImage || '/images/newspaper.png';
    return dom;
  }

  function createTemplateDom(id) {
    const dom = document.createElement('div');
    dom.innerHTML = document.querySelector(id).innerHTML;
    return dom.firstElementChild;
  }
})();