import logging
from typing import Dict, Any, List
from datetime import datetime, date, timedelta, timezone
from app.services import submissions_service, problem_service, auth_service, achievement_service, storage_service
from app.core.aws import dynamodb_resource
from app.core.config import settings

logger = logging.getLogger(__name__)

submissions_table = dynamodb_resource.Table(settings.DYNAMODB_SUBMISSIONS_TABLE)
users_table = dynamodb_resource.Table(settings.DYNAMODB_USERS_TABLE)

def parse_iso_date(date_str: str) -> str:
    """Trích xuất chuỗi YYYY-MM-DD từ ISO string"""
    if not date_str:
        return ""
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return date_str[:10] if len(date_str) >= 10 else ""

def calculate_streak(submission_dates_sorted: List[str]) -> Dict[str, int]:
    """
    Tính toán Chuỗi ngày liên tiếp (Current Streak) và Chuỗi dài nhất lịch sử (Best Streak).
    Dựa trên danh sách các ngày YYYY-MM-DD đã xếp tăng dần mà người dùng thực hiện submit.
    """
    if not submission_dates_sorted:
        return {"current_streak": 0, "best_streak": 0}

    unique_dates = sorted(list(set(submission_dates_sorted)))
    date_objs = []
    for d_str in unique_dates:
        try:
            date_objs.append(datetime.strptime(d_str, "%Y-%m-%d").date())
        except ValueError:
            continue

    if not date_objs:
        return {"current_streak": 0, "best_streak": 0}

    # Tính Best Streak
    best_streak = 1
    temp_streak = 1
    for i in range(1, len(date_objs)):
        if date_objs[i] == date_objs[i - 1] + timedelta(days=1):
            temp_streak += 1
            if temp_streak > best_streak:
                best_streak = temp_streak
        else:
            temp_streak = 1

    # Tính Current Streak
    today = datetime.now(timezone.utc).date()
    yesterday = today - timedelta(days=1)
    
    current_streak = 0
    last_date = date_objs[-1]
    
    # Người dùng active nếu đã submit hôm nay hoặc hôm qua
    if last_date == today or last_date == yesterday:
        current_streak = 1
        curr = last_date
        idx = len(date_objs) - 2
        while idx >= 0:
            if date_objs[idx] == curr - timedelta(days=1):
                current_streak += 1
                curr = date_objs[idx]
                idx -= 1
            else:
                break
    else:
        current_streak = 0

    return {
        "current_streak": current_streak,
        "best_streak": max(best_streak, current_streak)
    }

def calculate_user_rank(target_user_id: str) -> Dict[str, int]:
    """
    Tính Thứ hạng Rank của người dùng trong hệ thống dựa trên số bài toán giải thành công (Accepted).
    """
    all_users = auth_service.get_all_users()
    if not all_users:
        return {"rank": 1, "total_users": 1}

    # Quét tất cả submission thành công để đếm số bài solved của từng user
    user_solved_map: Dict[str, set] = {}
    try:
        response = submissions_table.scan(
            FilterExpression="#st = :accepted",
            ExpressionAttributeNames={"#st": "Status"},
            ExpressionAttributeValues={":accepted": "Accepted"}
        )
        for item in response.get("Items", []):
            uid = item.get("UserID")
            pid = item.get("ProblemID")
            if uid and pid:
                if uid not in user_solved_map:
                    user_solved_map[uid] = set()
                user_solved_map[uid].add(pid)
    except Exception as e:
        logger.error(f"Lỗi scan Submissions cho Rank: {e}")

    user_scores = []
    for u in all_users:
        uid = u.get("UserID")
        solved_cnt = len(user_solved_map.get(uid, set()))
        user_scores.append({"user_id": uid, "solved": solved_cnt})

    user_scores.sort(key=lambda x: x["solved"], reverse=True)

    rank = 1
    for idx, u in enumerate(user_scores, start=1):
        if u["user_id"] == target_user_id:
            rank = idx
            break

    return {
        "rank": rank,
        "total_users": len(all_users)
    }

