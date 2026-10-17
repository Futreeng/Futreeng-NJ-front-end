"""Generate the local preview pages that don't have hand-built versions.

823 and 825 are hand-built from their live sites (src/preview-823.html, src/preview-825.html).
Every other local is generated here from one template in the same council design system.

Content rule: only real, confirmed facts appear as fact. Everything else is marked
SAMPLE or "to confirm" until the local supplies it. Real so far:
  - Local 819 meetings: Oct 20, Nov 17, Dec 15 2026, 10:00 am and 7:00 pm
  - Orlando Riley, Chairman of the NJ State Council, Local 819

Run:  python3 tools/gen_previews.py   (writes src/preview-<num>.html), then python3 build.py
"""
import html, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'

# The council strip on every preview lists all nine locals in this order.
ALL = [('540', 'Trenton'), ('819', 'Newark'), ('820', 'Union City'), ('821', 'Jersey City'), ('822', 'Plainfield'),
       ('823', 'Ironbound'), ('824', 'New Brunswick'), ('825', 'Oradell'), ('880', 'Camden')]

LOCALS = [
    dict(num='540', city='Trenton', area='Trenton and Mercer County', accent='2F6FB5', color_name='Jersey blue',
         h1=('Capital', 'strong'), eyebrow='Operators strong · Local 540 · Trenton'),
    dict(num='819', city='Newark', area='Newark and Essex County', accent='D7263D', color_name='red',
         h1=('Newark', 'moves'), eyebrow='Operators strong · Local 819 · Newark',
         council_officer=True, meetings=True),
    dict(num='820', city='Union City', area='Union City and Hudson County', accent='0F766E', color_name='teal',
         h1=('Union City', 'union strong'), eyebrow='Operators strong · Local 820 · Union City'),
    dict(num='821', city='Jersey City', area='Jersey City and the Hudson waterfront', accent='E36A2E', color_name='orange',
         h1=('Hudson', 'solid'), eyebrow='Operators strong · Local 821 · Jersey City'),
    dict(num='822', city='Plainfield', area='Plainfield and Central Jersey', accent='23774A', color_name='green',
         h1=('Central Jersey', 'stands'), eyebrow='Operators strong · Local 822 · Plainfield'),
    dict(num='824', city='New Brunswick', area='New Brunswick and Middlesex County', accent='C2185B', color_name='raspberry',
         h1=('Hub City', 'strong'), eyebrow='Operators strong · Local 824 · New Brunswick'),
    dict(num='880', city='Camden', area='Camden and South Jersey', accent='4FA3D9', color_name='sky blue',
         h1=('South Jersey', 'strong'), eyebrow='Operators strong · Local 880 · Camden'),
]


# ---------- color checks (WCAG) ----------
def lum(h):
    r = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    f = lambda v: v / 12.92 if v <= .03928 else ((v + .055) / 1.055) ** 2.4
    return .2126 * f(r[0]) + .7152 * f(r[1]) + .0722 * f(r[2])
def ratio(a, b):
    x, y = lum(a), lum(b)
    return (max(x, y) + .05) / (min(x, y) + .05)
def lighten(h, t):
    return ''.join(f'{round(c + (255 - c) * t):02X}' for c in [int(h[i:i + 2], 16) for i in (0, 2, 4)])

