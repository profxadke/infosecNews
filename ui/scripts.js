  const shuffle = array => {
      let currentIndex = array.length;

      // While there remain elements to shuffle...
      while (currentIndex != 0) {

          // Pick a remaining element...
          let randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;

          // And swap it with the current element.
          [array[currentIndex], array[randomIndex]] = [
              array[randomIndex], array[currentIndex]
          ];
      }
  }; const placeholder_imgs = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', 'img_0', 'img_1', 'img_2', 'img_3'];

  function updateNews() {
    fetch('/news', {method: "PATCH"}).then(response => {
        response.json().then(resp => {
          console.log(resp);
        })
    })
  }


  // Function to render news items
  function renderNewsItems(newsItems) {
      shuffle(newsItems); shuffle(placeholder_imgs);
      const newsContainer = document.getElementById('news-container');
      newsContainer.innerHTML = '';
      newsItems.forEach(news => {
          const newsCard = document.createElement('div');
          let img_placeholder = placeholder_imgs[(Math.floor(Math.random() * placeholder_imgs.length))];
          let date = new Date(Date.parse(news.date_added));
          let desc = news.desc;
          if ( !desc ) { desc = ''; }
          let date_formatted = date.toLocaleDateString('en-NP', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
          });
          if ( desc.length >= 111 ) {
              desc = desc.slice(0, 108) + '...';
          }
          // TODO: Truncate description for each news.
          // TODO: Use DomPurify on news.image, news.title, news.description, news.link, news.date_added
          newsCard.className = 'col-md-4 mb-4 d-flex';
          newsCard.innerHTML = `
    <div class="card w-100 bg-dark bg-gradient text-light">
      ${news.image ? `<img src="${news.image}" class="card-img-top" alt="News Thumbnail">` : `<img src="img/${img_placeholder}.jpg" class="card-img-top" alt="News Thumbnail">`}
      <div class="card-body">
        <h5 class="card-title">${news.title}</h5>
        <hr />
        ${desc ? `<p class="card-text">${desc}</p>` : '<p class="card-text"><i>No description available for this specific news.</i></p>'}
        <br />
        <a href="${news.link}" target="_blank" data-mdb-ripple-init class="btn btn-primary card-link">Read more</a>
        <br />
      </div>
      <div class="card-footer text-white-50">
        Aggregated on: <i>${date_formatted}</i>
      </div>
    </div>
  `;
          newsContainer.appendChild(newsCard);
      });
  }

  const elem = document.querySelector('#news-container');
  elem.innerHTML = `
  <div class="spinner-container">
      <div class="material-spinner"></div>
    </div>
  `;

  fetch('/news').then(response => {
      response.json().then(resp => {
          // renderNewsItems(resp['news']);
          const parser = new DOMParser();
          let feeds = []
          resp['news'].forEach( data => {
            const xmlDoc = parser.parseFromString(data['feed'], "text/xml");
            // feeds.push(xmlDoc);
            const items = Array.from(xmlDoc.getElementsByTagName("item"));
            items.forEach( item => {
              const title = item.getElementsByTagName('title')[0].textContent;
              const link = item.getElementsByTagName('link')[0].textContent;
              if ( item.getElementsByTagName('description').length ) {
                desc = item.getElementsByTagName('description')[0].textContent;
              } else {
                desc = ''
              }; const pubDate = item.getElementsByTagName('pubDate')[0].textContent;
              // const author = item.getElementsByTagName('dc:creator')[0].textContent;
              feeds.push({
                title: title,
                link: link,
                desc: desc,
                date_added: pubDate
              })
          })
        }); renderNewsItems(feeds);
        // console.log(feeds);
        // TODO: Function to parse rss feeds.
        // const xmlDoc = parser.parseFromString(resp['feed'], "text/xml");
        // console.log(xmlDoc);
        // renderNewsItems(resp['news']);
    })
})
