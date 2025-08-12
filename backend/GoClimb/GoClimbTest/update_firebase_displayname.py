import firebase_admin
from firebase_admin import credentials, auth
import os

if os.getenv("RENDER") != "true":  # or any env var that identifies prod
    try:
        from dotenv import load_dotenv
    except ImportError:
        pass  # dotenv not installed, just skip loading .env
    else:
        load_dotenv()
        
# Path to your service account JSON file
path = os.getenv("FIREBASE_CREDENTIALS_PATH")
cred = credentials.Certificate(path)
firebase_admin.initialize_app(cred)

def update_user_display_name(uid: str, new_display_name: str):
    try:
        user = auth.update_user(
            uid,
            display_name=new_display_name
        )
        print(f'Successfully updated user: {user.uid}, displayName: {user.display_name}')
        return True
    except Exception as e:
        print(f'Error updating user: {e}')
        return False

if __name__ == '__main__':
    uid = 'KhlqGVT00idJPn8tT2PzH8C48eh2'
    new_name = 'GoClimbCoolUser001'
    update_user_display_name(uid, new_name)
