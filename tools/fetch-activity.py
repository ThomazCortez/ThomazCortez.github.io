"""Builds data/activity.js: GitHub contributions per day for the last year,
with the repositories committed to on each day. Needs the GitHub CLI (gh) logged in.

Usage: python tools/fetch-activity.py
"""
import json, subprocess, pathlib, datetime, collections

ROOT = pathlib.Path(__file__).resolve().parent.parent
ACCOUNTS = ["ThomazCortez", "ThomazCortezESTG"]
AUTHORS = {"ThomazCortez", "ThomazCortezESTG"}
NAMES = {  # repo name -> name shown on the site
    "moonarrowstudios": "MoonArrow Studios", "devday": "DevDay", "DailyFuel": "DailyFuel",
    "TelePomba": "TelePomba", "Lux": "Lux",
    "projetoTS_Thomaz_Paulo": "SecureChat", "PSI_DA_PL2_Thomaz_Paulo": "iShopping",
    "Mercury": "Mercury", "MercuryDev": "Mercury", "FrutigerCaf-": "FrutigerCafé",
    "towerDefenseMacro": "towerDefenseMacro", "FP-Markdown": "FP-Markdown",
}
HIDDEN = {"loop-The-Killer"}  # repos whose commits count but whose name is not shown


def gh(*args):
    return json.loads(subprocess.run(["gh", *args], check=True, capture_output=True, text=True, encoding="utf-8").stdout)


def calendar(login):
    q = 'query($l:String!){user(login:$l){contributionsCollection{contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}'
    d = gh("api", "graphql", "-f", f"query={q}", "-f", f"l={login}")
    weeks = d["data"]["user"]["contributionsCollection"]["contributionCalendar"]["weeks"]
    return {day["date"]: day["contributionCount"] for w in weeks for day in w["contributionDays"]}


counts = collections.Counter()
for login in ACCOUNTS:
    counts.update(calendar(login))
days = sorted(counts)
since = days[0] + "T00:00:00Z"

repos_by_day = collections.defaultdict(set)
for login in ACCOUNTS:
    for repo in gh("repo", "list", login, "--limit", "100", "--json", "name"):
        try:
            pages = gh("api", "--paginate", "--slurp", f"repos/{login}/{repo['name']}/commits?since={since}&per_page=100")
        except subprocess.CalledProcessError:
            continue
        for c in (c for page in pages for c in page):
            who = (c.get("author") or {}).get("login")
            if who not in AUTHORS:
                continue
            date = c["commit"]["author"]["date"][:10]
            if repo["name"] in HIDDEN:
                continue
            repos_by_day[date].add(NAMES.get(repo["name"], repo["name"]))

out = {
    "generated": datetime.date.today().isoformat(),
    "start": days[0],
    "counts": [counts[d] for d in days],
    "repos": {d: sorted(r) for d, r in sorted(repos_by_day.items()) if d in counts},
}
target = ROOT / "data" / "activity.js"
target.write_text("window.ACTIVITY = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
print(f"{len(days)} days, {sum(out['counts'])} contributions, {len(out['repos'])} days with known repos -> {target}")
