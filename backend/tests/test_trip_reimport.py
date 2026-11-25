from copy import deepcopy

import pytest

from app.trip_reimport import apply_reimport, preview_reimport

A = "00000000-0000-0000-0000-000000000001"
B = "00000000-0000-0000-0000-000000000002"


def test_selective_merge_preserves_manual_changes_and_inputs():
    base = {"title": "old", "note": "old", "days": [{"id": A, "title": "day"}]}
    current = deepcopy(base)
    current["note"] = "manual"
    proposed = deepcopy(base)
    proposed["title"] = "new"
    proposed["note"] = "AI"
    proposed["days"][0]["title"] = "changed"
    before = deepcopy((base, current, proposed))
    diff = preview_reimport(base, current, proposed)
    assert {d["path"]: d["conflict"] for d in diff} == {
        "/title": False, "/note": True, f"/days/{A}/title": False,
    }
    result = apply_reimport(base, current, proposed, ["/title", f"/days/{A}/title"])
    assert result == {"title": "new", "note": "manual", "days": [{"id": A, "title": "changed"}]}
    assert (base, current, proposed) == before
    with pytest.raises(ValueError):
        apply_reimport(base, current, proposed, ["/note"])


def test_add_delete_and_reorder_are_explicit():
    base = {"items": [{"id": A, "title": "a"}, {"id": B, "title": "b"}]}
    proposed = {"items": [{"id": B, "title": "b"}]}
    diff = preview_reimport(base, base, proposed)
    assert [(x["path"], x["operation"]) for x in diff] == [(f"/items/{A}", "delete")]
    assert apply_reimport(base, base, proposed, [f"/items/{A}"]) == proposed
    assert apply_reimport(proposed, proposed, base, [f"/items/{A}"])["items"] == [
        {"id": B, "title": "b"}, {"id": A, "title": "a"}
    ]
    reordered = {"items": list(reversed(base["items"]))}
    assert preview_reimport(base, base, reordered) == []
    stages = {"items": [{"id": A, "stages": [{"id": A}, {"id": B}]}]}
    reordered_stages = {"items": [{"id": A, "stages": [{"id": B}, {"id": A}]}]}
    assert apply_reimport(stages, stages, reordered_stages,
                          [f"/items/{A}/stages/@order"]) == reordered_stages


def test_delete_of_manually_edited_object_conflicts():
    base = {"days": [{"id": A, "title": "old"}]}
    current = {"days": [{"id": A, "title": "manual"}]}
    proposed = {"days": []}
    assert preview_reimport(base, current, proposed)[0]["conflict"] is True
    with pytest.raises(ValueError):
        apply_reimport(base, current, proposed, [f"/days/{A}"])


def test_nested_stages_and_rates_use_identity_and_reject_ambiguity():
    base = {"items": [{"id": A, "stages": [{"id": B, "title": "old"}]}],
            "rates": [{"currency": "USD", "rate": "1"}]}
    proposed = deepcopy(base)
    proposed["items"][0]["stages"][0]["title"] = "new"
    proposed["rates"][0]["rate"] = "2"
    paths = {d["path"] for d in preview_reimport(base, base, proposed)}
    assert paths == {f"/items/{A}/stages/{B}/title", "/rates/USD/rate"}
    with pytest.raises(ValueError):
        preview_reimport(base, base, {"items": [{"title": "missing"}]})
    with pytest.raises(ValueError):
        preview_reimport(base, base, {"items": [{"id": A}, {"id": A}]})


def test_unidentified_arrays_are_atomic_and_manual_edits_conflict():
    base = {"map_leg_modes": [{"mode": "walk"}]}
    current = {"map_leg_modes": [{"mode": "drive"}]}
    proposed = {"map_leg_modes": [{"mode": "cycle"}]}
    change = preview_reimport(base, current, proposed)[0]
    assert change["path"] == "/map_leg_modes"
    assert change["conflict"] is True
    with pytest.raises(ValueError):
        apply_reimport(base, current, proposed, [change["path"]])


def test_missing_and_null_are_distinct_and_unknown_selection_rejected():
    changes = preview_reimport({}, {}, {"note": None})
    assert changes[0]["operation"] == "add"
    assert changes[0]["base_present"] is False
    assert changes[0]["proposed_present"] is True
    assert apply_reimport({}, {}, {"note": None}, ["/note"]) == {"note": None}
    with pytest.raises(ValueError):
        apply_reimport({}, {}, {"note": None}, ["/unknown"])


