"""Pure three-way comparison for explicit, selective trip reimports.

Inputs are JSON-shaped trip objects from the same export lineage. Identity-bearing
collections are matched by UUID (rates by currency), never by list position.
Schema and cross-field validation belong to the caller after selection.
"""

from copy import deepcopy
from uuid import UUID

_MISSING = object()
_IDENTITIES = {"days": "id", "items": "id", "stages": "id", "rates": "currency"}


def _escape(value):
    return str(value).replace("~", "~0").replace("/", "~1")


def _path(parts):
    return "".join("/" + _escape(part) for part in parts)


def _identity(value, key, path):
    if not isinstance(value, dict) or not isinstance(value.get(key), str) or not value[key]:
        raise ValueError(f"Missing {key} at {_path(path)}")
    identity = value[key]
    if key == "id":
        try:
            identity = str(UUID(identity))
        except (ValueError, AttributeError):
            raise ValueError(f"Invalid UUID at {_path(path)}") from None
    return identity


def _validate(document):
    seen = {name: set() for name in _IDENTITIES if name != "rates"}

    def visit(value, path=()):
        if isinstance(value, dict):
            for key, child in value.items():
                if key in _IDENTITIES and isinstance(child, list):
                    local = set()
                    for entry in child:
                        identity = _identity(entry, _IDENTITIES[key], (*path, key))
                        if identity in local or (key in seen and identity in seen[key]):
                            raise ValueError(
                                f"Duplicate identity at {_path((*path, key, identity))}"
                            )
                        local.add(identity)
                        if key in seen:
                            seen[key].add(identity)
                        visit(entry, (*path, key, identity))
                else:
                    visit(child, (*path, key))
        elif isinstance(value, list):
            for child in value:
                visit(child, path)

    if not isinstance(document, dict):
        raise ValueError("Trip must be an object")
    visit(document)


def _indexed(values, key, path):
    return {_identity(item, key, path): item for item in values}


def _same(a, b):
    return a is b if a is _MISSING or b is _MISSING else a == b


def _changes(base, current, proposed):
    for document in (base, current, proposed):
        _validate(document)
    result = []

    def add(parts, old, now, new, operation=None):
        if _same(old, new) or _same(now, new):
            return
        operation = operation or (
            "add" if old is _MISSING else "delete" if new is _MISSING else "change"
        )
        result.append({
            "path": _path(parts), "operation": operation,
            "base": None if old is _MISSING else deepcopy(old),
            "current": None if now is _MISSING else deepcopy(now),
            "proposed": None if new is _MISSING else deepcopy(new),
            "base_present": old is not _MISSING, "current_present": now is not _MISSING,
            "proposed_present": new is not _MISSING,
            "conflict": not _same(old, now),
            "_parts": parts,
        })

    def walk(old, now, new, parts=()):
        if _same(old, new) or _same(now, new):
            return
        if all(isinstance(x, dict) for x in (old, now, new)):
            for key in dict.fromkeys((*old, *now, *new)):
                walk(old.get(key, _MISSING), now.get(key, _MISSING),
                     new.get(key, _MISSING), (*parts, key))
        elif (parts and parts[-1] in _IDENTITIES
              and all(isinstance(x, list) for x in (old, now, new))):
            key = _IDENTITIES[parts[-1]]
            maps = [_indexed(x, key, parts) for x in (old, now, new)]
            for identity in dict.fromkeys((*maps[0], *maps[1], *maps[2])):
                previous_count = len(result)
                walk(*(mapping.get(identity, _MISSING) for mapping in maps), (*parts, identity))
                if (parts[-1] == "stages" and identity not in maps[0] and identity in maps[2]
                        and len(result) > previous_count):
                    change = result[-1]
                    change["_insertion_order"] = list(maps[2])
                    shared_current = set(maps[0]) & set(maps[1])
                    change["conflict"] |= (
                        [x for x in maps[0] if x in shared_current]
                        != [x for x in maps[1] if x in shared_current]
                    )
            # Relative order of surviving shared objects is independently selectable.
            shared = set(maps[0]) & set(maps[2])
            old_order = [x for x in maps[0] if x in shared]
            new_order = [x for x in maps[2] if x in shared]
            if parts[-1] == "stages" and old_order != new_order:
                now_order = [x for x in maps[1] if x in shared]
                add((*parts, "@order"), old_order, now_order, new_order, "reorder")
                if result and result[-1]["path"] == _path((*parts, "@order")):
                    result[-1]["_order_targets"] = list(maps[2])
        else:
            add(parts, old, now, new)

    walk(base, current, proposed)
    return result


def preview_reimport(base, current, proposed):
    """Return proposed differences; presence flags distinguish missing from null."""
    return [{key: value for key, value in change.items() if not key.startswith("_")}
            for change in _changes(base, current, proposed)]


def apply_reimport(base, current, proposed, selected_paths):
    """Apply only selected, nonconflicting differences to a copy of current."""
    changes = {change["path"]: change for change in _changes(base, current, proposed)}
    selected = list(selected_paths)
    if len(selected) != len(set(selected)):
        raise ValueError("Duplicate selected path")
    if any(path not in changes or changes[path]["conflict"] for path in selected):
        raise ValueError("Unknown or conflicting selected path")
    result = deepcopy(current)
    indexes = {}
    deletions = {}
    for path in selected:
        change = changes[path]
        parts = change["_parts"]
        if (change["operation"] == "delete" and len(parts) > 1
                and parts[-2] in _IDENTITIES):
            deletions.setdefault(parts[:-1], set()).add(parts[-1])
    deleted_groups = set()

    def index_for(values, identity_key, parts):
        cache_key = id(values)
        if cache_key not in indexes:
            indexes[cache_key] = _indexed(values, identity_key, parts)
        return indexes[cache_key]

    for path in selected:
        change = changes[path]
        parts = change["_parts"]
        parent = result
        for index, part in enumerate(parts[:-1]):
            if isinstance(parent, list):
                identity_key = _IDENTITIES[parts[index - 1]]
                parent = index_for(parent, identity_key, parts)[part]
            else:
                parent = parent[part]
        final = parts[-1]
        if final == "@order" and isinstance(parent, list):
            identity_key = _IDENTITIES[parts[-2]]
            indexed = _indexed(parent, identity_key, parts)
            targets = [identity for identity in change["_order_targets"] if identity in indexed]
            ordered = iter(indexed[identity] for identity in targets)
            target_set = set(targets)
            parent[:] = [next(ordered) if _identity(item, identity_key, parts) in target_set
                         else item for item in parent]
        elif isinstance(parent, list):
            identity_key = _IDENTITIES[parts[-2]]
            if change["operation"] == "delete":
                group = parts[:-1]
                if group not in deleted_groups:
                    removed = deletions[group]
                    parent[:] = [item for item in parent
                                 if _identity(item, identity_key, parts) not in removed]
                    indexes.pop(id(parent), None)
                    deleted_groups.add(group)
            else:
                value = deepcopy(change["proposed"])
                if "_insertion_order" in change:
                    order = change["_insertion_order"]
                    following = set(order[order.index(final) + 1:])
                    position = next(
                        (i for i, item in enumerate(parent)
                         if _identity(item, identity_key, parts) in following), len(parent)
                    )
                    parent.insert(position, value)
                else:
                    parent.append(value)
                if id(parent) in indexes:
                    indexes[id(parent)][final] = value
        elif change["proposed_present"]:
            parent[final] = deepcopy(change["proposed"])
        else:
            parent.pop(final, None)
    _validate(result)
    return result
