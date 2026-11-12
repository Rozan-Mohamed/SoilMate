import json, re, sys
import os
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'mock-server', 'data')
SHOTS = os.environ.get('SHOTS', '/tmp/soilmate-e2e') + '/'
os.makedirs(SHOTS, exist_ok=True)

from playwright.sync_api import sync_playwright
G3 = {q['prompt']: {c['key']: c['label'] for c in q['choices']}[q['correctChoiceKey']] for q in json.load(open(os.path.join(DATA,'g3.json')))}
BASE="http://localhost:3111"; res=[]
def ok(n,c,e=""): res.append(bool(c)); print(("PASS " if c else "FAIL ")+n+(f" [{e}]" if e else ""))
def prompt(pg): return pg.locator("h1").first.inner_text()
def btn(pg,l): return pg.get_by_role("button", name=re.compile("^"+re.escape(l)))
def check(pg): pg.get_by_role("button", name=re.compile("^Check")).click()
def names(pg): return pg.locator("[role=group] button").evaluate_all("els=>els.map(e=>e.innerText.split('\\n')[0])")
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={"width":430,"height":950}).new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type=="error" and "404" not in m.text else None)
    pg.goto(BASE+"/learn/crop-superpowers"); pg.wait_for_selector("[role=group] button")
    ok("speech bubble from config", pg.get_by_text("What is its main superpower?").count()==1)
    ok("crop name is the prompt (from API)", prompt(pg) in G3, prompt(pg))
    ok("3 power choices", len(names(pg))==3, names(pg))
    ok("progress 1 of 6", pg.get_by_text("1 of 6").count()>0)
    ok("collection row starts empty (6 slots)", pg.locator("ul[aria-hidden=true] li").count()==6)
    pg.screenshot(path=SHOTS+"g3_q.png")
    for i in range(6):
        t=prompt(pg); right=G3[t]
        if i==2:
            bad=[l for l in names(pg) if l!=right][0]
            btn(pg,bad).click(); check(pg); pg.wait_for_selector("text=Almost! Try again"); pg.get_by_role("button", name="Try again").click()
        btn(pg,right).click(); check(pg); pg.wait_for_selector("text=Power unlocked!")
        if i==0:
            pg.wait_for_timeout(500); pg.screenshot(path=SHOTS+"g3_correct.png")
            ok("collection tile earned after first-try win", pg.locator("ul[aria-hidden=true] li[title]").count()==1)
        if i==2:
            ok("retry win does not add a tile", pg.locator("ul[aria-hidden=true] li[title]").count()==2)
        pg.get_by_role("button", name="Continue").click()
        if i<5: pg.wait_for_function("t=>document.querySelector('h1').innerText!==t", arg=t)
    pg.wait_for_url(re.compile("/result\\?attempt="), timeout=8000); pg.wait_for_selector("text=Superpowers unlocked!"); pg.wait_for_timeout(2300)
    pg.screenshot(path=SHOTS+"g3_result.png", full_page=True)
    body=pg.locator("body").inner_text()
    ok("result title + subtitle", "Superpowers unlocked!" in body and "Your crops are real heroes" in body)
    ok("result: You found 5 superpowers", "You found 5 superpowers" in body)
    ok("result: Collected powers grid with 6 items", pg.get_by_role("heading", name="Collected powers").locator("xpath=ancestor::section[1]").locator("li").count()==6)
    ok("result: one missed power is marked", pg.get_by_text("Review again").count()==1)
    ok("result: Crop Hero badge earned", "Badge: Crop Hero" in body and "Score 4 or more" not in body)
    ok("result: next game Fix the Field", pg.get_by_role("link", name=re.compile("Next Game: Fix the Field")).count()==1)
    ok("no console errors", not errs, errs[:3])
    b.close()
print(f"\n{sum(res)}/{len(res)} passed"); sys.exit(0 if all(res) else 1)