def accent_css(l):
    a = l['accent']
    text = a; k = 0
    while min(ratio(text, '06101F'), ratio(text, '0C1A33')) < 4.6:
        k += .05; text = lighten(a, k)
    css = f"\n/* Local {l['num']} accent ({l['color_name']}) */\n:root{{ --local-accent: #{a}; --local-dark: #{a}; --accent-text: #{text}; }}\n"
    if min(ratio(a, '06101F'), ratio(a, '0C1A33')) < 3.2:
        # Large accent headline text needs 3:1 on navy; dark accents use the lifted text color
        css += ".hero h1 .accent,.hero h1 .dot{color:var(--accent-text)}\n"
    if ratio(a, 'FFFFFF') >= 4.5:
        return css
    assert ratio(a, '06101F') >= 4.5, f"accent {a} fails with white and navy text"
    return css + (f"/* White on {l['color_name']} is {ratio(a, 'FFFFFF'):.1f}:1; use deep navy ({ratio(a, '06101F'):.1f}:1) for text on accent fills */\n"
                  ".logo-mark,.btn-accent,.btn-accent:hover,.sms-btn,.hero-photo .tag,.alert strong,.alert span,.news-tag:not(.advisory):not(.event),"
                  ".sms-footer,.sms-footer strong,.sms-footer span.sub,.cs-local.self,.cs-local.self b,.action-btn.solid,.action-btn:hover,.header-actions .steward{color:var(--navy-deep)}\n"
                  ".sms-footer .sms-btn{background:var(--navy-deep);border-color:var(--navy-deep);color:#fff}\n"
                  ".sms-footer .sms-input{background:rgba(6,16,31,.08);border-color:rgba(6,16,31,.45);color:var(--navy-deep)}\n"
                  ".sms-footer .sms-input::placeholder{color:rgba(6,16,31,.65)}\n")


def strip(self_num):
    out = ['      <a class="cs-local" href="/">◆ Council Hub</a>']
    for n, c in ALL:
        if n == self_num:
            out.append(f'      <span class="cs-local self"><b>{n}</b>{c} · You are here</span>')
        else:
            out.append(f'      <a class="cs-local" href="/preview-{n}/"><b>{n}</b>{c}</a>')
    return '\n'.join(out)


def page(l):
    e = html.escape
    n, city, area = l['num'], l['city'], l['area']
    SAMPLE = '<span class="sample">Sample</span>'
    if l.get('council_officer'):
        officers = '''      <div class="officer">
        <div class="initials" aria-hidden="true">OR</div>
        <div class="officer-text">
          <span class="role">Chairman, NJ State Council</span>
          <span class="name">Orlando Riley</span>
          <span class="where">ATU Local 819 · Newark</span>
        </div>
      </div>
      <div class="officer">
        <div class="initials" aria-hidden="true">P</div>
        <div class="officer-text">
          <span class="role">Local president</span>
          <span class="name">Name to confirm</span>
          <span class="where">ATU Local 819</span>
        </div>
      </div>'''
    else:
        officers = f'''      <div class="officer">
        <div class="initials" aria-hidden="true">P</div>
        <div class="officer-text">
          <span class="role">President</span>
          <span class="name">Name to confirm</span>
          <span class="where">ATU Local {n}</span>
        </div>
      </div>
      <div class="officer">
        <div class="initials" aria-hidden="true">VP</div>
        <div class="officer-text">
          <span class="role">Vice President</span>
          <span class="name">Name to confirm</span>
          <span class="where">ATU Local {n}</span>
        </div>
      </div>'''
    if l.get('meetings'):
        meeting = '''    <div>
      <div class="m-label">Next union meetings</div>
      <div class="m-head">Oct 20 · Nov 17<br>Dec 15, 2026.</div>
      <div class="m-times"><span>10:00 AM</span><span>7:00 PM</span></div>
    </div>
    <div>
      <div class="m-detail-label">Two sessions each day</div>
      <div class="m-detail-val">Come to the one that fits your run</div>
      <div class="m-detail-sub">Location on the notice at your garage · Open to all members</div>
    </div>'''
    else:
        meeting = f'''    <div>
      <div class="m-label">Union meetings {SAMPLE}</div>
      <div class="m-head">Schedule<br>to confirm.</div>
      <div class="m-times"><span>Day and time from the local</span></div>
    </div>
    <div>
      <div class="m-detail-label">Union hall</div>
      <div class="m-detail-val">Address to confirm</div>
      <div class="m-detail-sub">Ask your steward for the next meeting · Open to all members</div>
    </div>'''
    about_extra = ' Local 819 is the home local of Council Chairman Orlando Riley.' if l.get('council_officer') else ''
    h1a, h1b = l['h1']

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#06101F">
<title>Preview · ATU Local {n} in Council Design | NJ Council Hub</title>
<meta name="description" content="Preview mockup of ATU Local {n} ({e(city)}) in the unified NJ State Council design system. Sample content until the local supplies its own.">
<!-- Generated by tools/gen_previews.py. Edit the generator, not this file. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=Public+Sans:wght@400..700&display=swap" rel="stylesheet">
<style>
{(SRC / '_preview_shared.css').read_text(encoding='utf-8').rstrip()}
{accent_css(l)}</style>
</head>
<body>

