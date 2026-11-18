from datetime import date


def calculate_urgency(exam_date):
    """
    Calculate urgency score from 0 to 10
    based on the number of days remaining until the exam.
    """

    if exam_date is None:
        return 2.0

    days_remaining = (exam_date - date.today()).days

    if days_remaining <= 0:
        return 10.0

    elif days_remaining <= 3:
        return 9.0

    elif days_remaining <= 7:
        return 8.0

    elif days_remaining <= 14:
        return 6.0

    elif days_remaining <= 30:
        return 4.0

    else:
        return 2.0


def calculate_priority(topic, subject):
    """
    Calculate the priority score for a topic.

    Score range: 0 - 10

    Factors:
    - Urgency: 35%
    - Remaining work: 25%
    - Weakness: 25%
    - Difficulty: 15%
    """

    # --------------------------------------
    # 1. URGENCY
    # --------------------------------------

    urgency = calculate_urgency(
        subject.exam_date
    )

    # --------------------------------------
    # 2. REMAINING WORK
    # --------------------------------------

    progress = max(
        0,
        min(100, topic.progress)
    )

    remaining_work = 10 - (progress / 10)

    # --------------------------------------
    # 3. WEAKNESS
    # --------------------------------------

    confidence = max(
        0,
        min(100, topic.confidence)
    )

    weakness = 10 - (confidence / 10)

    # --------------------------------------
    # 4. DIFFICULTY
    # --------------------------------------

    difficulty = max(
        1,
        min(5, subject.difficulty)
    )

    difficulty_score = difficulty * 2

    # --------------------------------------
    # 5. FINAL PRIORITY SCORE
    # --------------------------------------

    priority_score = (
        urgency * 0.35
        + remaining_work * 0.25
        + weakness * 0.25
        + difficulty_score * 0.15
    )

    # Keep score between 0 and 10
    priority_score = max(
        0,
        min(10, priority_score)
    )

    # --------------------------------------
    # 6. PRIORITY LEVEL
    # --------------------------------------

    if priority_score >= 7:
        priority_level = "HIGH"

    elif priority_score >= 4:
        priority_level = "MEDIUM"

    else:
        priority_level = "LOW"

    # --------------------------------------
    # 7. RETURN RESULT
    # --------------------------------------

    return {
        "topic_id": topic.id,
        "topic": topic.name,
        "subject": subject.name,
        "priority_score": round(priority_score, 2),
        "priority_level": priority_level,
        "urgency_score": round(urgency, 2),
        "remaining_work_score": round(remaining_work, 2),
        "weakness_score": round(weakness, 2),
        "difficulty_score": round(difficulty_score, 2)
    }