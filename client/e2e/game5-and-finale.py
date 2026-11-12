import json, re, sys
import os
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'mock-server', 'data')
SHOTS = os.environ.get('SHOTS', '/tmp/soilmate-e2e') + '/'
os.makedirs(SHOTS, exist_ok=True)

from playwright.sync_api import sync_playwright
D=DATA+os.sep
SLUGS=['match-the-word','satellite-or-ground','crop-superpowers','fix-the-field','weather-and-crops']
ANS={}
for i,slug in enumerate(SLUGS):
    ANS[slug]={q['prompt']: {c['key']: c['label'] for c in q['choices']}[q['correctChoiceKey']] for q in json.load(open(D+f'g{i+1}.json'))}
BASE="http://localhost:3111"; res=[]
def ok(n,c,e=""): res.append(bool(c)); print(("PASS " if c else "FAIL ")+n+(f" [{e}]" if e else ""))
def prompt(pg): return pg.locator("h1").first.inner_text()
def btn(pg,l): return pg.get_by_role("button", name=re.compile("^"+re.escape(l)))
def check(pg): pg.get_by_role("button", name=re.compile("^Check")).click()
def names(pg): return pg.locator("[role=group] button").evaluate_all("els=>els.map(e=>e.innerText.split('\\n')[0])")
def layers(pg): return pg.locator("h1").first.locator("xpath=ancestor::div[1]").locator("svg[viewBox='0 0 320 150']").count()

def play(pg, slug, wrong_at=None, skip_at=None, shot=None):
    pg.goto(f"{BASE}/learn/{slug}"); pg.wait_for_selector("[role=group] button")
    total = 5 if slug=='match-the-word' else 6
    for i in range(total):
        t=prompt(pg); right=ANS[slug][t]
        if i==skip_at:
            pg.get_by_role("button", name="Skip").click(); pg.wait_for_selector("text=Here's the answer")
        else:
            if i==wrong_at:
                bad=[l for l in names(pg) if l!=right][0]
                btn(pg,bad).click(); check(pg); pg.wait_for_selector("text=Almost! Try again"); pg.get_by_role("button", name="Try again").click()
            btn(pg,right).click(); check(pg)
            pg.wait_for_selector("text=/Great job!|Power unlocked!|Field fixed!|Nice call!/")
            if shot and i==0:
                pg.wait_for_timeout(900); pg.screenshot(path=shot)
        pg.get_by_role("button", name="Continue").click()
        if i<total-1: pg.wait_for_function("t=>document.querySelector('h1').innerText!==t", arg=t)
    pg.wait_for_url(re.compile("/result\\?attempt="), timeout=8000); pg.wait_for_timeout(2300)

with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":430,"height":950}); pg=ctx.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type=="error" and "404" not in m.text else None)
    # ---------- Game 5 screens
    pg.goto(BASE+"/learn/weather-and-crops"); pg.wait_for_selector("[role=group] button")
    ok("bubble text", pg.get_by_text("What will happen to the field?").count()==1)
    ok("weather event is the prompt", prompt(pg) in ANS['weather-and-crops'], prompt(pg))
    ok("3 result choices with art", len(names(pg))==3 and pg.locator("[role=group] button svg").count()>=3)
    ok("one scene layer before answering (no animation)", layers(pg)==1, layers(pg))
    t=prompt(pg); btn(pg,ANS['weather-and-crops'][t]).click(); check(pg); pg.wait_for_selector("text=Nice call!"); pg.wait_for_timeout(1000)
    ok("animation overlay appears after a correct answer", layers(pg)==2, layers(pg))
    pg.screenshot(path=SHOTS+"g5_correct.png")
    ok("sticker earned in the collection row", pg.locator("ul[aria-hidden=true] li[title]").count()==1)
    # ---------- finale, state A: only game 5 played (fresh player)
    ctx=b.new_context(viewport={"width":430,"height":950}); pg=ctx.new_page()
    pg.on("pageerror", lambda e: errs.append(str(e)))
    play(pg, 'weather-and-crops', wrong_at=1, skip_at=2)
    body=pg.locator("body").inner_text()
    ok("G5 result title/subtitle", "Weather wise!" in body and "You can read the sky like a pro" in body)
    ok("G5 score line", re.search(r"You predicted \d+ weather effects", body) is not None)
    ok("sticker collection grid of 6", pg.get_by_role("heading", name="Weather sticker collection").locator("xpath=ancestor::section[1]").locator("li").count()==6)
    ok("rainbow hero under the mascot", pg.locator("svg path[stroke='#f7a8c4']").count()>=1)
    ok("finale (not done): Keep going!", "Keep going!" in body and "You finished Learn & Play!" not in body)
    ok("finale badges row has 5", pg.get_by_role("list", name="Your badges").locator("li").count()==5)
    ok("finale: no Back to Home when not done", pg.get_by_role("link", name="Back to Home").count()==0)
    ok("finale: next unfinished game link", pg.get_by_role("link", name=re.compile("^Next: Match the Word")).count()==1)
    pg.screenshot(path=SHOTS+"g5_finale_partial.png", full_page=True)
    # ---------- finale, state B: finish games 1 to 4, then game 5 again
    for slug in SLUGS[:4]: play(pg, slug)
    play(pg, 'weather-and-crops', shot=None)
    body=pg.locator("body").inner_text()
    ok("finale (all done): title + subtitle", "You finished Learn & Play!" in body and "Now you are ready to explore your land" in body)
    ok("finale chips", re.search(r"\+\d+ total points", body) and "5 games done" in body and "Badge: Soil Expert" in body, re.findall(r"\+\d+ total points", body))
    ok("finale: Back to Home + Start Exploring My Land", pg.get_by_role("link", name="Back to Home").count()==1 and pg.get_by_role("link", name="Start Exploring My Land").count()==1)
    ok("finale: Play Again", pg.get_by_role("button", name="Play Again").count()==1)
    ok("finale: pipeline end star", pg.locator("nav[aria-label='Learn & Play progress'] svg.lucide-star").count()>=1)
    pg.screenshot(path=SHOTS+"g5_finale_done.png", full_page=True)
    pg.get_by_role("link", name="Start Exploring My Land").click(); pg.wait_for_url(BASE+"/explore", timeout=5000)
    ok("Start Exploring goes to /explore", pg.url.endswith("/explore"))
    ok("no console errors", not errs, errs[:3])
    b.close()
print(f"\n{sum(res)}/{len(res)} passed"); sys.exit(0 if all(res) else 1)
