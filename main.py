#!/usr/bin/env python3


# import feedparser, requests, json, warnings
import requests, json
from db import news_exists, insert_news, fetch_news, remove_news
# from bs4 import BeautifulSoup, MarkupResemblesLocatorWarning
from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
# from typing import Optional
from datetime import datetime
from hashlib import md5


# warnings.filterwarnings('ignore', category=MarkupResemblesLocatorWarning)

async def on_fetch(request, env):
    import asgi

    return await asgi.fetch(api, request, env)

class News(BaseModel):
    content: str
    '''
    title: str
    desc: Optional[str]
    link: str
    date_added: str
    image: str
    '''


def parse_feed(feed_url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    }
    # feed = atoma.parse_rss_bytes(requests.get(feed_url, headers=headers).content.replace(b'="0.92"', b'="2.0"'))
    '''
    feed = feedparser.parse(requests.get(feed_url, headers=headers).content.replace(b'="0.92"', b'="2.0"').decode())
    for item in feed['entries']:
        if 'summary' in item:
            desc = BeautifulSoup(str(item['summary']), 'lxml').get_text()
        else:
            desc = ''
        img = ''
        for link in item['links']:
            if link['type'] in ('image/jpeg', 'image/png'):
                img = link['href']
        insert_news(item['title'], desc, item['link'], datetime.now().date().isoformat(), img)
    '''
    resp = requests.get(feed_url, headers=headers)
    feed = resp.content
    insert_news(feed.decode().strip(), md5(feed).hexdigest(), datetime.now().date().isoformat())


def add_or_update_news():
    sources = json.load(open('sources.json'))
    for source in sources['rss']:
        if source: parse_feed(source)


api = FastAPI(docs_url=None)


'''
@api.get("/")
def redirect2docs(resp: Response):
    resp.headers['Server'] = " X"
    return RedirectResponse("/docs")
'''


origins = [
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:44444",
    "http://127.0.0.1:44444"
]

api.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@api.get("/news")
def return_news(resp: Response):
    resp.headers['Access-Control-Allow-Origin'] = "*"
    '''
    if id:
        news = fetch_news(id)
        if 'err' in news:
            raise HTTPException(
                status_code=404,
                detail=news[1]
            )
        else:
            return {'news': news}
    '''
    if not len(fetch_news()):
        add_or_update_news()
    return {'news': fetch_news()}


@api.put("/news")
def insert_single_news(resp: Response, news: News):
    resp.headers['Access-Control-Allow-Origin'] = "*"
    insert_news(news.content, md5(news.content.encode()).hexdigest(), datetime.now().date().isoformat())
    return {"msg": "News got added."}


@api.patch('/news')
def update_news(resp: Response):
    resp.headers['Access-Control-Allow-Origin'] = "*"
    add_or_update_news()
    return {'msg': "News Updated."}


@api.delete("/news")
def delete_news(resp: Response, content: str):
    resp.headers['Access-Control-Allow-Origin'] = "*"
    feed_digest = md5(content.encode()).hexdigest()
    if news_exists('feed_digest',  feed_digest):
        if remove_news('feed_digest', feed_digest):
            return {'msg': "Done!"}
        else:
            raise HTTPException(
                detail="Unknown internal server error, contact person operating the server for logs.",
                status_code=500
            )
    else:
        raise HTTPException(
            detail="Specified content doesn't exist on the server.",
            status_code=404
        )


'''
@api.patch("/news/{id}")
def update_single_news(resp: Response, id: int, news: News):
    resp.headers['Access-Control-Allow-Origin'] = "*"
    if news_exists('id', id):
        if remove_news('id', id):
            insert_news(news.content, md5(news.content.encode()).hexdigest(), datetime.now().date().isoformat())
            return {'msg': "Done!"}
        else:
            raise HTTPException(
                detail="Unknown internal server error, contact person operating the server for logs.",
                status_code=500
            )
    else:
        raise HTTPException(
            detail=f"Specified ID doesn't exist.",
            status_code=404
        )
'''

@api.get('/docs')
def docs_redirection():
    return RedirectResponse('/redoc')


# api.mount("/", StaticFiles(directory="ui", html=True), name="root")


api.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


if __name__ == "__main__":
    # main()
    import uvicorn
    uvicorn.run('main:api', host='0.0.0.0', port=44444, reload=False, headers=[("server", "Nick's Server")])
