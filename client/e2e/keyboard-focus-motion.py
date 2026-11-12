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
ACTIVE="()=>{const e=document.activeElement;return {tag:e.tagName,id:e.id,name:(e.getAttribute('aria-label')||e.innerText||'').trim().slice(0,40),role:e.getAttribute('role')}}"

with sync_playwright() as p:
    b=p.chromium.launch()
    # ---------------- keyboard only
    pg=b.new_context(viewport={"width":430,"height":950}).new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE+"/learn/match-the-word"); pg.get_by_role("group", name="Choose an answer").wait_for(); pg.wait_for_timeout(500)
    seen=[]; reached=False
    for _ in range(40):
        pg.keyboard.press("Tab"); a=pg.evaluate(ACTIVE); seen.append(a['name'])
        if a['tag']=="BUTTON" and a['name'] and pg.evaluate("document.activeElement.closest('[role=group]')?.getAttribute('aria-label')")=="Choose an answer": reached=True; break
    ok("Tab reaches the first answer", reached, seen[-6:])
    ok("skip link is the first stop", seen[0]=="Skip to content", seen[0])
    ok("close button comes before the answers", "Close game" in seen)
    ok("focus ring is visible on the answer", pg.evaluate("parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=2"))
    pg.keyboard.press("Space"); pg.wait_for_timeout(150)
    ok("Space selects the answer", pg.evaluate("document.activeElement.getAttribute('aria-pressed')")=="true")
    for _ in range(6):
        pg.keyboard.press("Tab"); a=pg.evaluate(ACTIVE)
        if a['name'].startswith("Check"): break
    ok("Tab reaches Check", a['name'].startswith("Check"), a['name'])
    t=pg.locator("h1").first.inner_text()
    pg.keyboard.press("Enter") if False else None
    # select the correct one by label with the keyboard instead (Check is enabled once something is chosen)
    pg.keyboard.press("Enter"); pg.wait_for_timeout(900)
    body=pg.locator("body").inner_text()
    focused=pg.evaluate(ACTIVE)
    ok("after Check, focus moves to the banner button", focused['name'] in ("Continue","Try again"), focused)
    if focused['name']=="Try again":
        pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
        ok("Try again by keyboard returns to the question", pg.get_by_role("group", name="Choose an answer").count()==1)
    if focused['name']=="Continue":
        pg.keyboard.press("Enter"); pg.wait_for_function("t=>document.querySelector('h1').innerText!==t", arg=t)
        ok("Continue by keyboard opens the next question", True)
    idx=pg.locator("[role=group] button").evaluate_all("els=>els.findIndex(e=>!e.disabled)")
    pg.keyboard.press(str(idx+1)); pg.wait_for_timeout(100)
    ok("number key selects an enabled answer (disabled ones are ignored)", pg.locator("[role=group] button[aria-pressed=true]").count()==1, idx)
    # ---------------- focus after navigation
    pg2=b.new_context(viewport={"width":430,"height":950}).new_page(); pg2.goto(BASE+"/learn"); pg2.get_by_role("heading", name=re.compile("Match the Word")).wait_for()
    first=pg2.evaluate(ACTIVE); 
    pg2.get_by_role("link", name="Play", exact=True).first.click(); pg2.get_by_role("group", name="Choose an answer").wait_for(); pg2.wait_for_timeout(400)
    ok("after navigating, focus is on the page content (#main)", pg2.evaluate(ACTIVE)['id']=="main", pg2.evaluate(ACTIVE))
    ok("first load does not steal focus", first['tag']=="BODY", first)
    # ---------------- reduced motion
    ctx=b.new_context(viewport={"width":430,"height":950}, reduced_motion="reduce"); pr=ctx.new_page(); perr=[]; pr.on("pageerror", lambda e: perr.append(str(e)))
    pr.goto(BASE+"/learn"); pr.get_by_role("heading", name=re.compile("Match the Word")).wait_for(); pr.wait_for_timeout(500)
    ok("background clouds and leaves are not animated", pr.evaluate("[...document.querySelectorAll('.bg-cloud,.bg-leaf')].every(e=>getComputedStyle(e).animationName==='none')"))
    pr.get_by_role("link", name="Play", exact=True).first.click(); pr.get_by_role("group", name="Choose an answer").wait_for()
    for i in range(5):
        t=pr.locator("h1").first.inner_text(); pr.get_by_role("button", name=re.compile("^"+re.escape(G1[t]))).click()
        pr.get_by_role("button", name=re.compile("^Check")).click(); pr.wait_for_selector("text=Great job!"); pr.get_by_role("button", name="Continue").click()
        if i<4: pr.wait_for_function("t=>document.querySelector('h1').innerText!==t", arg=t)
    pr.wait_for_url(re.compile("/result\\?attempt=")); pr.wait_for_timeout(1200)
    alpha=pr.evaluate("""()=>{const c=document.querySelector('canvas');if(!c)return -1;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let s=0;for(let i=3;i<d.length;i+=4)s+=d[i];return s}""")
    ok("reduced motion: no confetti is drawn", alpha<=0, alpha)
    ok("reduced motion: score screen still complete", pr.get_by_role("img", name=re.compile("of 3 stars")).count()==1 and pr.get_by_role("img", name=re.compile("^Score:")).count()==1)
    ok("no page errors", not errs and not perr, (errs+perr)[:3])
    b.close()
print(f"\n{sum(res)}/{len(res)} passed"); sys.exit(0 if all(res) else 1)