<!-- Preview ribbon -->
<div class="preview-ribbon" role="banner">
  ◆ Preview · <b>What Local {n} would look like in the unified council design system.</b>
  Sample content until the local supplies its own. <a href="/">Back to the Council Hub →</a>
</div>

<!-- Top bar: council affiliation + local info -->
<div class="topbar">
  <div class="wrap">
    <div class="topbar-left">
      <span><span class="dot" aria-hidden="true"></span> ATU New Jersey State Council</span>
      <span>·</span>
      <span>Local {n} · {e(city)}, NJ</span>
    </div>
    <div class="topbar-right">
      <span>Member Login</span>
      <span>·</span>
      <span>☎ Hall phone to confirm</span>
    </div>
  </div>
</div>

<!-- Urgent council alerts land here (see /council-feed.js) -->
<div id="council-alert"></div>

<!-- Header -->
<header class="header" id="top">
  <div class="wrap">
    <a class="brand" href="#top" aria-label="ATU Local {n} home">
      <span class="logo-mark" aria-hidden="true">ATU</span>
      <span class="brand-name">
        <span class="eyebrow-txt">Amalgamated Transit Union</span>
        <strong>Local {n}</strong>
        <span class="tag">{e(city)} · New Jersey</span>
      </span>
    </a>
    <nav class="nav" aria-label="Main">
      <a href="#about">Home</a>
      <a href="#news">News</a>
      <a href="#tools">Pick Schedules</a>
      <a href="#tools">Routes</a>
      <a href="#about">Officers</a>
      <a href="#tools">Resources</a>
    </nav>
    <div class="header-actions">
      <button type="button" class="signin">Sign in</button>
      <a class="steward" href="#about">☎ Call a steward</a>
    </div>
  </div>
</header>

<main>

<!-- Hero -->
<section class="hero" aria-labelledby="hero-title">
  <div class="hero-copy">
    <div class="eyebrow">{e(l['eyebrow'])}</div>
    <h1 id="hero-title">{e(h1a)}<br><span class="accent">{e(h1b)}<span class="dot">.</span></span></h1>
    <p>The voice of NJ Transit bus workers in {e(area)}. Contracts won at the table. Solidarity built behind the wheel.</p>
    <div class="hero-actions">
      <a class="btn btn-accent" href="#tools">Read the contract →</a>
      <a class="btn btn-ghost" href="#tools">File a grievance</a>
    </div>
    <form class="sms-card" onsubmit="return smsSubmit(event)">
      <span class="sms-eyebrow">◆ Join the {n} alert line <span class="sample" style="margin-left:6px">Sample</span></span>
      <span class="sms-title">When the garage needs you, we text you.</span>
      <span class="sms-sub">Pick notices, safety alerts, meeting reminders, strike votes. Phone number only. We never share it.</span>
      <div class="sms-form">
        <input class="sms-input" type="tel" placeholder="(555) 555-5555" inputmode="tel" autocomplete="tel" aria-label="Phone number">
        <button class="sms-btn" type="submit">Sign up</button>
      </div>
      <span class="sms-note">Standard message rates may apply · Reply STOP to opt out</span>
    </form>
  </div>
  <div class="hero-photo stripes" role="img" aria-label="Photo placeholder: Local {n} members">
    <div class="ph">
      <span class="ph-label">Photo placeholder</span>
      <span class="ph-title">Hero photo</span>
      <span class="ph-text">Local {n} members at their garage. Replace with a photo supplied by the local.</span>
    </div>
    <div class="tag">An injury to one · An injury to all</div>
  </div>
