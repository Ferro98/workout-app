from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class User(Base):
    __tablename__ = "users"

    id:            Mapped[int]           = mapped_column(Integer, primary_key=True)
    email:         Mapped[str]           = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str]           = mapped_column(String, nullable=False)
    full_name:     Mapped[str]           = mapped_column(String, nullable=False)
    role:          Mapped[str]           = mapped_column(String, nullable=False)  # 'client' | 'coach'
    coach_id:      Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    color_bg:      Mapped[Optional[str]] = mapped_column(String, nullable=True)
    color_text:    Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active:     Mapped[bool]          = mapped_column(Boolean, default=True, nullable=False)
    created_at:    Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    coach:    Mapped[Optional["User"]] = relationship("User", remote_side="User.id", foreign_keys=[coach_id], back_populates="clients")
    clients:  Mapped[list["User"]]     = relationship("User", foreign_keys=[coach_id], back_populates="coach")
    programs: Mapped[list["Program"]]  = relationship("Program", foreign_keys="Program.client_id", back_populates="client")
    sessions: Mapped[list["Session"]]  = relationship("Session", back_populates="client")


class Exercise(Base):
    __tablename__ = "exercises"

    id:         Mapped[int]           = mapped_column(Integer, primary_key=True)
    name:       Mapped[str]           = mapped_column(String, nullable=False)
    category:   Mapped[str]           = mapped_column(String, nullable=False)  # chest|back|legs|shoulders|arms|core
    type:       Mapped[str]           = mapped_column(String, nullable=False)  # weight|bodyweight|timed|timed_weight
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)  # NULL = sistema
    created_at: Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    creator:           Mapped[Optional["User"]]         = relationship("User", foreign_keys=[created_by])
    program_exercises: Mapped[list["ProgramExercise"]]  = relationship("ProgramExercise", back_populates="exercise")
    history_entries:   Mapped[list["ExerciseHistory"]]  = relationship("ExerciseHistory", back_populates="exercise")


class Program(Base):
    __tablename__ = "programs"

    id:         Mapped[int]           = mapped_column(Integer, primary_key=True)
    client_id:  Mapped[int]           = mapped_column(ForeignKey("users.id"), nullable=False)
    coach_id:   Mapped[int]           = mapped_column(ForeignKey("users.id"), nullable=False)
    name:       Mapped[str]           = mapped_column(String, nullable=False)
    coach_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active:  Mapped[bool]          = mapped_column(Boolean, default=False)
    version:    Mapped[int]           = mapped_column(Integer, default=1, nullable=False)
    parent_id:  Mapped[Optional[int]] = mapped_column(ForeignKey("programs.id"), nullable=True)
    created_at: Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    client:       Mapped["User"]                  = relationship("User", foreign_keys=[client_id], back_populates="programs")
    coach:        Mapped["User"]                  = relationship("User", foreign_keys=[coach_id])
    parent:       Mapped[Optional["Program"]]     = relationship("Program", remote_side="Program.id", foreign_keys=[parent_id])
    days:         Mapped[list["ProgramDay"]]      = relationship("ProgramDay", back_populates="program", order_by="ProgramDay.day_index", cascade="all, delete-orphan")
    sessions:     Mapped[list["Session"]]         = relationship("Session", back_populates="program")
    diffs_as_old: Mapped[list["ProgramDiff"]]     = relationship("ProgramDiff", foreign_keys="ProgramDiff.old_program_id", back_populates="old_program")
    diffs_as_new: Mapped[list["ProgramDiff"]]     = relationship("ProgramDiff", foreign_keys="ProgramDiff.new_program_id", back_populates="new_program")


