import json, re, sys
import os
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'mock-server', 'data')
SHOTS = os.environ.get('SHOTS', '/tmp/soilmate-e2e') + '/'
os.makedirs(SHOTS, exist_ok=True)

from playwright.sync_api import sync_playwright

SEED = {q['prompt']: next(c['label'] for c in q['choices']) for q in json.load(open(os.path.join(DATA,'g1.json')))}
BASE = "http://localhost:3111"
results = []
def ok(name, cond, extra=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + (f"  [{extra}]" if extra else ""))

def prompt(pg): return pg.locator("h1").first.inner_text()
def choice(pg, label): return pg.get_by_role("button", name=re.compile("^"+re.escape(label)))
def wrong_label(pg, correct):
    labels = pg.locator("[role=group] button").evaluate_all("els=>els.map(e=>e.innerText.split('\\n')[0])")
    return next(l for l in labels if l != correct)

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 430, "height": 900})
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)

    pg.goto(BASE + "/learn/match-the-word"); pg.wait_for_selector("h1", timeout=8000)
    pg.wait_for_selector("[role=group] button")
    pg.screenshot(path=SHOTS+"s1_question.png")
    ok("question screen loads", prompt(pg) in SEED, prompt(pg))
    ok("progress is n of 5", pg.get_by_text("1 of 5").count() > 0)
    ok("Check disabled before selecting", pg.get_by_role("button", name=re.compile("^Check")).is_disabled())
    ok("3 choices", pg.locator("[role=group] button").count() == 3)

    # Q1: correct on first try
    t1 = prompt(pg); pg.keyboard.press("1")  # keyboard select
    ok("key 1 selects a choice", pg.locator("[role=group] button[aria-pressed=true]").count() == 1)
    first = pg.locator("[role=group] button").first
    right = SEED[t1]
    choice(pg, right).click()
    pg.get_by_role("button", name=re.compile("^Check")).click()
    pg.wait_for_selector("text=Great job!")
    pg.wait_for_timeout(400)
    pg.screenshot(path=SHOTS+"s2_correct.png")
    ok("correct banner shows explanation", pg.get_by_text(f"{t1} means").count() > 0)
    ok("streak/points updated from server", pg.get_by_role("img", name="10 points").count() == 1)
    pg.get_by_role("button", name="Continue").click()

    # Q2: wrong first, then correct
    pg.wait_for_function("document.querySelector('h1').innerText !== %s" % json.dumps(t1))
    t2 = prompt(pg); right2 = SEED[t2]; bad = wrong_label(pg, right2)
    choice(pg, bad).click(); pg.get_by_role("button", name=re.compile("^Check")).click()
    pg.wait_for_selector("text=Almost! Try again"); pg.wait_for_timeout(450)
    pg.screenshot(path=SHOTS+"s3_wrong.png")
    ok("wrong banner (no answer revealed)", pg.get_by_text("means").count() == 0 or t2 not in pg.locator("body").inner_text().split("Almost")[1])
    ok("heart lost (2 left)", pg.get_by_role("img", name="2 of 3 hearts left").count() == 1)
    ok("wrong choice disabled", choice(pg, bad).is_disabled())
    pg.get_by_role("button", name="Try again").click()
    ok("selection cleared after try again", pg.locator("[role=group] button[aria-pressed=true]").count() == 0)
    choice(pg, right2).click(); pg.get_by_role("button", name=re.compile("^Check")).click()
    pg.wait_for_selector("text=Great job!")
    ok("retry correct earns no points (still 10)", pg.get_by_role("img", name="10 points").count() == 1)
    pg.get_by_role("button", name="Continue").click()

    # Q3: skip
    pg.wait_for_function("document.querySelector('h1').innerText !== %s" % json.dumps(t2))
    t3 = prompt(pg)
    pg.get_by_role("button", name="Skip").click()
    pg.wait_for_selector("text=Here's the answer"); pg.wait_for_timeout(300)
    pg.screenshot(path=SHOTS+"s4_skipped.png")
    ok("skipped banner shows the answer", pg.get_by_text(SEED[t3]).count() > 0)
    pg.get_by_role("button", name="Continue").click()

    # refresh mid-game -> resume
    pg.wait_for_function("document.querySelector('h1').innerText !== %s" % json.dumps(t3))
    t4 = prompt(pg)
    pg.reload(); pg.wait_for_selector("[role=group] button")
    ok("resume: same question after refresh", prompt(pg) == t4, prompt(pg))
    ok("resume: hearts 2 and points kept", pg.get_by_role("img", name="2 of 3 hearts left").count() == 1 and pg.get_by_role("img", name="10 points").count() == 1)
    ok("resume: counter says 4 of 5", pg.get_by_text("4 of 5").count() > 0)

    # Q4, Q5 correct
    for i in range(2):
        t = prompt(pg)
        choice(pg, SEED[t]).click(); pg.get_by_role("button", name=re.compile("^Check")).click()
        pg.wait_for_selector("text=Great job!"); pg.wait_for_timeout(200)
        pg.keyboard.press("Enter") if False else pg.get_by_role("button", name="Continue").click()
        if i == 0: pg.wait_for_function("document.querySelector('h1').innerText !== %s" % json.dumps(t))

    pg.wait_for_url(re.compile(r"/result\?attempt="), timeout=8000)
    pg.wait_for_selector("text=Great job!"); pg.wait_for_timeout(2300)
    pg.screenshot(path=SHOTS+"s5_result.png", full_page=True)
    body = pg.locator("body").inner_text()
    ok("result: score 3 / 5", "3" in body and "/ 5" in body, re.findall(r"\d\s*/\s*5", body)[:1])
    ok("result: 2 stars", pg.get_by_role("img", name="2 of 3 stars").count() == 1)
    ok("result: collection of 5 terms", pg.get_by_role("heading", name="Words reviewed").locator("xpath=ancestor::section[1]").locator("li").count() == 5)
    ok("result: badge locked hint", "Score 4 or more to earn it" in body)
    ok("result: next game button", pg.get_by_role("link", name=re.compile("Next Game: Satellite or Ground")).count() == 1)
    ok("pipeline: game 1 completed + next glowing", pg.get_by_role("link", name=re.compile("Match the Word \\(Complete\\)")).count() == 1)

    # refresh result page keeps it (idempotent complete)
    pg.reload(); pg.wait_for_selector("text=Great job!")
    ok("result survives refresh", pg.get_by_role("img", name="2 of 3 stars").count() == 1)

    # Play again -> new attempt
    pg.get_by_role("button", name="Play Again").click()
    pg.wait_for_url(re.compile(r"/learn/match-the-word$")); pg.wait_for_selector("[role=group] button")
    ok("play again starts at 1 of 5", pg.get_by_text("1 of 5").count() > 0)

    # exit modal via close button
    pg.get_by_role("button", name="Close game").click()
    ok("exit modal opens", pg.get_by_text("Leave this game?").is_visible())
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    ok("Escape keeps playing", not pg.get_by_text("Leave this game?").is_visible())
    # browser back
    pg.go_back(); pg.wait_for_timeout(500)
    ok("browser back opens exit modal and stays on page", pg.get_by_text("Leave this game?").is_visible() and "/learn/match-the-word" in pg.url, pg.url)
    pg.get_by_role("button", name="Keep playing").click()
    # navbar link intercept
    pg.get_by_role("link", name="SoilMate").click(); pg.wait_for_timeout(300)
    ok("navbar link asks before leaving", pg.get_by_text("Leave this game?").is_visible())
    pg.get_by_role("button", name="Leave", exact=True).click(); pg.wait_for_url(BASE + "/", timeout=5000)
    ok("Leave goes to the wanted page (home)", pg.url == BASE + "/")

    real = [e for e in errs if "favicon" not in e and "404" not in e]
    ok("no console errors", not real, real[:3])
    b.close()

failed = [n for n, c in results if not c]
print("\n%d/%d passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
