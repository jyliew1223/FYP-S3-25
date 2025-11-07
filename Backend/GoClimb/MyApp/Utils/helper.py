from typing import Any, Dict
from rest_framework.request import Request

import firebase_admin
from firebase_admin import auth, credentials

def verify_id_token(id_token: str) -> Dict[str, Any]:

    if not id_token or not isinstance(id_token, str):
        return {
            "success": False,
            "message": "Invalid token format.",
            "errors": {"id_token": "Token must be a non-empty string."},
        }

    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token.get("uid")

        if not uid:
            return {
                "success": False,
                "message": "Token verified but UID not found.",
                "errors": {"uid": "Missing UID in decoded token."},
            }

        return {
            "success": True,
            "uid": uid,
            "message": "Token verified successfully.",
            "errors": {},
        }

    except auth.ExpiredIdTokenError:
        return {
            "success": False,
            "message": "Token has expired.",
            "errors": {"id_token": "Expired token."},
        }
    except auth.InvalidIdTokenError:
        return {
            "success": False,
            "message": "Invalid token.",
            "errors": {"id_token": "Token is not valid."},
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to verify token: {str(e)}",
            "errors": {},
        }

class PrefixedIDConverter:
    @staticmethod
    def to_raw_id(prefixed_id: str) -> int:
        if not prefixed_id:
            raise ValueError(f"prefixed_id is null")
        if "-" not in prefixed_id:
            try:
                id = int(prefixed_id)
                return id
            except:
                raise ValueError(f"not - found Invalid ID format: {prefixed_id}")
        parts = prefixed_id.split("-")
        if len(parts) != 2:
            raise ValueError(f"len of part !=2 Invalid ID format: {prefixed_id}")
        try:
            return int(parts[1])
        except ValueError:
            raise ValueError(f"Invalid numeric part in ID: {prefixed_id}")
