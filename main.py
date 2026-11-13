#!/usr/bin/env python3


import feedparser, requests, json, warnings, threading
from urllib.parse import urlparse
from db import news_exists, insert_news, fetch_news, remove_news
from bs4 import BeautifulSoup, MarkupResemblesLocatorWarning
from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


warnings.filterwarnings('ignore', category=MarkupResemblesLocatorWarning)


class News(BaseModel):
    title: str
    desc: Optional[str]
    link: str
    date_added: str
    image: str


def extract_source_name(url: str) -> str:
    try:
        domain = urlparse(url).netloc.lower()
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain or url
    except Exception:
        return url


def parse_feed(feed_url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    }
    new_count = 0
    try:
        req = requests.get(feed_url, headers=headers, timeout=8)
        if req.status_code != 200:
            return 0
        raw_text = req.content.replace(b'="0.92"', b'="2.0"').decode('utf-8', errors='replace')
        feed = feedparser.parse(raw_text)
        for item in feed.get('entries', []):
            title = item.get('title', 'No Title')
            link = item.get('link', '')
            if not link:
                continue

            if 'summary' in item:
                try:
                    desc = BeautifulSoup(str(item['summary']), 'lxml').get_text()
                except Exception:
                    desc = str(item.get('summary', ''))
            else:
                desc = ''

            img = ''
            for l in item.get('links', []):
                if l.get('type') in ('image/jpeg', 'image/png'):
                    img = l.get('href', '')

            if not news_exists('link', link):
                insert_news(title, desc, link, datetime.now().date().isoformat(), img)
                new_count += 1
    except Exception as e:
        print(f"Error parsing feed {feed_url}: {e}")
    return new_count


class SyncManager:
    def __init__(self):
        self.lock = threading.RLock()
        self.is_syncing = False
        self.status = "idle"  # "idle", "syncing", "completed", "error"
        self.started_at = None
        self.completed_at = None
        self.last_synced = None
        self.total_sources = 0
        self.completed_sources = 0
        self.current_source_index = 0
        self.current_source_url = ""
        self.current_source_name = ""
        self.new_items_count = 0
        self.total_items_processed = 0
        self.error_message = None
        self._thread = None

    def get_status(self):
        with self.lock:
            return {
                "is_syncing": self.is_syncing,
                "status": self.status,
                "started_at": self.started_at,
                "completed_at": self.completed_at,
                "last_synced": self.last_synced,
                "total_sources": self.total_sources,
                "completed_sources": self.completed_sources,
                "error": self.error_message
            }

    def get_progress(self):
        with self.lock:
            elapsed = 0.0
            if self.started_at:
                try:
                    start_dt = datetime.fromisoformat(self.started_at)
                    now_dt = datetime.fromisoformat(self.completed_at) if (not self.is_syncing and self.completed_at) else datetime.now()
                    elapsed = round((now_dt - start_dt).total_seconds(), 1)
                except Exception:
                    pass

            percent = 0.0
            if self.total_sources > 0:
                percent = round((self.completed_sources / self.total_sources) * 100, 1)
            elif self.status == "completed":
                percent = 100.0

            return {
                "is_syncing": self.is_syncing,
                "status": self.status,
                "current": self.completed_sources,
                "total": self.total_sources,
                "percent": percent,
                "current_source": self.current_source_url,
                "current_source_name": self.current_source_name,
                "new_items_count": self.new_items_count,
                "total_items_processed": self.total_items_processed,
                "started_at": self.started_at,
                "elapsed_seconds": elapsed,
                "last_synced": self.last_synced
            }

    def start_sync(self):
        with self.lock:
            if self.is_syncing:
                return False

            self.is_syncing = True
            self.status = "syncing"
            self.started_at = datetime.now().isoformat()
            self.completed_at = None
            self.error_message = None
            self.new_items_count = 0
            self.total_items_processed = 0
            self.completed_sources = 0
            self.current_source_index = 0
            self.current_source_url = ""
            self.current_source_name = ""

            try:
                sources = json.load(open('sources.json'))
                feed_sources = [s for s in sources.get('rss', []) if s and s.strip()] + [s for s in sources.get('atom', []) if s and s.strip()]
                self.total_sources = len(feed_sources)
            except Exception:
                self.total_sources = 0

            self._thread = threading.Thread(target=self._run_sync, daemon=True)
            self._thread.start()
            return True

    def _run_sync(self):
        try:
            try:
                sources = json.load(open('sources.json'))
                feed_sources = [s for s in sources.get('rss', []) if s and s.strip()] + [s for s in sources.get('atom', []) if s and s.strip()]
            except Exception as e:
                with self.lock:
                    self.is_syncing = False
                    self.status = "error"
                    self.error_message = str(e)
                return

            with self.lock:
                self.total_sources = len(feed_sources)

            total_added = 0
            for idx, source in enumerate(feed_sources):
                with self.lock:
                    self.current_source_index = idx + 1
                    self.current_source_url = source
                    self.current_source_name = extract_source_name(source)

                try:
                    added = parse_feed(source)
                    total_added += added
                except Exception as e:
                    print(f"Failed parsing {source}: {e}")

                with self.lock:
                    self.completed_sources = idx + 1
                    self.new_items_count = total_added

            with self.lock:
                self.is_syncing = False
                self.status = "completed"
                self.completed_at = datetime.now().isoformat()
                self.last_synced = self.completed_at
                self.current_source_url = ""
                self.current_source_name = ""
        except Exception as e:
            with self.lock:
                self.is_syncing = False
                self.status = "error"
                self.error_message = str(e)


