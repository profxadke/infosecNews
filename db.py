from sqlite3 import connect as sqlite
from os import path
import threading


DB_NAME = 'news.db'
db_lock = threading.RLock()


def init_db():
    cx = sqlite(DB_NAME)
    cu = cx.cursor()
    cu.execute("CREATE TABLE News( id INTEGER PRIMARY KEY, title TEXT NOT NULL, desc TEXT, link TEXT NOT NULL, date_added TIMESTAMP NOT NULL, image TEXT )")
    cx.close()


if not path.isfile(DB_NAME):
    init_db()


database = sqlite(DB_NAME, check_same_thread=False)
db_cursor = database.cursor()


def news_exists(key, value):
    with db_lock:
        if key not in ('id', 'link', 'title'):
            return False
        row = db_cursor.execute(f'SELECT exists(SELECT 1 FROM News WHERE {key} = ?) AS row_exists;', (value,)).fetchone()
        return bool(row[0]) if row else False


def insert_news(title, desc, link, date_added, img):
    with db_lock:
        if not news_exists('link', link):
            if desc:
                e = db_cursor.execute('INSERT INTO News (title, desc, link, date_added, image) VALUES ( ?, ?, ?, ?, ? )', (title, desc, link, date_added, img))
            else:
                e = db_cursor.execute('INSERT INTO News (title, link, date_added, image) VALUES ( ?, ?, ?, ? )', (title, link, date_added, img))
            database.commit()
            return e
        return True


def fetch_news(id=0) -> list:
    with db_lock:
        if id:
            if not news_exists('id', id):
                return ['err', "Specified ID doesn't exist."]
            news = db_cursor.execute("SELECT * FROM News WHERE id=?", (id,)).fetchone()
            if not news:
                return ['err', "Specified ID doesn't exist."]
            return [{
                'id': news[0],
                'title': news[1],
                'desc': news[2],
                'link': news[3],
                'date_added': news[4],
                'image': news[5]
            }]
        else:
            news = []
            rows = db_cursor.execute("SELECT * FROM News").fetchall()
            for row in rows:
                news.append({
                    'id': row[0],
                    'title': row[1],
                    'desc': row[2],
                    'link': row[3],
                    'date_added': row[4],
                    'image': row[5]
                })
            return news


def remove_news(key, value):
    with db_lock:
        if key not in ('id', 'link'):
            return False
        res = db_cursor.execute(f"DELETE FROM News WHERE {key} = ( ? )", (value,))
        database.commit()
        return res