class ProgramDay(Base):
    __tablename__ = "program_days"

    id:         Mapped[int]           = mapped_column(Integer, primary_key=True)
    program_id: Mapped[int]           = mapped_column(ForeignKey("programs.id", ondelete="CASCADE"), nullable=False)
    day_index:  Mapped[int]           = mapped_column(Integer, nullable=False)
    name:       Mapped[str]           = mapped_column(String, nullable=False)
    focus:      Mapped[str]           = mapped_column(String, nullable=False, default="")
    coach_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    program:   Mapped["Program"]               = relationship("Program", back_populates="days")
    exercises: Mapped[list["ProgramExercise"]] = relationship("ProgramExercise", back_populates="day", order_by="ProgramExercise.sort_order", cascade="all, delete-orphan")
    sessions:  Mapped[list["Session"]]         = relationship("Session", back_populates="day")


class ProgramExercise(Base):
    __tablename__ = "program_exercises"

    id:           Mapped[int]           = mapped_column(Integer, primary_key=True)
    day_id:       Mapped[int]           = mapped_column(ForeignKey("program_days.id", ondelete="CASCADE"), nullable=False)
    exercise_id:  Mapped[int]           = mapped_column(ForeignKey("exercises.id"), nullable=False)
    sort_order:   Mapped[int]           = mapped_column(Integer, default=0, nullable=False)
    type:         Mapped[str]           = mapped_column(String, nullable=False)
    sets:         Mapped[int]           = mapped_column(Integer, nullable=False)
    reps:         Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    duration_sec: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rest_sec:     Mapped[int]           = mapped_column(Integer, default=90, nullable=False)
    notes:        Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    last_weight:  Mapped[Optional[str]] = mapped_column(String, nullable=True)

    day:          Mapped["ProgramDay"]       = relationship("ProgramDay", back_populates="exercises")
    exercise:     Mapped["Exercise"]         = relationship("Exercise", back_populates="program_exercises")
    target_sets:  Mapped[list["TargetSet"]]  = relationship("TargetSet", back_populates="program_exercise", order_by="TargetSet.set_index", cascade="all, delete-orphan")
    session_sets: Mapped[list["SessionSet"]] = relationship("SessionSet", back_populates="program_exercise")
    diffs:        Mapped[list["ProgramDiff"]] = relationship("ProgramDiff", foreign_keys="ProgramDiff.program_exercise_id", back_populates="program_exercise")


class TargetSet(Base):
    __tablename__ = "target_sets"

    id:                  Mapped[int]           = mapped_column(Integer, primary_key=True)
    program_exercise_id: Mapped[int]           = mapped_column(ForeignKey("program_exercises.id", ondelete="CASCADE"), nullable=False)
    set_index:           Mapped[int]           = mapped_column(Integer, nullable=False)
    rpe:                 Mapped[int]           = mapped_column(Integer, nullable=False)
    reps:                Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    duration_sec:        Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tempo_per_rep:       Mapped[Optional[str]] = mapped_column(String, nullable=True)   # es. "4-1-2-0"
    suggested_weight:    Mapped[Optional[str]] = mapped_column(String, nullable=True)   # es. "80"
    rest_sec_override:   Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    note:                Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    program_exercise: Mapped["ProgramExercise"] = relationship("ProgramExercise", back_populates="target_sets")

    __table_args__ = (
        UniqueConstraint("program_exercise_id", "set_index", name="uq_target_set_exercise_index"),
    )


class Session(Base):
    __tablename__ = "sessions"

    id:           Mapped[int]                = mapped_column(Integer, primary_key=True)
    client_id:    Mapped[int]                = mapped_column(ForeignKey("users.id"), nullable=False)
    program_id:   Mapped[int]                = mapped_column(ForeignKey("programs.id"), nullable=False)
    day_id:       Mapped[int]                = mapped_column(ForeignKey("program_days.id"), nullable=False)
    started_at:   Mapped[datetime]           = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ended_at:     Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_sec: Mapped[Optional[int]]      = mapped_column(Integer, nullable=True)
    general_note: Mapped[Optional[str]]      = mapped_column(Text, nullable=True)

    client:          Mapped["User"]               = relationship("User", back_populates="sessions")
    program:         Mapped["Program"]            = relationship("Program", back_populates="sessions")
    day:             Mapped["ProgramDay"]         = relationship("ProgramDay", back_populates="sessions")
    sets:            Mapped[list["SessionSet"]]   = relationship("SessionSet", back_populates="session", cascade="all, delete-orphan")
    history_entries: Mapped[list["ExerciseHistory"]] = relationship("ExerciseHistory", back_populates="session")


