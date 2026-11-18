def create_study_plan(priorities, daily_study_hours):
    """
    Create a daily study plan using topic priorities
    and the student's available study hours.
    """

    if not priorities:
        return []

    if daily_study_hours <= 0:
        return []

    total_minutes = int(daily_study_hours * 60)

    # Maximum useful session length
    session_minutes = 60

    plan = []

    remaining_minutes = total_minutes

    for topic in priorities:

        if remaining_minutes <= 0:
            break

        # Give high-priority topics more time
        if topic["priority_level"] == "HIGH":
            allocated_minutes = 60
        elif topic["priority_level"] == "MEDIUM":
            allocated_minutes = 45
        else:
            allocated_minutes = 30

        # Don't exceed available time
        allocated_minutes = min(
            allocated_minutes,
            remaining_minutes
        )

        plan.append({
            "topic_id": topic["topic_id"],
            "topic": topic["topic"],
            "subject": topic["subject"],
            "priority_score": topic["priority_score"],
            "priority_level": topic["priority_level"],
            "planned_minutes": allocated_minutes
        })

        remaining_minutes -= allocated_minutes

    return plan