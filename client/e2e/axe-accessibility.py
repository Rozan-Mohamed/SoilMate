import json, re, sys
import os
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'mock-server', 'data')
SHOTS = os.environ.get('SHOTS', '/tmp/soilmate-e2e') + '/'
os.makedirs(SHOTS, exist_ok=True)

from playwright.sync_api import sync_playwright
D=DATA+os.sep
SLUGS=['match-the-word','satellite-or-ground','crop-superpowers','fix-the-field','weather-and-crops']
ANS={slug:{q['prompt']: {c['key']: c['label'] for c in q['choices']}[q['correctChoiceKey']] for q in json.load(open(D+f'g{i+1}.json'))} for i,slug in enumerate(SLUGS)}
BASE="http://localhost:3111"
AXE=open(os.path.join(HERE,'..','node_modules','axe-core','axe.min.js')).read()
OPTS={"runOnly":{"type":"tag","values":["wcag2a","wcag2aa","wcag21a","wcag21aa","best-practice"]}}
def prompt(pg): return pg.locator("h1").first.inner_text()
def btn(pg,l): return pg.get_by_role("button", name=re.compile("^"+re.escape(l)))
def names(pg): return pg.locator("[role=group] button").evaluate_all("els=>els.map(e=>e.innerText.split('\\n')[0])")
def check(pg): pg.get_by_role("button", name=re.compile("^Check")).click()
found={}
def scan(pg, label):
    pg.wait_for_timeout(1400)  # let animations settle
    pg.evaluate(AXE) if not pg.evaluate("typeof axe!=='undefined'") else None
    r=pg.evaluate("(o)=>axe.run(document,o)", OPTS)
    v=r['violations']; print(f"{label}: {len(v)} violation(s)")
    for x in v:
        print(f"   [{x['impact']}] {x['id']} x{len(x['nodes'])}: {x['help']}")
        for n in x['nodes'][:2]: print("      ", n['target'], "|", n['html'][:110].replace("\n"," "))
    found[label]=v
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_context(viewport={"width":430,"height":950}).new_page()
    pg.goto(BASE+"/learn"); pg.get_by_role("heading", name=re.compile("Match the Word")).wait_for(); scan(pg,"hub")
    for slug in SLUGS:
        pg.goto(f"{BASE}/learn/{slug}"); pg.get_by_role("group", name="Choose an answer").wait_for(); scan(pg, f"{slug} question")
        t=prompt(pg); right=ANS[slug][t]
        bad=[l for l in names(pg) if l!=right][0]
        btn(pg,bad).click(); check(pg); pg.wait_for_selector("text=Almost! Try again"); scan(pg, f"{slug} wrong answer")
        pg.get_by_role("button", name="Try again").click(); btn(pg,right).click(); check(pg)
        pg.wait_for_selector("text=/Great job!|Power unlocked!|Field fixed!|Nice call!/"); scan(pg, f"{slug} correct answer")
    # score screen + finale of the last game via a full play
    def play(slug):
        pg.goto(f"{BASE}/learn/{slug}"); pg.get_by_role("group", name="Choose an answer").wait_for()
        total=5 if slug=='match-the-word' else 6
        for i in range(total):
            t=prompt(pg); right=ANS[slug][t]
            if pg.get_by_role("button", name="Continue").count()==0:
                btn(pg,right).click(); check(pg)
            pg.wait_for_selector("text=/Great job!|Power unlocked!|Field fixed!|Nice call!/")
            pg.get_by_role("button", name="Continue").click()
            if i<total-1: pg.wait_for_function("t=>document.querySelector('h1').innerText!==t", arg=t)
        pg.wait_for_url(re.compile("/result\\?attempt=")); 
    ctx2=b.new_context(viewport={"width":430,"height":950}); pg=ctx2.new_page()
    play('match-the-word'); scan(pg,"score screen (game 1)")
    play('weather-and-crops'); scan(pg,"score + finale (game 5, not all done)")
    # hub with progress + start over dialog
    pg.goto(BASE+"/learn"); pg.get_by_role("heading", name=re.compile("Match the Word")).wait_for(); scan(pg,"hub with progress")
    pg.get_by_role("button", name="Start over").click(); scan(pg,"hub start-over dialog")
    b.close()
tot=sum(len(v) for v in found.values()); print("\nTOTAL violations:", tot)
json.dump({k:[{ 'id':x['id'],'impact':x['impact'],'n':len(x['nodes'])} for x in v] for k,v in found.items()}, open(SHOTS+'a11y_result.json','w'), indent=1)
