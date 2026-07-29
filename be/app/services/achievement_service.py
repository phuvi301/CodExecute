from typing import List, Dict, Any
from datetime import datetime

ACHIEVEMENTS_DEFINITION = [
    {
        "id": "first_step",
        "title": "First Step",
        "desc": "Submitted your first solution on CodExecute",
        "category": "General",
        "icon": "Code2",
        "max_progress": 1,
    },
    {
        "id": "problem_solver",
        "title": "Problem Solver",
        "desc": "Successfully solved your first coding challenge",
        "category": "Solving",
        "icon": "CheckCircle2",
        "max_progress": 1,
    },
    {
        "id": "daily_coder",
        "title": "3-Day Streak",
        "desc": "Maintained a 3-day active submission streak",
        "category": "Streak",
        "icon": "Flame",
        "max_progress": 3,
    },
    {
        "id": "consistency_hero",
        "title": "7-Day Streak",
        "desc": "Maintained a 7-day active submission streak",
        "category": "Streak",
        "icon": "Trophy",
        "max_progress": 7,
    },
    {
        "id": "speed_demon",
        "title": "Speed Demon",
        "desc": "Solved a problem with execution time under 50ms",
        "category": "Performance",
        "icon": "Zap",
        "max_progress": 1,
    },
    {
        "id": "polyglot",
        "title": "Polyglot Coder",
        "desc": "Submitted solutions in 2 or more programming languages",
        "category": "Mastery",
        "icon": "Sparkles",
        "max_progress": 2,
    },
    {
        "id": "algo_enthusiast",
        "title": "Algorithm Enthusiast",
        "desc": "Successfully solved 5 distinct problems",
        "category": "Solving",
        "icon": "Star",
        "max_progress": 5,
    },
    {
        "id": "hard_nut",
        "title": "Hard Nut Cracker",
        "desc": "Successfully solved at least 1 Hard difficulty problem",
        "category": "Challenge",
        "icon": "Award",
        "max_progress": 1,
    }
]

def evaluate_user_achievements(
    total_submissions: int,
    solved_count: int,
    hard_solved_count: int,
    current_streak: int,
    best_streak: int,
    min_exec_time: float,
    languages_count: int,
    latest_submission_date: str = ""
) -> List[Dict[str, Any]]:
    """
    Tự động đánh giá danh sách Achievements của người dùng dựa trên dữ liệu thực tế từ Database.
    """
    evaluated = []

    effective_streak = max(current_streak, best_streak)

    for ach in ACHIEVEMENTS_DEFINITION:
        ach_id = ach["id"]
        unlocked = False
        progress = 0
        max_prog = ach["max_progress"]

        if ach_id == "first_step":
            progress = min(total_submissions, max_prog)
            unlocked = total_submissions >= 1
        elif ach_id == "problem_solver":
            progress = min(solved_count, max_prog)
            unlocked = solved_count >= 1
        elif ach_id == "daily_coder":
            progress = min(effective_streak, max_prog)
            unlocked = effective_streak >= 3
        elif ach_id == "consistency_hero":
            progress = min(effective_streak, max_prog)
            unlocked = effective_streak >= 7
        elif ach_id == "speed_demon":
            # Execution time in seconds, 50ms = 0.05s
            has_fast = min_exec_time > 0 and min_exec_time <= 0.05
            progress = 1 if has_fast else 0
            unlocked = has_fast
        elif ach_id == "polyglot":
            progress = min(languages_count, max_prog)
            unlocked = languages_count >= 2
        elif ach_id == "algo_enthusiast":
            progress = min(solved_count, max_prog)
            unlocked = solved_count >= 5
        elif ach_id == "hard_nut":
            progress = min(hard_solved_count, max_prog)
            unlocked = hard_solved_count >= 1

        unlocked_at = latest_submission_date if unlocked else None

        evaluated.append({
            "id": ach_id,
            "title": ach["title"],
            "desc": ach["desc"],
            "category": ach["category"],
            "icon": ach["icon"],
            "unlocked": unlocked,
            "unlocked_at": unlocked_at,
            "progress": progress,
            "max_progress": max_prog,
        })

    return evaluated
