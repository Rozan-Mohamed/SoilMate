import json, re, sys
import os
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'mock-server', 'data')
SHOTS = os.environ.get('SHOTS', '/tmp/soilmate-e2e') + '/'
os.makedirs(SHOTS, exist_ok=True)

from playwright.sync_api import sync_playwright
SEED = {q['prompt']: next(c['label'] for c in q['choices']) for q in json.load(open(os.path.join(DATA,'g1.json')))}
BASE = "http://localhost:3111"
res=[]
def ok(n,c,e=""): res.append(bool(c)); print(("PASS " if c else "FAIL ")+n+(f" [{e}]" if e else ""))
def labels(pg): return pg.locator("[role=group] button").evaluate_all("els=>els.map(e=>e.innerText.split('\\n')[0])")
def prompt(pg): return pg.locator("h1").first.inner_text()
def choice(pg,l): return pg.get_by_role("button", name=re.compile("^"+re.escape(l)))
def check(pg): pg.get_by_role("button", name=re.compile("^Check")).click()
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={"width":430,"height":900}).new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE+"/learn/match-the-word"); pg.wait_for_selector("[role=group] button")
    t=prompt(pg); right=SEED[t]
    for w in [l for l in labels(pg) if l!=right]:
        choice(pg,w).click(); check(pg); pg.wait_for_selector("text=Almost! Try again")
        if w != [l for l in labels(pg) if l!=right][-1] or True:
            try: pg.get_by_role("button", name="Try again").click()
            except Exception: pass
    ok("2 hearts lost on one question", pg.get_by_role("img", name="1 of 3 hearts left").count()==1)
    ok("both wrong choices disabled, correct still open", sum(choice(pg,l).is_disabled() for l in labels(pg))==2)
    choice(pg,right).click(); check(pg); pg.wait_for_selector("text=Great job!")
    ok("no points for non-first-try", pg.get_by_role("img", name="0 points").count()==1)
    pg.get_by_role("button", name="Continue").click()
    pg.wait_for_function("document.querySelector('h1').innerText !== %s" % json.dumps(t))
    t2=prompt(pg); w=[l for l in labels(pg) if l!=SEED[t2]][0]
    choice(pg,w).click(); check(pg)
    pg.wait_for_selector("text=Out of hearts", timeout=5000); pg.wait_for_timeout(400)
    pg.screenshot(path=SHOTS+"s6_hearts.png")
    ok("out of hearts modal appears on 3rd lost heart", pg.get_by_text("Out of hearts. Let's try again!").is_visible())
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    ok("Escape on that modal goes back to the games list", pg.url.endswith("/learn"), pg.url)
    pg.goto(BASE+"/learn/match-the-word"); pg.wait_for_selector("[role=group] button")
    ok("fresh round after failing (3 hearts)", pg.get_by_role("img", name="3 of 3 hearts left").count()==1)
    # offline: Check disabled + banner
    pg.get_by_role("button", name=re.compile("^Water|^How|^When|^Chance")).first.click()
    pg.context.set_offline(True); pg.wait_for_timeout(300)
    ok("offline banner shown", pg.get_by_text("You're offline").is_visible())
    ok("Check disabled while offline", pg.get_by_role("button", name=re.compile("^Check|Reconnect")).first.is_disabled())
    pg.context.set_offline(False); pg.wait_for_timeout(300)
    ok("back online enables Check", not pg.get_by_role("button", name=re.compile("^Check")).is_disabled())
    # server down -> inline error, game keeps going
    ok("no page errors", not errs, errs[:2])
    b.close()
print(f"\n{sum(res)}/{len(res)} passed"); sys.exit(0 if all(res) else 1)
