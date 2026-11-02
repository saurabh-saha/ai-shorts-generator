"""Warn when an engine script has text likely to overflow its box:  python3 scripts/lint-script.py [topic ...]"""
import glob, json, sys
LIM = {"chip": 36, "flow_title": 28, "flow_sub": 34, "code": 46, "cmp_item": 44, "cmp_title": 16,
       "stat_label": 18, "stat_value": 9, "question": 170, "badge": 34, "caption": 90}
files = [f"data/{t}.json" for t in sys.argv[1:]] or sorted(glob.glob("data/*.json"))
bad = 0
def warn(f, b, what, text, lim):
    global bad
    if len(text) > lim:
        bad += 1
        print(f"{f} [{b['id']}] {what} too long ({len(text)}>{lim}): {text}")
for f in files:
    d = json.load(open(f))
    for b in d["beats"]:
        v = b.get("visual")
        if not v:
            continue
        warn(f, b, "caption", b["text"], LIM["caption"])
        if b.get("badge"): warn(f, b, "badge", b["badge"], LIM["badge"])
        if v == "chips":
            for t, *_ in b["items"]: warn(f, b, "chip", t, LIM["chip"])
        elif v == "flow":
            for t, c, *s in b["items"]:
                warn(f, b, "flow title", t, LIM["flow_title"])
                if s: warn(f, b, "flow sub", s[0], LIM["flow_sub"])
        elif v == "code":
            for t, *_ in b["items"]: warn(f, b, "code line", t, LIM["code"])
        elif v == "compare":
            for side in ("left", "right"):
                warn(f, b, "compare title", b[side]["title"], LIM["cmp_title"])
                for t in b[side]["items"]: warn(f, b, "compare item", t, LIM["cmp_item"])
        elif v == "stat":
            for l, val, *_ in b["items"]:
                warn(f, b, "stat label", l, LIM["stat_label"]); warn(f, b, "stat value", val, LIM["stat_value"])
        elif v == "question":
            warn(f, b, "question", b["items"][0], LIM["question"])
print("lint: ok" if not bad else f"lint: {bad} warning(s)")