</section>

<!-- Alert band -->
<div class="alert">
  <div class="wrap">
    <div>
      <strong>Assaulted or threatened on your route?</strong>
      <span>Report it now. Your union has your back.</span>
    </div>
    <a class="btn" href="#about">Report an incident →</a>
  </div>
</div>

<!-- About the local -->
<section class="wrap about" id="about">
  <div>
    <h2 class="eyebrow" style="margin:0">About Local {n}</h2>
    <p class="about-copy">ATU Local {n} represents NJ Transit bus workers in {e(area)}. The local negotiates and enforces the contract, stands with members in discipline and grievances, and sends delegates to the ATU New Jersey State Council.{about_extra} Officer names, garages and hall details below are placeholders until the local confirms them.</p>
    <div class="officer-cards">
{officers}
    </div>
  </div>
  <div class="stats">
    <div class="stat"><div class="num">{n}</div><div class="cap">Local number · chartered by ATU International</div></div>
    <div class="stat"><div class="num">9</div><div class="cap">Locals in the NJ State Council</div></div>
    <div class="stat wide"><div class="wide-title">Serving {e(area)}</div><div class="cap">Affiliated with ATU International and the ATU New Jersey State Council</div></div>
  </div>
</section>

<!-- Meeting banner -->
<section class="meeting">
  <div class="wrap">
{meeting}
    <a class="btn btn-accent" href="#" onclick="event.preventDefault();toast('Would download .ics in the real build')">Add to calendar →</a>
  </div>
</section>

<!-- News -->
<section class="section deep" id="news" aria-labelledby="news-title">
  <div class="wrap">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap">
      <div>
        <div class="eyebrow red">◆ From the hall</div>
        <h2 class="h2" id="news-title">News &amp; advisories</h2>
      </div>
      <a href="#" class="action-btn">All updates →</a>
    </div>
    <div id="council-pinned"></div>
    <div class="news-grid">
      <article class="news-card">
        <div class="news-img"><span class="lab">[ Photo · Pick board at the garage ]</span></div>
        <div class="news-body">
          <div class="news-meta"><span class="news-tag event">Calendar</span><span>Oct 2026</span>{SAMPLE}</div>
          <h3 class="news-title">Next pick: what to know before you bid.</h3>
          <p class="news-excerpt">Pick dates, the seniority list and how to submit your bid. Check the board at your garage and ask your steward if anything looks wrong.</p>
          <div class="news-foot"><b>Local {n}</b><span>Read brief →</span></div>
        </div>
      </article>
      <article class="news-card">
        <div class="news-img"><span class="lab">[ Photo · Operator at the wheel ]</span></div>
        <div class="news-body">
          <div class="news-meta"><span class="news-tag">Safety</span><span>Oct 2026</span>{SAMPLE}</div>
          <h3 class="news-title">Report every assault, every time.</h3>
          <p class="news-excerpt">If you are threatened or assaulted on your route, secure the bus, call it in, and report to your union the same day, even if no one was hurt.</p>
          <div class="news-foot"><b>Local {n}</b><span>Read brief →</span></div>
        </div>
      </article>
      <article class="news-card">
        <div class="news-img"><span class="lab">[ Photo · Members voting ]</span></div>
        <div class="news-body">
          <div class="news-meta"><span class="news-tag advisory">Advisory</span><span>Oct 2026</span>{SAMPLE}</div>
          <h3 class="news-title">Bring your union card to the ratification vote.</h3>
          <p class="news-excerpt">The council posts voting times for every garage. Your steward has the schedule for yours.</p>
          <div class="news-foot"><b>Local {n}</b><span>Read brief →</span></div>
        </div>
      </article>
    </div>
  </div>
