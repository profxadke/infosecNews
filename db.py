from sqlite3 import connect as sqlite
from os import path


DB_NAME = 'news.db'


def init_db():
    cx = sqlite(DB_NAME)
    cu = cx.cursor()
    cu.execute("CREATE TABLE News( id INTEGER PRIMARY KEY, feed TEXT NOT NULL, feed_digest TEXT, date_added TIMESTAMP NOT NULL )")
    cx.close()


if not path.isfile(DB_NAME):
    init_db()


database = sqlite(DB_NAME, check_same_thread=False)
db_cursor = database.cursor()


def news_exists(key, value):
    return bool(
        db_cursor.execute(f'SELECT exists(SELECT 1 FROM News WHERE {key} = "{value}") AS row_exists;').fetchone()[0]
    )


def insert_news(feed, feed_digest, date_added):
    if not news_exists('feed_digest', feed_digest):
        e = db_cursor.execute('INSERT INTO News (feed, feed_digest, date_added) VALUES ( ?, ?, ? )', (feed, feed_digest, date_added))
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
            'feed': news[1],
            'feed_digest': news[2],
            'date_added': news[3]
        }]
    else:
        news = []
        for row in db_cursor.execute("SELECT * FROM News"):
            news.append({
                'id': row[0],
                'feed': row[1],
                'feed_digest': row[2],
                'date_added': row[3]
            })
    return news


def remove_news(key, value):
    return db_cursor.execute(f"DELETE FROM News WHERE {key} = ( ? )", (value,))