sync_manager = SyncManager()


def add_or_update_news():
    sync_manager.start_sync()


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


@api.get("/sync/status")
@api.get("/news/sync/status")
def get_sync_status(resp: Response):
    resp.headers['Access-Control-Allow-Origin'] = "*"
    return sync_manager.get_status()


@api.get("/sync/progress")
@api.get("/news/sync/progress")
def get_sync_progress(resp: Response):
    resp.headers['Access-Control-Allow-Origin'] = "*"
    return sync_manager.get_progress()


@api.get("/news")
def return_news(resp: Response, id: int = 0):
    resp.headers['Access-Control-Allow-Origin'] = "*"
    if id:
        news = fetch_news(id)
        if 'err' in news:
            raise HTTPException(
                status_code=404,
                detail=news[1]
            )
        else:
            return {'news': news}
    current_items = fetch_news()
    if not len(current_items):
        sync_manager.start_sync()
        if sync_manager._thread:
            sync_manager._thread.join(timeout=10)
        current_items = fetch_news()
    return {'news': current_items}


@api.put("/news")
def insert_single_news(resp: Response, news: News):
    resp.headers['Access-Control-Allow-Origin'] = "*"
    insert_news(news.title, news.desc, news.link, datetime.now().date().isoformat(), news.image)
    return {"msg": "News got added."}


@api.patch('/news')
@api.post('/sync')
@api.post('/news/sync')
def update_news(resp: Response):
    resp.headers['Access-Control-Allow-Origin'] = "*"
    started = sync_manager.start_sync()
    if started:
        return {'msg': "Feed synchronization started.", 'status': 'started', 'is_syncing': True}
    else:
        return {'msg': "Feed synchronization already in progress.", 'status': 'already_syncing', 'is_syncing': True}


@api.delete("/news")
def delete_news(resp: Response, id: int):
    resp.headers['Access-Control-Allow-Origin'] = "*"
    if news_exists('id',  id):
        if remove_news('id', id):
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


@api.patch("/news/{id}")
def update_single_news(resp: Response, id: int, news: News):
    resp.headers['Access-Control-Allow-Origin'] = "*"
    if news_exists('id', id):
        if remove_news('id', id):
            insert_news(news.title, news.desc, news.link, datetime.now().date().isoformat(), news.image)
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


@api.get('/docs')
def docs_redirection():
    return RedirectResponse('/redoc')


api.mount("/", StaticFiles(directory="ui", html=True), name="root")

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
