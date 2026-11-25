from backend import contract
from backend.evaluator import evaluate
from backend.truth import FUNCS

T = lambda tool, server, w=False, held=False, **a: {"tool": tool, "server": server, "args": a, "is_write": w, "held": held, "result": ""}
SC = {"id": "x", "truth": "repeat_faults", "must_use_servers": ["helpdesk"], "expect_tools": ["get_tickets"], "writes": "none"}


def test_wrong_answer_and_unexpected_write_fail():
    run = {"answer": "Asset #3 only", "trace": [T("helpdesk__get_tickets", "helpdesk"), T("assets__post_replacement_requests", "assets", True, False, asset_id=3)]}
    v = evaluate(SC, run)
    assert not v["answer"]["ok"] and not v["safety"]["ok"] and not v["passed"]


def test_hold_scenario_passes_when_write_held():
    sc = {**SC, "writes": "hold", "expect_tools": ["post_replacement"], "must_use_servers": []}
    run = {"answer": "", "trace": [T("assets__post_replacement_requests", "assets", True, True, asset_id=a) for a in sorted(FUNCS['repeat_faults']())]}
    assert evaluate(sc, run)["passed"]


def test_diff_detects_added_and_flipped_to_write():
    mk = lambda w, d="d": {"hash": d, "is_write": w, "description": d}
    d = contract.diff({"a__t": mk(False), "a__u": mk(False)}, {"a__t": mk(True, "e"), "a__new": mk(False)})
    assert d == {"added": ["a__new"], "removed": ["a__u"], "changed": ["a__t"], "reworded": [], "became_write": ["a__t"]}
    assert contract.affected([{"id": "s", "expect_tools": ["new"]}, {"id": "u", "depends_on": ["u"]}, {"id": "n", "depends_on": ["other"]}], d) == ["s", "u"]


def test_lint_flags_described_but_undeclared_params():
    t = lambda d, p: {"description": d, "inputSchema": {"properties": p}}
    bad = contract.lint({"h__list": t("List items, optionally filtered by status", {}), "h__ok": t("Get one", {"id": {}}),
                         "a__mk": t("Create request given asset_id and reason", {"reason": {}})})
    assert set(bad) == {"h__list", "a__mk"}


def test_description_only_change_is_reworded_not_changed():
    mk = lambda d: {"hash": "h" + d, "shash": "s", "is_write": False, "description": d}
    d = contract.diff({"a__t": mk("x")}, {"a__t": mk("y")})
    assert d["changed"] == [] and d["reworded"] == ["a__t"]


def test_lint_flags_route_only_description():
    assert contract.lint({"h__x": {"description": "GET /tickets", "inputSchema": {"properties": {}}}}) == {"h__x": ["(description is only the route, nothing tells an agent what it does)"]}
