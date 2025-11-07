# 📋 FILE STANDARDIZATION PLAN

## Current Naming Issues Found:

### 1. Entity Files - Inconsistent Underscore Usage:
- ✅ `climblog.py` (no underscore)
- ❌ `crag_model.py` (has underscore) → Should be `cragmodel.py`
- ✅ `crag.py` (no underscore)
- ❌ `model_route_data.py` (has underscores) → Should be `modelroutedata.py`
- ❌ `post_comment.py` (has underscore) → Should be `postcomment.py`
- ❌ `post_likes.py` (has underscore) → Should be `postlikes.py`
- ✅ `post.py` (no underscore)
- ✅ `route.py` (no underscore)
- ✅ `user.py` (no underscore)

### 2. URL Files - Inconsistent Naming:
- ✅ `auth_url.py` (standard pattern)
- ❌ `climb_log_url.py` → Should be `climblog_url.py`
- ✅ `crag_url.py` (standard pattern)
- ✅ `cragmodel_url.py` (standard pattern)
- ✅ `post_comment_url.py` (standard pattern)
- ✅ `post_url.py` (standard pattern)
- ❌ **MISSING** `post_likes_url.py` (should exist)
- ✅ `route_url.py` (standard pattern)
- ✅ `user_url.py` (standard pattern)

### 3. Controller/Boundary Files - Mostly Consistent:
- All follow `<name>_controller.py` and `<name>_boundary.py` pattern ✅

## Standardization Rules:
1. **Entity files:** Use single words without underscores (e.g., `postlikes.py`)
2. **URL files:** Use `<name>_url.py` pattern consistently
3. **Controller/Boundary:** Keep current `<name>_controller.py` pattern ✅
4. **Compound words:** Join without underscores (e.g., `postlikes`, `climblog`)

## Files to Rename:
1. `Entity/crag_model.py` → `Entity/cragmodel.py`
2. `Entity/model_route_data.py` → `Entity/modelroutedata.py`
3. `Entity/post_comment.py` → `Entity/postcomment.py`
4. `Entity/post_likes.py` → `Entity/postlikes.py`
5. `Url/climb_log_url.py` → `Url/climblog_url.py`

## Files to Create:
1. `Url/post_likes_url.py` (missing URL file)

## Import Updates Needed:
After renaming, all import statements across the codebase will need updates.