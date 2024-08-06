from sqlite3 import connect as sqlite
from os import path


DB_NAME = 'news.db'


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
    return bool(
        db_cursor.execute(f'SELECT exists(SELECT 1 FROM News WHERE {key} = "{value}") AS row_exists;').fetchone()[0]
    )


def insert_news(title, desc, link, date_added, img):
    if not news_exists('link', link):
        if desc:
            e = db_cursor.execute('INSERT INTO News (title, desc, link, date_added, image) VALUES ( ?, ?, ?, ?, ? )', (title, desc, link, date_added, img))
        else:
            e = db_cursor.execute('INSERT INTO News (title, link, date_added, image) VALUES ( ?, ?, ?, ? )', (title, link, date_added, img))
        database.commit()
        return e
    return True


def fetch_news(id=0) -> list:
    if id:
        if not news_exists('id', id):
            return ['err', "Specified ID doesn't exist."]
        news = db_cursor.execute(f"SELECT * FROM News WHERE id={id}").fetchone()
        news = [{
            'id': news[0],
            'title': news[1],
            'desc': news[2],
            'link': news[3],
            'date_added': news[4],
            'image': news[5]
        }]
    else:
        news = []
        for row in db_cursor.execute("SELECT * FROM News"):
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
    return db_cursor.execute(f"DELETE FROM News WHERE {key} = ( ? )", (value,))
