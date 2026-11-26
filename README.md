# Content planner

A Flask app for planning social media posts: add topics, see them on a calendar and grouped by day, and get reminders when a post is due.

Built November 2024 to January 2025.

- Calendar and day views of planned posts (`templates/calendar_view.html`, `topics_by_day.html`)
- Login, and a form to add or edit a plan
- `notification_system.py` checks the database for posts that are due
- SQLite through Flask-SQLAlchemy, with Alembic migrations in `migrations/`

## Run

```bash
pip install flask flask-sqlalchemy flask-migrate firebase-admin
flask db upgrade
python app.py
```

If you use the Firebase parts, put your own `serviceAccountKey.json` next to `app.py`; it is not in the repository.
