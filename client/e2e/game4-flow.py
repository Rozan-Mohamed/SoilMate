import json, re, sys
import os
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'mock-server', 'data')
SHOTS = os.environ.get('SHOTS', '/tmp/soilmate-e2e') + '/'
os.makedirs(SHOTS, exist_ok=True)

from playwright.sync_api import sync_playwright
G4 = {q['prompt']: {c['key']: c['label'] for c in q['choices']}[q['correctChoiceKey']] for q in json.load(open(os.path.join(DATA,'g4.json')))}
BASE="http://localhost:3111"; res=[]
def ok(n,c,e=""): res.append(bool(c)); print(("PASS " if c else "FAIL ")+n+(f" [{e}]" if e else ""))
def prompt(pg): return pg.locator("h1").first.inner_text()
def btn(pg,l): return pg.get_by_role("button", name=re.compile("^"+re.escape(l)))
def check(pg): pg.get_by_role("button", name=re.compile("^Check")).click()
def names(pg): return pg.locator("[role=group] button").evaluate_all("els=>els.map(e=>e.innerText.split('\\n')[0])")
def scene_layers(pg): return pg.locator("h1").first.locator("xpath=ancestor::div[1]").locator("svg[viewBox='0 0 320 150']").count()
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={"width":430,"height":950}).new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type=="error" and "404" not in m.text else None)
    pg.goto(BASE+"/learn/fix-the-field"); pg.wait_for_selector("[role=group] button")
    ok("bubble text", pg.get_by_text("How do we fix this?").count()==1)
    ok("problem label is the prompt", prompt(pg) in G4, prompt(pg))
    ok("one scene (problem) before answering", scene_layers(pg)==1, scene_layers(pg))
    ok("3 fix choices with icons", len(names(pg))==3 and pg.locator("[role=group] button svg").count()>=3)
    pg.screenshot(path=SHOTS+"g4_q.png")
    for i in range(6):
        t=prompt(pg); right=G4[t]
        if i==1:
            bad=[l for l in names(pg) if l!=right][0]
            btn(pg,bad).click(); check(pg); pg.wait_for_selector("text=Almost! Try again"); pg.get_by_role("button", name="Try again").click()
        if i==2:
            pg.get_by_role("button", name="Skip").click(); pg.wait_for_selector("text=Here's the answer"); pg.wait_for_timeout(400)
            ok("skip: scene stays on the problem", scene_layers(pg)==1)
            pg.get_by_role("button", name="Continue").click(); pg.wait_for_function("t=>document.querySelector('h1').innerText!==t", arg=t); continue
        btn(pg,right).click(); check(pg); pg.wait_for_selector("text=Field fixed!"); pg.wait_for_timeout(1400)
        if i==0:
            pg.screenshot(path=SHOTS+"g4_fixed.png")
            ok("correct: fixed scene fades in on top (2 layers)", scene_layers(pg)==2, scene_layers(pg))
            ok("'Field healed!' label shown", pg.get_by_text("Field healed!").count()>=1)
            ok("tile earned in collection row", pg.locator("ul[aria-hidden=true] li[title]").count()==1)
            ok("fixed layer fully visible", pg.evaluate("""()=>{const l=[...document.querySelectorAll("svg[viewBox='0 0 320 150']")].pop().closest('div[style*=opacity]');return l?parseFloat(getComputedStyle(l).opacity)>0.99:true}"""))
        pg.get_by_role("button", name="Continue").click()
        if i<5: pg.wait_for_function("t=>document.querySelector('h1').innerText!==t", arg=t)
    pg.wait_for_url(re.compile("/result\\?attempt="), timeout=8000); pg.wait_for_selector("text=Fields fixed!"); pg.wait_for_timeout(2300)
    pg.screenshot(path=SHOTS+"g4_result.png", full_page=True)
    body=pg.locator("body").inner_text()
    ok("result title/subtitle", "Fields fixed!" in body and "You are a great field doctor" in body)
    ok("score line", re.search(r"You fixed \d+ fields", body) is not None, re.findall(r"You fixed \d+ fields", body))
    grid=pg.get_by_role("heading", name="Field treatments").locator("xpath=ancestor::section[1]")
    ok("Field treatments grid has 6 tiles", grid.locator("li").count()==6)
    ok("missed tiles use a soft dot (no lock)", grid.locator("svg.lucide-lock").count()==0)
    ok("Field Doctor badge", "Badge: Field Doctor" in body)
    ok("next game Weather and Crops", pg.get_by_role("link", name=re.compile("Next Game: Weather and Crops")).count()==1)
    ok("no console errors", not errs, errs[:3])
    b.close()
print(f"\n{sum(res)}/{len(res)} passed"); sys.exit(0 if all(res) else 1)
