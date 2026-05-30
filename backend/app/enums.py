from enum import StrEnum

class ExerciseType(StrEnum):
    WEIGHT = "weight"
    BODYWEIGHT = "bodyweight"
    TIMED = "timed"
    TIMED_WEIGHT = "timed_weight"

class ExerciseCategory(StrEnum):
    CHEST = "chest"
    BACK = "back"
    LEGS = "legs"
    SHOULDERS = "shoulders"
    ARMS = "arms"
    CORE = "core"

class DiffStatus(StrEnum):
    NEW = "new"
    MODIFIED = "modified"
    REMOVED = "removed"
    UNCHANGED = "unchanged"