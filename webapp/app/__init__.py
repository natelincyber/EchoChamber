from flask import Flask, render_template


from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

def page_not_found(e):
    return render_template('404.html'), 404

def create_app():
    app.config['SECRET_KEY'] = str(os.environ.get('FLASK_SECRET_KEY'))
    app.register_error_handler(404, page_not_found)

    from .views import views
    app.register_blueprint(views, url_prefix="/")

    return app