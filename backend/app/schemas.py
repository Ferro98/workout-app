from datetime import datetime
from typing import List, Optional
from app.enums import DiffStatus, ExerciseCategory, ExerciseType
from pydantic import (
    BaseModel, 
    ConfigDict, 
    Field, 
    AliasChoices, 
    AliasPath, 
    EmailStr, 
    field_serializer, 
    computed_field, 
    model_validator
)
from pydantic.alias_generators import to_camel

# region --- CONFIGURAZIONE BASE ---
class BaseSchema(BaseModel):
    """
    Classe base che configura automaticamente la conversione snake_case -> camelCase
    e permette la lettura diretta degli oggetti ORM di SQLAlchemy.
    """
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

# endregion

# region --- STRUTTURE DI SUPPORTO / DIFF / STORICO ---
class DiffItem(BaseSchema):
    field: str
    label: str
    prev: str | int
    curr: str | int

class SetDiff(BaseSchema):
    set_index: int
    changes: List[DiffItem]
    status: DiffStatus

class HistoryEntry(BaseSchema):
    date: str
    detail: str

#endregion

# region --- EXERCISE SCHEMAS ---
class ExerciseBase(BaseSchema):
    id: int
    name: str
    category: ExerciseCategory
    type: ExerciseType

# endregion

# region --- PROGRAM / SCHEDA SCHEMAS ---
class TargetSetOut(BaseSchema):
    set_index: int
    rpe: int
    reps: Optional[int] = None
    # Nel DB è duration_sec, il frontend vuole duration
    duration: Optional[int] = Field(None, alias="duration", validation_alias=AliasChoices("duration", "duration_sec"))
    tempo_per_rep: Optional[str] = None
    suggested_weight: Optional[str] = None
    # Nel DB è rest_sec_override, il frontend vuole restSeconds
    rest_seconds: Optional[int] = Field(None, alias="restSeconds", validation_alias=AliasChoices("restSeconds", "rest_sec_override"))
    note: Optional[str] = None

class TargetSetCreate(BaseSchema):
    set_index: int
    rpe: int
    reps: Optional[int] = None
    duration_sec: Optional[int] = Field(None, alias="duration")
    tempo_per_rep: Optional[str] = None
    suggested_weight: Optional[str] = None
    rest_sec_override: Optional[int] = Field(None, alias="restSeconds")
    note: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)

class ProgramExerciseOut(BaseSchema):
    id: int
    exercise_id: int
    # Estraggono automaticamente il nome e il tipo dalla relazione SQLAlchemy 'exercise'
    name: str = Field(validation_alias=AliasChoices("name", AliasPath("exercise", "name")))
    type: ExerciseType = Field(validation_alias=AliasChoices("type", AliasPath("exercise", "type")))
    sets: int
    reps: Optional[int] = None
    duration: Optional[int] = Field(None, alias="duration", validation_alias=AliasChoices("duration", "duration_sec"))
    rest_seconds: int = Field(..., alias="restSeconds", validation_alias=AliasChoices("restSeconds", "rest_sec"))
    target_sets: List[TargetSetOut] = Field(default_factory=list)
    notes: Optional[str] = None
    
    # Campi dinamici iniettati dalle logiche di diff e history
    diff: DiffStatus = DiffStatus.UNCHANGED  # 'new' | 'modified' | 'removed' | 'unchanged'
    diff_items: List[DiffItem] = Field(default_factory=list)
    set_diffs: List[SetDiff] = Field(default_factory=list)
    last_weight: Optional[str] = None
    history: List[HistoryEntry] = Field(default_factory=list)

class ProgramExerciseCreate(BaseSchema):
    exercise_id: int
    sort_order: int = 0
    sets: int
    reps: Optional[int] = None
    duration_sec: Optional[int] = Field(None, alias="duration")
    rest_sec: int = Field(..., alias="restSeconds")
    notes: Optional[str] = None
    target_sets: List[TargetSetCreate] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)

class ProgramDayOut(BaseSchema):
    id: int
    day_index: int
    name: str
    focus: str
    exercises: List[ProgramExerciseOut] = Field(default_factory=list)
    coach_note: Optional[str] = None

class ProgramDayCreate(BaseSchema):
    day_index: int
    name: str
    focus: str
    coach_note: Optional[str] = None
    exercises: List[ProgramExerciseCreate] = Field(default_factory=list)

class ProgramOut(BaseSchema):
    id: int
    name: str
    client_id: int
    created_at: datetime
    is_active: bool
    coach_note: Optional[str] = None
    days: List[ProgramDayOut] = Field(default_factory=list)

    # Converte l'oggetto datetime di Python nella stringa YYYY-MM-DD per il frontend
    @field_serializer('created_at')
    def serialize_date(self, dt: datetime) -> str:
        return dt.strftime('%Y-%m-%d')
    
