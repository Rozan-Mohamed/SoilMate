import json, re, sys
import os
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'mock-server', 'data')
SHOTS = os.environ.get('SHOTS', '/tmp/soilmate-e2e') + '/'
os.makedirs(SHOTS, exist_ok=True)

from playwright.sync_api import sync_playwright
Q = {q['prompt']: q['correctChoiceKey'] for q in json.load(open(os.path.join(DATA,'g2.json')))}
LABEL = {'satellite':'Satellite','both':'Both Together','ground':'On the Ground'}
BASE="http://localhost:3111"; res=[]
def ok(n,c,e=""): res.append(bool(c)); print(("PASS " if c else "FAIL ")+n+(f" [{e}]" if e else ""))
def prompt(pg): return pg.locator("h1").first.inner_text()
def btn(pg,l): return pg.get_by_role("button", name=re.compile("^"+re.escape(l)))
def check(pg): pg.get_by_role("button", name=re.compile("^Check")).click()
with sync_playwright() as p:
    b=p.chromium.launch()
    # ---------- desktop
    pg=b.new_context(viewport={"width":1100,"height":1000}).new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
    pg.goto(BASE+"/learn/satellite-or-ground"); pg.wait_for_selector("[role=group] button")
    pg.screenshot(path=SHOTS+"g2_desktop_q.png")
    names=pg.locator("[role=group] button").evaluate_all("els=>els.map(e=>e.innerText.split('\\n')[0])")
    ok("choices in API order", names==["Satellite","Both Together","On the Ground"], names)
    boxes=pg.locator("[role=group] button").evaluate_all("els=>els.map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y)]})")
    ok("desktop: 3 columns side by side", boxes[0][1]==boxes[1][1]==boxes[2][1] and boxes[0][0]<boxes[1][0]<boxes[2][0], boxes)
    ok("scene picture shown with a view label", pg.get_by_text(re.compile("Regional view|Field view|Close-up")).count()>=1)
    ok("scene svg present", pg.locator("h1").first.locator("xpath=ancestor::div[1]").locator("svg").count()>=1)
    pg.keyboard.press("2"); ok("key 2 selects Both Together", btn(pg,"Both Together").get_attribute("aria-pressed")=="true")
    ok("progress n of 6", pg.get_by_text("1 of 6").count()>0)
    # play all 6 (Q2 wrong first)
    for i in range(6):
        t=prompt(pg); right=LABEL[Q[t]]
        if i==1:
            bad=[l for l in LABEL.values() if l!=right][0]
            btn(pg,bad).click(); check(pg); pg.wait_for_selector("text=Almost! Try again"); pg.get_by_role("button", name="Try again").click()
        btn(pg,right).click(); check(pg); pg.wait_for_selector("text=Great job!")
        if i==0: pg.wait_for_timeout(400); pg.screenshot(path=SHOTS+"g2_desktop_correct.png")
        pg.get_by_role("button", name="Continue").click()
        if i<5: pg.wait_for_function("t=>document.querySelector('h1').innerText!==t", arg=t)
    pg.wait_for_url(re.compile("/result\\?attempt="), timeout=8000); pg.wait_for_selector("text=Together, we can do better"); pg.wait_for_timeout(2300)
    pg.screenshot(path=SHOTS+"g2_result.png", full_page=True)
    body=pg.locator("body").inner_text()
    ok("result: big message + subtitle", "Together, we can do better" in body and "Satellite sees the big picture. You know the field." in body)
    ok("result: satellite+farmer art instead of mascot", pg.get_by_role("img", name="Satellite or Ground?").count()==1)
    ok("result: score line 5 correctly", "You answered 5 correctly" in body)
    ok("result: 3 recap chips from API", pg.locator("ul li", has_text=re.compile("Big areas|big areas")).count()>=1, re.findall(r"(?:Satellite|On the Ground|Both Together)[^\n]*", body)[:4])
    ok("result: no collection grid", "Words reviewed" not in body)
    ok("result: Data Detective badge earned (no lock hint)", "Badge: Data Detective" in body and "Score 4 or more" not in body)
    ok("result: 2 stars", pg.get_by_role("img", name="2 of 3 stars").count()==1)
    ok("result: next game Crop Superpowers", pg.get_by_role("link", name=re.compile("Next Game: Crop Superpowers")).count()==1)
    ok("pipeline: 1 and 2 done", pg.get_by_role("link", name=re.compile("Satellite or Ground\\? \\(Complete\\)")).count()==1)
    # ---------- mobile
    pm=b.new_context(viewport={"width":390,"height":860}).new_page()
    pm.goto(BASE+"/learn/satellite-or-ground"); pm.wait_for_selector("[role=group] button")
    mb=pm.locator("[role=group] button").evaluate_all("els=>els.map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y)]})")
    ok("mobile: choices stacked", mb[0][0]==mb[1][0]==mb[2][0] and mb[0][1]<mb[1][1]<mb[2][1], mb)
    pm.screenshot(path=SHOTS+"g2_mobile_q.png")
    ok("mobile: no sideways scroll", pm.evaluate("document.documentElement.scrollWidth<=window.innerWidth"))
    ok("no console/page errors", not [e for e in errs if "favicon" not in e and "404" not in e], errs[:2])
    b.close()
print(f"\n{sum(res)}/{len(res)} passed"); sys.exit(0 if all(res) else 1)