def get_user_full_stats(user_id: str) -> Dict[str, Any]:
    """
    Lấy toàn bộ dữ liệu thống kê thực tế cho Profile của người dùng.
    """
    # 1. Lấy danh sách tất cả bài toán trong hệ thống
    all_problems = problem_service.get_all_problems()
    problem_dict = {p.get("ProblemID"): p for p in all_problems}
    
    total_easy = sum(1 for p in all_problems if p.get("Difficulty") == "Easy")
    total_medium = sum(1 for p in all_problems if p.get("Difficulty") == "Medium")
    total_hard = sum(1 for p in all_problems if p.get("Difficulty") == "Hard")
    total_problems_count = len(all_problems)

    # 2. Lấy tất cả submissions của người dùng
    submissions = submissions_service.get_user_submissions(user_id)
    total_submissions = len(submissions)

    solved_problem_ids = set()
    easy_solved = set()
    medium_solved = set()
    hard_solved = set()
    
    accepted_submissions_count = 0
    submission_dates = []
    languages_used = set()
    min_exec_time = 999.0

    recent_submissions_formatted = []

    for sub in submissions:
        pid = sub.get("ProblemID")
        status = sub.get("Status")
        lang = sub.get("Language", "")
        submitted_at = sub.get("SubmittedAt", "")
        exec_time = float(sub.get("ExecutionTime", 0.0))

        if lang:
            languages_used.add(lang.lower())

        if submitted_at:
            d_str = parse_iso_date(submitted_at)
            if d_str:
                submission_dates.append(d_str)

        prob_meta = problem_dict.get(pid, {})
        diff = prob_meta.get("Difficulty", "Easy")
        title = prob_meta.get("Title") or pid

        if status == "Accepted":
            accepted_submissions_count += 1
            solved_problem_ids.add(pid)
            if exec_time > 0 and exec_time < min_exec_time:
                min_exec_time = exec_time

            if diff == "Easy":
                easy_solved.add(pid)
            elif diff == "Medium":
                medium_solved.add(pid)
            elif diff == "Hard":
                hard_solved.add(pid)

            # Build formatted submission object for UI table (top 10 accepted submissions)
            if len(recent_submissions_formatted) < 10:
                recent_submissions_formatted.append({
                    "submission_id": sub.get("SubmissionID"),
                    "problem_id": pid,
                    "problem": title,
                    "difficulty": diff,
                    "status": status,
                    "language": lang,
                    "runtime": f"{int(exec_time * 1000)} ms" if exec_time < 1.0 else f"{exec_time:.2f} s",
                    "memory": f"{float(sub.get('MemoryUsed', 0.0)):.1f} MB",
                    "submitted_at": submitted_at
                })

    acceptance_rate = round((accepted_submissions_count / total_submissions * 100), 1) if total_submissions > 0 else 0.0

    # 3. Tính Chuỗi Streak
    streak_info = calculate_streak(submission_dates)

    # 4. Tính Rank
    rank_info = calculate_user_rank(user_id)

    # 5. Tính Skills & Languages
    lang_counts: Dict[str, int] = {}
    for sub in submissions:
        l = sub.get("Language", "python").title()
        lang_counts[l] = lang_counts.get(l, 0) + 1

    skills_list = []
    if total_submissions > 0:
        for lang_name, cnt in lang_counts.items():
            pct = int(round((cnt / total_submissions) * 100))
            skills_list.append({
                "name": lang_name,
                "level": max(pct, 10),
                "category": "Language"
            })
    else:
        skills_list = [
            {"name": "Python", "level": 0, "category": "Language"},
            {"name": "C++", "level": 0, "category": "Language"}
        ]

    # 6. Đánh giá Achievements
    latest_date = submission_dates[-1] if submission_dates else ""
    achievements = achievement_service.evaluate_user_achievements(
        total_submissions=total_submissions,
        solved_count=len(solved_problem_ids),
        hard_solved_count=len(hard_solved),
        current_streak=streak_info["current_streak"],
        best_streak=streak_info["best_streak"],
        min_exec_time=min_exec_time if min_exec_time < 999.0 else 0.0,
        languages_count=len(languages_used),
        latest_submission_date=latest_date
    )

    return {
        "rank": rank_info["rank"],
        "total_users": rank_info["total_users"],
        "streak": {
            "current_streak": streak_info["current_streak"],
            "best_streak": streak_info["best_streak"]
        },
        "stats": {
            "solved_count": len(solved_problem_ids),
            "total_problems": total_problems_count,
            "easy_solved": len(easy_solved),
            "total_easy": total_easy,
            "medium_solved": len(medium_solved),
            "total_medium": total_medium,
            "hard_solved": len(hard_solved),
            "total_hard": total_hard,
            "acceptance_rate": acceptance_rate,
            "total_submissions": total_submissions
        },
        "achievements": achievements,
        "skills": skills_list,
        "recent_submissions": recent_submissions_formatted
    }

def get_global_leaderboard() -> List[Dict[str, Any]]:
    """
    Lấy danh sách Bảng xếp hạng toàn cầu tất cả người dùng, xếp theo số bài đã giải, tỷ lệ đúng, và streak.
    """
    all_users = auth_service.get_all_users()
    leaderboard = []

    for user in all_users:
        uid = user.get("UserID")
        if not uid:
            continue
        
        full_stats = get_user_full_stats(uid)
        raw_avatar = user.get("AvatarUrl", "")
        unlocked_ach_count = sum(1 for a in full_stats["achievements"] if a.get("unlocked"))

        leaderboard.append({
            "user_id": uid,
            "email": user.get("Email", ""),
            "full_name": user.get("FullName") or "User",
            "avatar_url": storage_service.get_public_avatar_url(raw_avatar),
            "title": user.get("Title") or "Member",
            "solved_count": full_stats["stats"]["solved_count"],
            "easy_solved": full_stats["stats"]["easy_solved"],
            "medium_solved": full_stats["stats"]["medium_solved"],
            "hard_solved": full_stats["stats"]["hard_solved"],
            "total_problems": full_stats["stats"]["total_problems"],
            "acceptance_rate": full_stats["stats"]["acceptance_rate"],
            "total_submissions": full_stats["stats"]["total_submissions"],
            "current_streak": full_stats["streak"]["current_streak"],
            "best_streak": full_stats["streak"]["best_streak"],
            "achievements_count": unlocked_ach_count,
        })

    leaderboard.sort(
        key=lambda x: (x["solved_count"], x["acceptance_rate"], x["current_streak"]),
        reverse=True
    )

    for idx, item in enumerate(leaderboard, start=1):
        item["rank"] = idx

    return leaderboard