def test_independent_nested_edits_and_selected_stage_deletion():
    base = {"items": [{"id": A, "title": "old", "stages": [{"id": B, "title": "stage"}]}]}
    current = deepcopy(base)
    current["items"][0]["title"] = "manual"
    proposed = deepcopy(base)
    proposed["items"][0]["stages"] = []
    path = f"/items/{A}/stages/{B}"
    assert preview_reimport(base, current, proposed)[0]["conflict"] is False
    assert apply_reimport(base, current, proposed, [path]) == {
        "items": [{"id": A, "title": "manual", "stages": []}]
    }
    current["items"][0]["stages"][0]["title"] = "manual stage"
    assert preview_reimport(base, current, proposed)[0]["conflict"] is True
    with pytest.raises(ValueError):
        apply_reimport(base, current, proposed, [path])


def test_stage_order_can_be_applied_after_selected_addition():
    base = {"items": [{"id": A, "stages": [{"id": A}, {"id": B}]}]}
    proposed = {"items": [{"id": A, "stages": [{"id": B}, {"id": A},
                          {"id": "00000000-0000-0000-0000-000000000003"}]}]}
    new_id = "00000000-0000-0000-0000-000000000003"
    added = apply_reimport(base, base, proposed, [f"/items/{A}/stages/{new_id}"])
    changes = {change["path"]: change for change in preview_reimport(base, added, proposed)}
    path = f"/items/{A}/stages/@order"
    assert changes[path]["conflict"] is False
    assert apply_reimport(base, added, proposed, [path]) == proposed


def test_json_pointer_escapes_keys():
    base = {"a/b": {"c~d": "old"}}
    proposed = {"a/b": {"c~d": "new"}}
    assert preview_reimport(base, base, proposed)[0]["path"] == "/a~1b/c~0d"
    assert apply_reimport(base, base, proposed, ["/a~1b/c~0d"]) == proposed


@pytest.mark.parametrize("stages", [[{"title": "missing"}], [{"id": B}, {"id": B}]])
def test_stages_require_unique_identifiers(stages):
    with pytest.raises(ValueError):
        preview_reimport({}, {}, {"items": [{"id": A, "stages": stages}]})


def test_many_selected_item_changes_are_applied():
    items = [{"id": f"00000000-0000-0000-0000-{i:012x}", "title": "old"}
             for i in range(1, 401)]
    base = {"items": items}
    proposed = deepcopy(base)
    for item in proposed["items"]:
        item["title"] = "new"
    paths = [f"/items/{item['id']}/title" for item in items]
    assert apply_reimport(base, base, proposed, paths) == proposed


def test_selected_stage_add_delete_and_edit_keep_identity_indexes_valid():
    new_id = "00000000-0000-0000-0000-000000000003"
    base = {"items": [{"id": A, "stages": [{"id": A, "title": "a"},
                                            {"id": B, "title": "b"}]}]}
    proposed = {"items": [{"id": A, "stages": [{"id": new_id, "title": "x"},
                                                {"id": B, "title": "changed"}]}]}
    prefix = f"/items/{A}/stages"
    assert apply_reimport(base, base, proposed, [
        f"{prefix}/{new_id}", f"{prefix}/{A}", f"{prefix}/{B}/title"
    ]) == proposed


def test_many_added_and_removed_items_are_applied():
    items = [{"id": f"00000000-0000-0000-0000-{i:012x}"} for i in range(1, 3001)]
    base = {"items": items}
    empty = {"items": []}
    paths = [f"/items/{item['id']}" for item in items]
    assert apply_reimport(base, base, empty, paths) == empty
    assert apply_reimport(empty, empty, base, paths) == base


def test_reorder_with_new_and_manual_stages_preserves_manual_stage():
    extra = "00000000-0000-0000-0000-000000000003"
    manual = "00000000-0000-0000-0000-000000000004"
    base = {"items": [{"id": A, "stages": [{"id": A}, {"id": B}]}]}
    current = {"items": [{"id": A, "stages": [{"id": A}, {"id": manual}, {"id": B}]}]}
    proposed = {"items": [{"id": A, "stages": [{"id": B}, {"id": extra}, {"id": A}]}]}
    prefix = f"/items/{A}/stages"
    added = apply_reimport(base, current, proposed, [f"{prefix}/{extra}"])
    result = apply_reimport(base, added, proposed, [f"{prefix}/@order"])
    assert result["items"][0]["stages"] == [
        {"id": B}, {"id": extra}, {"id": manual}, {"id": A}
    ]
