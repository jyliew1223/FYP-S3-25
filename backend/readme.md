# GoClimb Backend Server

This is the backend server for the **GoClimb** project, built with Django.  
This document will guide you through the setup, environment configuration, and running the project locally and on Render.

---

## Environment Variables

Create a `.env` file in the **root** of the project (same location as `manage.py`).

> **IMPORTANT: Do NOT commit `.env` and `{firebase_credentials}.json` to the repository — it contains sensitive credentials.**

Below are the required variables:

### 1. Django Secret Key

Generate a Django secret key by running:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Add the key to `.env` file:

```ini
SECRET_KEY = {generated SECRET_KEY}
```

### 2. Debug Mode

Set debug mode (for development)

Add the this to `.env` file:

```ini
DEBUG=True
```

### 3. Allowed host

Hosts allowed to access the server.

Can modify as u need, \* will allow request from every host

Add the this to `.env` file:

```ini
ALLOWED_HOSTS=*
```

Or specify hosts explicitly:

```ini
ALLOWED_HOSTS=your-render-service-url.onrender.com,localhost,127.0.0.1
```

### 4. Firebase credentials path

Path to Firebase Admin SDK JSON credentials file.

To obtain the JSON file:

1. go to https://console.firebase.google.com/u/3/
2. Login using shared goclimb gmail account
3. Select "GoClimb" project which will appear in "Your Project" section
4. At the left panel, clicks the icon beside "Project Overview" > "Project Settings"
5. Go to "Service accounts" tab
6. Generate a new Private key and download JSON

After that, add this to .env file:

```ini
FIREBASE_CREDENTIALS_PATH=/path/to/the/file.json
```

### 5. Render Database

Your PostgreSQL connection string form Render.

To get the URL:

1. Go to https://dashboard.render.com/ and login using shared gmail
2. Navigate to Projects > GoClimb-Database.
3. Under Info tab, click Connect > External tab.
4. Copy the "External Database URL"

After that, add this to .env file:

```ini
DATABASE_URL= {paste the url here}
```

### 6. Time zone

Set the project time zone:

Add the this to `.env` file:

```ini
TIME_ZONE=Asia/Singapore
```

> **Important: Never commit `.env` or Firebase JSON files to github repository.**

## Git Ignore

This project includes multiple .gitignore file to prevent unnecessary or sensitive files from being committed to the repository.

**Key items excluded:**

- OS and editor files (e.g., .DS_Store, .vscode/, .idea/)
- Python cache files (**pycache**/, _.pyc, _.pyo)
- Django migrations cache and database files
- Environment files (.env)
- Firebase credentials JSON
- Virtual environments (venv/)
- Compiled or temporary files (_.log, _.tmp, \*.bak)
- Static/media uploads if not part of source control

> **Important: Always double-check the changes before committing to ensure secrets and large unnecessary files are not tracked.**

**If you accidentally commit a sensitive file (like `.env`), remove it from Git history immediately.**

The `.gitignore` file which already committed to this repository should be good enough for most use cases.  
However:

- If you added file, data, or library which not related to the project or contains sensitive values, update `.gitignore` to exclude it.
- If you find something sensitive or unrelated to the project being tracked, update `.gitignore` to exclude it.
- If you are unsure what to exclude or how to configure `.gitignore`, you can:
  - Refer to the `.gitignore` file already committed to this project.
  - Ask ChatGPT to generate one by providing project details.

## Django Related

install Django:

```bash
pip install django
```

run server locally:

```bash
python backend\GoClimb\manage.py runserver
```

Create new project:

```bash
django-admin startproject GoClimb
```

Create new app in GoClimb:

```bash
python manage.py startapp new app
```

**Remember to add newly created app into GoClimb/setting.py if created a new app**

```python
        INSTALLED_APPS = [
            "django.contrib.admin",
            "django.contrib.auth",
            "django.contrib.contenttypes",
            "django.contrib.sessions",
            "django.contrib.messages",
            "django.contrib.staticfiles",

            # Your App
            "new_app",
        ]
```

## Deployment on Render

Install Gunicorn (production WSGI server):

```bash
pip install gunicorn
```

Use Gunicorn to run your app on Render:

```bash
gunicorn GoClimb.wsgi:application
```

**Make sure all sensitive configs are set via Render environment variables.**

## Notes

- Always use environment variables for secrets and config.
- Keep local and production secrets separate.
- Update ALLOWED_HOSTS before deploying to production.