class ProgramCreate(BaseSchema):
    name: str
    coach_note: Optional[str] = None
    days: List[ProgramDayCreate] = Field(default_factory=list)

class ProgramUpdate(BaseSchema):
    name: Optional[str] = None
    coach_note: Optional[str] = None
    is_active: Optional[bool] = None

# endregion

# region --- WORKOUT / SESSION SCHEMAS ---
class WorkoutSetState(BaseSchema):
    completed: bool
    actual_reps: str = Field("", validation_alias=AliasChoices("actual_reps", "actual_reps"))
    actual_weight: str = Field("", validation_alias=AliasChoices("actual_weight", "actual_weight"))
    actual_rir: str = Field("", validation_alias=AliasChoices("actual_rir", "actual_rir"))
    note: Optional[str] = ""

class WorkoutExerciseState(BaseSchema):
    program_exercise_id: int
    sets: List[WorkoutSetState] = Field(default_factory=list)
    note: Optional[str] = ""

class WorkoutSessionOut(BaseSchema):
    id: int
    program_id: int
    program_day_id: int = Field(..., alias="programDayId", validation_alias=AliasChoices("program_day_id", "day_id"))
    program_name: str = Field(validation_alias=AliasChoices("program_name", AliasPath("program", "name")))
    day_name: str = Field(validation_alias=AliasChoices("day_name", AliasPath("day", "name")))
    date: datetime = Field(..., validation_alias=AliasChoices("date", "started_at"))
    duration_seconds: Optional[int] = Field(None, alias="durationSeconds", validation_alias=AliasChoices("duration_seconds", "duration_sec"))
    exercises: List[WorkoutExerciseState] = Field(default_factory=list)
    general_note: Optional[str] = None

    @field_serializer('date')
    def serialize_date(self, dt: datetime) -> str:
        return dt.strftime('%Y-%m-%d')

    # Intercetta l'oggetto Session prima della validazione e raggruppa l'array piatto
    # di session_sets nell'albero gerarchico { programExerciseId, sets: [] } chiesto dal frontend
    @model_validator(mode="before")
    @classmethod
    def group_sets_by_exercise(cls, data):
        if isinstance(data, dict) or not hasattr(data, "sets"):
            return data
        
        exercise_map = {}
        for s in data.sets:
            pe_id = s.program_exercise_id
            if pe_id not in exercise_map:
                exercise_map[pe_id] = {
                    "program_exercise_id": pe_id,
                    "sets": [],
                    "note": ""  # Eventuale nota aggregata se gestita a livello esercizio
                }
            exercise_map[pe_id]["sets"].append(s)

        return {
            "id": data.id,
            "program_id": data.program_id,
            "day_id": data.day_id,
            "program": data.program,
            "day": data.day,
            "started_at": data.started_at,
            "duration_sec": data.duration_sec,
            "general_note": data.general_note,
            "exercises": list(exercise_map.values())
        }

class SessionSetCreate(BaseSchema):
    set_index: int
    completed: bool = True
    actual_reps: Optional[str] = None
    actual_weight: Optional[str] = None
    actual_rir: Optional[str] = None
    note: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)

class SessionExerciseCreate(BaseSchema):
    program_exercise_id: int = ...
    sets: List[SessionSetCreate] = Field(default_factory=list)
    note: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)

class SessionCreate(BaseSchema):
    program_id: int = ...
    day_id: int = ...
    started_at: datetime = ...
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    general_note: Optional[str] = None
    
    exercises: List[SessionExerciseCreate] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)

# endregion

# region --- CLIENT SCHEMA ---
class ClientOut(BaseSchema):
    id: int
    name: str = Field(..., validation_alias=AliasChoices("name", "full_name"))
    color_bg: Optional[str] = None
    color_text: Optional[str] = None
    active_program_name: Optional[str] = None
    last_session_date: Optional[str] = None
    is_active: bool

    # Calcola al volo le iniziali (es. "Marco Alberti" -> "MA") senza salvarle sul DB
    @computed_field
    @property
    def initials(self) -> str:
        if not self.name:
            return ""
        parts = self.name.split()
        return "".join([p[0].upper() for p in parts if p])[:2]
    
# endregion

# region --- USER SCHEMA ---

class UserOut(BaseSchema):
    id: int
    email: str
    full_name: str
    role: str
    coach_id: Optional[int]
    color_bg: Optional[str]
    color_text: Optional[str]

# end region