</section>

<!-- Garages -->
<section class="section garages" id="garages">
  <div class="wrap">
    <div class="eyebrow">◆ Garages {SAMPLE}</div>
    <h2 class="h2">Find your house.</h2>
    <div class="garage-grid">
      <a class="garage" href="#">
        <div class="g-top"><span>Garage 01</span><span>To confirm</span></div>
        <div class="g-name">Garage name</div>
        <div class="g-addr">Address supplied by the local<br>{e(city)}, NJ</div>
        <div class="g-stats">
          <div class="g-stat"><span class="lbl">Steward</span><span class="val">To confirm</span></div>
          <div class="g-stat"><span class="lbl">Code</span><span class="val">To confirm</span></div>
        </div>
        <span class="g-cta">View picks &amp; board →</span>
      </a>
      <a class="garage" href="#">
        <div class="g-top"><span>Garage 02</span><span>To confirm</span></div>
        <div class="g-name">Garage name</div>
        <div class="g-addr">Address supplied by the local<br>New Jersey</div>
        <div class="g-stats">
          <div class="g-stat"><span class="lbl">Steward</span><span class="val">To confirm</span></div>
          <div class="g-stat"><span class="lbl">Code</span><span class="val">To confirm</span></div>
        </div>
        <span class="g-cta">View picks &amp; board →</span>
      </a>
    </div>
  </div>
</section>

<!-- Member tools -->
<section class="section deep" id="tools">
  <div class="wrap">
    <div class="eyebrow">◆ Member tools</div>
    <h2 class="h2">What you need.</h2>
    <div class="tools-grid">
      <a class="tool-card" href="#">
        <span class="tool-num">01</span>
        <span class="tool-title">Pick<br>Schedules</span>
        <span class="tool-desc">Current and upcoming pick rounds, by garage.</span>
        <div class="tool-foot"><span>Each pick</span><span>→</span></div>
      </a>
      <a class="tool-card" href="#">
        <span class="tool-num">02</span>
        <span class="tool-title">Route<br>Descriptions</span>
        <span class="tool-desc">Every line in writing: landmarks, pull-ins, layovers.</span>
        <div class="tool-foot"><span>By route</span><span>→</span></div>
      </a>
      <a class="tool-card" href="#">
        <span class="tool-num">03</span>
        <span class="tool-title">Officers &amp;<br>Stewards</span>
        <span class="tool-desc">Who to call, when to call them. Direct lines.</span>
        <div class="tool-foot"><span>Contacts</span><span>→</span></div>
      </a>
      <a class="tool-card" href="#">
        <span class="tool-num">04</span>
        <span class="tool-title">Forms &amp;<br>Contract</span>
        <span class="tool-desc">CBA, grievance forms, ATU constitution.</span>
        <div class="tool-foot"><span>PDF library</span><span>→</span></div>
      </a>
    </div>
  </div>
</section>

</main>

<!-- SMS footer -->
<section class="sms-footer">
  <div class="wrap">
    <div>
      <strong>Join the Local {n} alert line. <span class="sample" style="vertical-align:middle">Sample</span></strong>
      <span class="sub">The hall texts you when it matters. Phone number only. We never share it. Reply STOP any time.</span>
    </div>
    <form class="sms-form" onsubmit="return smsSubmit(event)">
      <input class="sms-input" type="tel" placeholder="(555) 555-5555" inputmode="tel" autocomplete="tel" aria-label="Phone number">
      <button class="sms-btn" type="submit">Join the line</button>
    </form>
  </div>
</section>

<!-- Member benefits & partners: each local manages its own list; statewide council partners show in a row (see /council-feed.js) -->
<section class="partners-mount" id="partners" aria-label="Member benefits and partners"></section>