class SessionSet(Base):
    __tablename__ = "session_sets"

    id:                  Mapped[int]           = mapped_column(Integer, primary_key=True)
    session_id:          Mapped[int]           = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    program_exercise_id: Mapped[int]           = mapped_column(ForeignKey("program_exercises.id"), nullable=False)
    set_index:           Mapped[int]           = mapped_column(Integer, nullable=False)
    completed:           Mapped[bool]          = mapped_column(Boolean, default=False)
    actual_reps:         Mapped[Optional[str]] = mapped_column(String, nullable=True)
    actual_weight:       Mapped[Optional[str]] = mapped_column(String, nullable=True)
    actual_rir:          Mapped[Optional[str]] = mapped_column(String, nullable=True)
    note:                Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logged_at:           Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    session:          Mapped["Session"]         = relationship("Session", back_populates="sets")
    program_exercise: Mapped["ProgramExercise"] = relationship("ProgramExercise", back_populates="session_sets")


class ExerciseHistory(Base):
    """
    Storico pesi per esercizio — popolato al termine di ogni sessione.
    Alternativa on-the-fly: query su session_sets JOIN sessions.
    Questa tabella è più veloce per la schermata storico del cliente.
    """
    __tablename__ = "exercise_history"

    id:          Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id:   Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"), nullable=False)
    session_id:  Mapped[int] = mapped_column(ForeignKey("sessions.id"), nullable=False)
    date:        Mapped[str] = mapped_column(String, nullable=False)   # "2025-05-12"
    detail:      Mapped[str] = mapped_column(Text, nullable=False)     # "80kg×8, 82.5kg×8, 82.5kg×7"

    client:   Mapped["User"]     = relationship("User")
    exercise: Mapped["Exercise"] = relationship("Exercise", back_populates="history_entries")
    session:  Mapped["Session"]  = relationship("Session", back_populates="history_entries")


class ProgramDiff(Base):
    """
    Diff tra due versioni scheda — generato da diff.py al POST /programs/{id}/new-version.
    diff_items e set_diffs sono JSONB: mappano DiffItem[] e SetDiff[] del frontend
    senza bisogno di tabelle intermedie.
    """
    __tablename__ = "program_diffs"

    id:                  Mapped[int]           = mapped_column(Integer, primary_key=True)
    old_program_id:      Mapped[int]           = mapped_column(ForeignKey("programs.id"), nullable=False)
    new_program_id:      Mapped[int]           = mapped_column(ForeignKey("programs.id"), nullable=False)
    program_exercise_id: Mapped[Optional[int]] = mapped_column(ForeignKey("program_exercises.id"), nullable=True)
    exercise_id:         Mapped[Optional[int]] = mapped_column(ForeignKey("exercises.id"), nullable=True)
    diff_type:           Mapped[str]           = mapped_column(String, nullable=False)  # new|modified|removed|unchanged
    diff_items:          Mapped[list]          = mapped_column(JSONB, nullable=False, default=list)  # DiffItem[]
    set_diffs:           Mapped[list]          = mapped_column(JSONB, nullable=False, default=list)  # SetDiff[]
    created_at:          Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    old_program:      Mapped["Program"]                   = relationship("Program", foreign_keys=[old_program_id], back_populates="diffs_as_old")
    new_program:      Mapped["Program"]                   = relationship("Program", foreign_keys=[new_program_id], back_populates="diffs_as_new")
    program_exercise: Mapped[Optional["ProgramExercise"]] = relationship("ProgramExercise", foreign_keys=[program_exercise_id], back_populates="diffs")