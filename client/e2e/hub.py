import json, re, sys
import os
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'mock-server', 'data')
SHOTS = os.environ.get('SHOTS', '/tmp/soilmate-e2e') + '/'
os.makedirs(SHOTS, exist_ok=True)

from playwright.sync_api import sync_playwright
D=DATA+os.sep
G1={q['prompt']: q['choices'][0]['label'] for q in json.load(open(D+'g1.json'))}
BASE="http://localhost:3111"; res=[]
def ok(n,c,e=""): res.append(bool(c)); print(("PASS " if c else "FAIL ")+n+(f" [{e}]" if e else ""))
def prompt(pg): return pg.locator("h1").first.inner_text()
def btn(pg,l): return pg.get_by_role("button", name=re.compile("^"+re.escape(l)))
def check(pg): pg.get_by_role("button", name=re.compile("^Check")).click()
def cards(pg): return pg.get_by_role("list", name="Games").locator("> li")

with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":430,"height":950}); pg=ctx.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type=="error" and "404" not in m.text and "Failed to load resource" not in m.text else None)

    # ---- skeletons while loading
    held=[]
    pg.route("**/api/games", lambda r: held.append(r))
    pg.goto(BASE+"/learn"); pg.wait_for_selector("h1"); pg.wait_for_timeout(400)
    ok("skeleton cards while loading (5)", pg.get_by_role("list", name="Games").locator("> li[aria-hidden=true]").count()==5)
    pg.unroute("**/api/games")
    pg.reload()
    pg.get_by_role("heading", name=re.compile("Match the Word")).wait_for(timeout=8000); pg.wait_for_timeout(300)
    # ---- fresh player
    ok("title + subtitle + new questions line", pg.get_by_role("heading", name="Learn & Play").count()==1 and pg.get_by_text("Quick games that make the data easier").count()==1 and pg.get_by_text("New questions every time").count()==1)
    ok("points chip 0", pg.get_by_text("0 points").count()==1)
    titles=[t.replace("\n"," ").split(".",1)[-1].strip() for t in cards(pg).locator("h2").all_inner_texts()]
    ok("5 game cards in order", cards(pg).count()==5 and titles==["Match the Word","Satellite or Ground?","Crop Superpowers","Fix the Field","Weather and Crops"], titles)
    body=pg.locator("body").inner_text()
    ok("status Not started x5", body.count("Not started")==5)
    ok("chips for game 1 and the others", "6 terms · 5 per round" in body and body.count("30 questions · 6 per round")==4)
    ok("seen chips", "Seen 0/6" in body and body.count("Seen 0/30")==4)
    ok("all 5 buttons say Play", pg.get_by_role("link", name="Play", exact=True).count()==5)
    ok("master badge locked", "Earn all 5 badges to unlock it" in body and "0 of 5 badges" in body)
    pg.screenshot(path=SHOTS+"hub_fresh.png", full_page=True)
    # ---- sound switches
    sw=pg.get_by_role("switch")
    ok("two switches, both on", sw.count()==2 and sw.nth(0).get_attribute("aria-checked")=="true" and sw.nth(1).get_attribute("aria-checked")=="true")
    sw.nth(0).click(); pg.wait_for_timeout(200)
    ok("music off is saved", sw.nth(0).get_attribute("aria-checked")=="false" and json.loads(pg.evaluate("localStorage.getItem('soilmate.audio')"))["musicOn"] is False)
    ok("navbar still says sound on (effects still on)", pg.get_by_role("button", name="Mute sound").count()==1)
    sw.nth(1).click(); pg.wait_for_timeout(200)
    ok("both off -> navbar says turn sound on", pg.get_by_role("button", name="Turn sound on").count()==1)
    sw.nth(0).click(); sw.nth(1).click()
    # ---- play game 1 fully, come back
    pg.get_by_role("link", name="Play", exact=True).first.click(); pg.get_by_role("group", name="Choose an answer").wait_for()
    for i in range(5):
        t=prompt(pg); btn(pg,G1[t]).click(); check(pg); pg.wait_for_selector("text=Great job!"); pg.get_by_role("button", name="Continue").click()
        if i<4: pg.wait_for_function("t=>document.querySelector('h1').innerText!==t", arg=t)
    pg.wait_for_url(re.compile("/result\\?attempt=")); pg.wait_for_timeout(500)
    pg.get_by_role("link", name="Back to Games").click(); pg.wait_for_selector("text=Seen 5/6"); pg.get_by_text("50 points").wait_for()
    body=pg.locator("body").inner_text()
    first=cards(pg).nth(0)
    ok("card 1: 3 stars + Play again", first.get_by_role("img", name="3 of 3 stars").count()==1 and first.get_by_role("link", name="Play again").count()==1)
    ok("card 1: badge earned (no lock)", first.locator("svg.lucide-lock").count()==0)
    ok("points chip 50", pg.get_by_text("50 points").count()==1)
    ok("master: 1 of 5 badges, 1 of 5 games", "1 of 5 badges" in body and "1 of 5 games done" in body)
    # ---- in progress: start game 2 then leave
    pg.get_by_role("link", name="Play", exact=True).first.click(); pg.get_by_role("group", name="Choose an answer").wait_for()
    pg.get_by_role("button", name="Close game").click(); pg.get_by_role("button", name="Leave", exact=True).click(); pg.wait_for_url(BASE+"/learn")
    pg.wait_for_selector("text=Seen 6/30")
    ok("game 2 shows In progress", "In progress" in cards(pg).nth(1).inner_text())
    pg.screenshot(path=SHOTS+"hub_progress.png", full_page=True)
    # ---- start over
    pg.get_by_role("button", name="Start over").click()
    ok("confirm modal opens", pg.get_by_text("Start over?").is_visible())
    pg.get_by_role("button", name="Keep my progress").click(); pg.wait_for_timeout(300)
    ok("keep closes the modal and keeps points", not pg.get_by_text("Start over?").is_visible() and pg.get_by_text("50 points").count()==1)
    pg.get_by_role("button", name="Start over").click(); pg.get_by_role("button", name="Yes, start over").click()
    pg.wait_for_selector("text=Progress cleared. Fresh start!", timeout=6000); pg.wait_for_timeout(400)
    body=pg.locator("body").inner_text()
    ok("after reset: 0 points, all Not started, seen 0", pg.get_by_text("0 points").count()==1 and body.count("Not started")==5 and "Seen 0/6" in body)
    ok("pipeline circle 1 no longer complete", pg.get_by_role("link", name=re.compile("Match the Word \\(Complete\\)")).count()==0)
    # ---- API down -> error state, then retry works
    pg.route("**/api/games", lambda r: r.abort()); pg.route("**/api/players/me/progress", lambda r: r.abort())
    pg.reload(); pg.wait_for_selector("text=Something went wrong", timeout=8000)
    ok("error state shown", pg.get_by_role("button", name="Retry").count()==1)
    pg.unroute("**/api/games"); pg.unroute("**/api/players/me/progress")
    pg.get_by_role("button", name="Retry").click(); pg.get_by_role("heading", name=re.compile("Match the Word")).wait_for(timeout=8000)
    ok("retry recovers", cards(pg).count()==5)
    # ---- desktop screenshot + no console errors
    pg.set_viewport_size({"width":1100,"height":900}); pg.wait_for_timeout(300); pg.screenshot(path=SHOTS+"hub_desktop.png")
    ok("no console errors", not errs, errs[:3])
    b.close()
print(f"\n{sum(res)}/{len(res)} passed"); sys.exit(0 if all(res) else 1)
