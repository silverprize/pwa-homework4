self.addEventListener('install', event => {
  event.waitUntil(
    self.caches.open('assets').then(cache => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/bulma.css',
        '/style.css',
        '/js/script.js',
        '/images/loader.gif',
        '/images/newspaper.png',
        '/images/reload.png',
        '/template/article.html',
        '/template/offlineAlert.html',
        'https://newsapi.org/v2/top-headlines?apiKey=42b670ccfa79499c945d915b57e3947e&country=kr'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(findCacheOrFetch(event.request));
});

self.addEventListener('message', async event => {
  const what = event.data.what;
  switch (what) {
    case 'fetchFeed':
      const feed = await fetchFeed();
      event.source.postMessage({what, result: feed});
      break;
      
    case 'fetchTemplates':
      const article = await fetchTemplate('article');
      const offlineAlert = await fetchTemplate('offlineAlert');
      event.source.postMessage({what, result: {
        article,
        offlineAlert
      }});
      break;
  }
});

function findCacheOrFetch(request) {
  return self.caches.match(request).then(response => {
    if (response) {
      return response;
    }
    return fetch(request);
  });
}

function fetchFeed() {
  const request = 'https://newsapi.org/v2/top-headlines?apiKey=42b670ccfa79499c945d915b57e3947e&country=kr';
  return fetch(request)
  .then(response => response)
  .catch(async () => {
    const response = await self.caches.match(request).then(response => response);
    if (response) {
      response.isCache = true;
    }
    return response;
  }).then(async response => {
    if (response) {
      const feed = JSON.parse(await response.text());
      if (response.isCache) {
        feed.isCache = true;
      }
      return feed;
    }
    return null;
  });
}

function fetchTemplate(name) {
  return findCacheOrFetch(`/template/${name}.html`).then(async response => {
    return await response.text();
  });
}