<!-- Council strip -->
<section class="council-strip" aria-label="NJ State Council locals">
  <div class="wrap">
    <div class="cs-label">◆ Part of the <b>ATU New Jersey State Council</b> · 9 locals · nearly 10,000 operators</div>
    <div class="cs-locals">
{strip(n)}
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="footer">
  <div class="wrap">
    <div>
      <div class="footer-brand">
        <div class="seal">ATU<br>{n}</div>
        <div class="footer-brand-txt">
          <span class="footer-brand-name">ATU Local {n}</span>
          <span class="footer-brand-sub">{e(city)} · New Jersey</span>
        </div>
      </div>
      <p class="footer-tag">The voice of NJ Transit bus workers in {e(area)}. Contracts won at the table. Solidarity built behind the wheel.</p>
    </div>
    <div>
      <h3>The Local</h3>
      <ul>
        <li><a href="#news">News &amp; Advisories</a></li>
        <li><a href="#about">Officers</a></li>
        <li><a href="#about">Union Meetings</a></li>
        <li><a href="#">Member Portal</a></li>
      </ul>
    </div>
    <div>
      <h3>Member Tools</h3>
      <ul>
        <li><a href="#tools">Pick Schedules</a></li>
        <li><a href="#tools">Route Descriptions</a></li>
        <li><a href="#tools">Forms &amp; Contract</a></li>
        <li><a href="#tools">File a Grievance</a></li>
      </ul>
    </div>
    <div>
      <h3>Visit the Hall</h3>
      <ul>
        <li>Hall address to confirm</li>
        <li>Phone to confirm</li>
        <li><a href="https://www.atu.org" target="_blank" rel="noopener">atu.org ↗</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2026 Amalgamated Transit Union Local {n} · Preview Mockup</span>
    <span>Solidarity Forever.</span>
  </div>
</footer>

<div class="toast" id="toast" role="status" aria-live="polite" style="position:fixed;left:50%;bottom:24px;transform:translate(-50%,20px);opacity:0;pointer-events:none;background:var(--ink);color:var(--navy);font-family:var(--body);font-size:15px;padding:12px 18px;box-shadow:0 8px 30px rgba(0,0,0,.4);transition:opacity .2s,transform .2s;z-index:50;max-width:calc(100% - 32px)"></div>

<script>
let toastTimer;
function toast(msg){{
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.opacity = '1';
  el.style.transform = 'translate(-50%,0)';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {{ el.style.opacity = '0'; el.style.transform = 'translate(-50%,20px)'; }}, 2600);
}}
function smsSubmit(ev){{
  ev.preventDefault();
  const form = ev.target;
  const input = form.querySelector('.sms-input');
  const val = (input.value || '').replace(/\\D/g, '');
  if (val.length < 10){{ toast('Enter a 10-digit phone number.'); input.focus(); return false; }}
  input.value = '';
  toast('Thanks - in the real build, you would get a one-time confirmation text.');
  return false;
}}
</script>
<script src="/council-feed.js"></script>
<script>CouncilFeed.mountLocal('{n}', {{ alert: '#council-alert', pinned: '#council-pinned', grid: '.news-grid' }}); CouncilFeed.mountPartners('#partners', '{n}');</script>
</body>
</html>
'''


def relink_strip(path, self_num):
    """Hand-built previews (823, 825): rewrite their council strip so every local links to its preview."""
    s = path.read_text(encoding='utf-8')
    a = s.index('<div class="cs-locals">') + len('<div class="cs-locals">\n')
    b = s.index('    </div>', a)
    path.write_text(s[:a] + strip(self_num) + '\n' + s[b:], encoding='utf-8')


if __name__ == '__main__':
    for l in LOCALS:
        out = page(l)
        assert '—' not in out, f"em dash in preview-{l['num']}"
        (SRC / f"preview-{l['num']}.html").write_text(out, encoding='utf-8')
        print('wrote', f"src/preview-{l['num']}.html")
    for n in ('823', '825'):
        relink_strip(SRC / f'preview-{n}.html', n)
        print('relinked council strip in', f'src/preview-{n}.html')
