def compute_program_diff(old_program, new_program):
    """Confronta due versioni e ritorna lista di diff per esercizio."""
    old_exs = {e.exercise_id: e for day in old_program.days for e in day.exercises}
    new_exs = {e.exercise_id: e for day in new_program.days for e in day.exercises}

    diffs = []
    for ex_id, new_ex in new_exs.items():
        if ex_id not in old_exs:
            diffs.append({'exercise_id': ex_id, 'diff_type': 'added', 'changes': [], 'set_diffs': []})
            continue
        old_ex = old_exs[ex_id]
        top_changes = []
        for field, label in [('sets','Serie'),('rest_sec','Recupero')]:
            if getattr(old_ex, field) != getattr(new_ex, field):
                top_changes.append({'field': field, 'label': label,
                                    'prev': getattr(old_ex, field),
                                    'curr': getattr(new_ex, field)})
        set_diffs = diff_target_sets(old_ex.target_sets, new_ex.target_sets)
        status = 'modified' if top_changes or set_diffs else 'unchanged'
        diffs.append({'exercise_id': ex_id, 'diff_type': status,
                      'changes': top_changes, 'set_diffs': set_diffs})

    for ex_id in old_exs:
        if ex_id not in new_exs:
            diffs.append({'exercise_id': ex_id, 'diff_type': 'removed', 'changes': [], 'set_diffs': []})

    return diffs


def diff_target_sets(old_sets, new_sets):
    old_map = {s.set_index: s for s in old_sets}
    new_map = {s.set_index: s for s in new_sets}
    result = []
    for idx, new_s in new_map.items():
        if idx not in old_map:
            result.append({'set_index': idx, 'status': 'added', 'changes': []})
            continue
        old_s = old_map[idx]
        changes = []
        for field, label in [('reps','Rip'),('duration_sec','Durata'),('rpe','RPE'),
                              ('tempo_per_rep','Tempo'),('rest_sec_override','Rec')]:
            ov, nv = getattr(old_s, field, None), getattr(new_s, field, None)
            if ov != nv:
                changes.append({'field': field, 'label': label, 'prev': ov, 'curr': nv})
        if changes:
            result.append({'set_index': idx, 'status': 'modified', 'changes': changes})
    for idx in old_map:
        if idx not in new_map:
            result.append({'set_index': idx, 'status': 'removed', 'changes': []})
    return result