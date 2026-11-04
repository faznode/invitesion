#!/usr/bin/env python3
"""Visitor-style public page reads for competitor profiles (analysis script, not product code).

For each target: robots.txt first (RFC 9309 + D-022: 2xx = rules, 4xx = no rules, 5xx/429/unreachable =
disallow; D-026: a group for a user-initiated AI agent — ChatGPT-User, Claude-User, Perplexity-User or the legacy
Anthropic tokens Claude-Web / anthropic-ai — that disallows the path is an explicit opt-out and stops the origin
before any page request), then the homepage, then at most MAX_FOLLOW same-origin pricing / features / catalog-index pages
linked from it. One request at a time, >= SPACING_S between requests to one origin, no retries, no forms,
no login. A bot challenge or a 401/403/429/503 answer stops every further request to that origin; there is
no fallback client, reader or route (LATEST.md §6).

Demo, preview, sample and customer pages are never followed: a vendor-linked "contoh" page can be a real
customer's event (D-008, S-IDI-003).

The committed output holds facts only (status, sizes, title, lang, price figures, counts, stack hints,
feature-keyword flags, app-store ids, internal path names). Page text goes to the private directory for
the analyst and is never committed.

  python3 -B profile-reads.py targets.tsv --out ../../raw/_discovery/profile-reads-YYYY-MM-DD.jsonl \
      --private-dir "$INVITESION_PRIVATE_DIR/profile-reads"
targets.tsv: "code<TAB>name<TAB>homepage-url[<TAB>extra-url ...]" (extra URLs are read as given, same rules).
"""
import argparse, html, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request, urllib.robotparser
from datetime import datetime, timezone

UA = "Mozilla/5.0 (Linux; Android 14; SM-A356E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36"
SPACING_S = 3.0
MAX_FOLLOW = 2
MAX_BYTES = 3_000_000

CHALLENGE = re.compile(r"cf-chl|challenge-platform|Just a moment\.\.\.|Attention Required|px-captcha|_Incapsula_|"
                       r"g-recaptcha|hcaptcha|captcha-delivery|Access denied", re.I)
FOLLOW_OK = re.compile(r"harga|pricing|price|plans?\b|paket|biaya|fitur|features?|how-it-works|cara-kerja|"
                       r"tema\b|themes?\b|templates?\b|katalog|catalog|designs?\b|layanan|services?", re.I)
FOLLOW_NEVER = re.compile(r"preview|contoh|demo|sample|/i/|/u/|/s/|/invitation/|/undangan/[^/]+/|login|masuk|"
                          r"daftar|register|signup|sign-up|checkout|cart|account|akun|blog|artikel|article|"
                          r"\?|#|\.(pdf|jpg|png|webp|zip)$", re.I)
PRICE = re.compile(r"(?:Rp\.?\s?|IDR\s?)\d{1,3}(?:[.,]\d{3})+|(?:US\$|\$)\s?\d+(?:[.,]\d{2})?|RM\s?\d+(?:\.\d{2})?|"
                   r"₩\s?\d{1,3}(?:,\d{3})+|\d{1,3}(?:,\d{3})+\s?(?:원|KRW)|\d{1,3}(?:[.,]\d{3})+\s?(?:đ|₫|VND)|"
                   r"₹\s?\d{1,3}(?:,\d{2,3})+|¥\s?\d+", re.I)
COUNT = re.compile(r"(\d{2,5})\s?\+?\s?(tema|template|desain|designs?|themes?|templat)", re.I)
CLAIM = re.compile(r"(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?\s?(?:rb|ribu|jt|juta|k|K|M|million|juta))\s?\+?\s?"
                   r"(pasangan|pengguna|users?|undangan|invitations?|klien|clients?|customers?|pelanggan|tamu|guests?|acara|events?|couples?)", re.I)
STACK = {
    "wordpress": r"wp-content|wp-includes", "elementor": r"elementor", "next": r"/_next/|__NEXT_DATA__|self\.__next_f",
    "nuxt": r"/_nuxt/|__NUXT__", "laravel": r"laravel_session|XSRF-TOKEN", "livewire": r"livewire", "inertia": r"data-page=\"\{|inertia",
    "react": r"data-reactroot|react-dom", "vue": r"data-v-[0-9a-f]{6}|vue(\.min)?\.js", "angular": r"ng-version",
    "svelte": r"svelte-[a-z0-9]{6}|__sveltekit", "astro": r"astro-island|/_astro/", "gatsby": r"___gatsby",
    "flutter": r"flutter\.js|main\.dart\.js", "webflow": r"webflow", "framer": r"framerusercontent|framer\.com",
    "wix": r"wixstatic|_wixCssImports", "squarespace": r"squarespace", "shopify": r"cdn\.shopify|Shopify\.theme",
    "jquery": r"jquery(\.min)?\.js|jquery-\d", "bootstrap": r"bootstrap(\.min)?\.(css|js)", "tailwind": r"tailwind",
    "alpine": r"alpine(\.min)?\.js|x-data=", "gsap": r"gsap(\.min)?\.js|ScrollTrigger", "aos": r"aos(\.min)?\.(css|js)|data-aos",
    "swiper": r"swiper", "lottie": r"lottie", "three": r"three(\.module)?(\.min)?\.js", "cloudflare": r"cdn-cgi|cloudflare",
    "gtm": r"googletagmanager", "ga4": r"gtag\(|google-analytics", "meta-pixel": r"connect\.facebook\.net|fbq\(",
    "tiktok-pixel": r"analytics\.tiktok\.com", "hotjar": r"hotjar", "clarity": r"clarity\.ms", "intercom": r"intercom",
    "crisp": r"crisp\.chat", "tawk": r"tawk\.to", "onesignal": r"onesignal", "sentry": r"sentry", "segment": r"segment\.(com|io)",
    "midtrans": r"midtrans", "xendit": r"xendit", "doku": r"doku\.com", "tripay": r"tripay", "ipaymu": r"ipaymu",
    "stripe": r"js\.stripe\.com|stripe", "paypal": r"paypal", "kakao": r"kakao", "wechat": r"weixin|wechat",
    "whatsapp-cta": r"wa\.me/|api\.whatsapp\.com",
}
FEATURES = {
    "rsvp": r"\brsvp\b|konfirmasi kehadiran", "qr": r"\bqr\b|qr ?code|kode qr", "check-in": r"check[ -]?in|checkin|buku tamu|guest ?book|guestbook",
    "gift": r"amplop|angpao|angpau|e-gift|kado|hadiah|gift|registry|cash fund", "music": r"musik|music|lagu|backsound",
    "countdown": r"countdown|hitung mundur", "gallery": r"galeri|gallery|foto|photo", "video": r"\bvideo\b",
    "livestream": r"live ?stream", "map": r"google maps|peta|lokasi|map\b", "calendar": r"kalender|calendar|save the date",
    "wishes": r"ucapan|wishes|guestbook comment|doa", "whatsapp": r"whatsapp|\bwa\b", "blast": r"blast|broadcast|kirim massal|bulk send",
    "reseller": r"reseller|mitra|partner|afiliasi|affiliate|white ?label", "custom-domain": r"custom domain|domain sendiri",
    "password": r"password|kata sandi|passcode", "multilang": r"multi ?bahasa|multi-?language|bilingual|dua bahasa",
    "ai": r"\bai\b|artificial intelligence|gpt", "seating": r"seating|denah meja|meja tamu|table assignment",
    "print": r"cetak|print", "app": r"play\.google\.com|apps\.apple\.com|download (the )?app|unduh aplikasi",
    "3d": r"\b3d\b|three\.js", "animation": r"animasi|animation|motion|sinematik|cinematic",
    "free": r"gratis|free|coba dulu|try for free", "subscription": r"berlangganan|subscription|per bulan|/month|monthly|/bulan",
    "one-time": r"sekali bayar|bayar sekali|one-?time|seumur hidup|lifetime|selamanya|forever",
}
TAG_STRIP = re.compile(r"<script\b.*?</script>|<style\b.*?</style>|<noscript\b.*?</noscript>|<svg\b.*?</svg>", re.I | re.S)
PII = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+|\+?62[\s-]?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,5}|\b08\d{8,11}\b")


def now_utc():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Origin:
    """Per-origin state: robots verdict, last request time, challenge stop."""

    def __init__(self, origin):
        self.origin, self.last, self.stopped, self.robots = origin, 0.0, None, None
        self.parser = None

    def wait(self):
        gap = time.monotonic() - self.last
        if gap < SPACING_S:
            time.sleep(SPACING_S - gap)
        self.last = time.monotonic()


def fetch(origin_state, url):
    origin_state.wait()
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
                                               "Accept": "text/html,application/xhtml+xml"})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            body = resp.read(MAX_BYTES)
            return resp.status, resp.geturl(), resp.headers.get("content-type", ""), body
    except urllib.error.HTTPError as e:
        return e.code, url, e.headers.get("content-type", "") if e.headers else "", e.read(200_000) if e.fp else b""
    except Exception as e:  # network error, TLS error, timeout
        return None, url, "", repr(e).encode()[:300]


def robots_check(st):
    if st.robots is not None:
        return
    status, _, ctype, body = fetch(st, st.origin + "/robots.txt")
    text = body.decode("utf-8", "replace") if isinstance(body, bytes) else ""
    if status is None or status == 429 or (status and status >= 500):
        st.robots = f"disallow-all (robots.txt {status or 'unreachable'}, D-022)"
        return
    if 400 <= status < 500:
        st.robots = f"no rules (robots.txt {status})"
        return
    if "html" in ctype.lower() or text.lstrip().lower().startswith(("<!doctype", "<html")):
        st.robots = "no rules (robots.txt answered HTML)"
        return
    st.parser = urllib.robotparser.RobotFileParser()
    st.parser.parse(text.splitlines())
    st.robots = f"rules (robots.txt {status}, {len(text.splitlines())} lines)"
    st.robots_text = text


AI_AGENT_TOKENS = ("chatgpt-user", "claude-user", "perplexity-user", "claude-web", "anthropic-ai")


def ai_agent_optout(robots_text, path):
    """D-026: a group naming a user-initiated AI agent (current or legacy Anthropic token) that disallows the
    path blocks every read by this tool, whatever User-Agent the tool sends. Parsed by hand because
    urllib.robotparser merges groups inconsistently when one group lists several agents."""
    groups, agents, rules, in_rules = [], [], [], False
    for raw in robots_text.splitlines():
        line = raw.split("#", 1)[0].strip()
        if ":" not in line:
            continue
        key, val = (s.strip() for s in line.split(":", 1))
        key = key.lower()
        if key == "user-agent":
            if in_rules:
                groups.append((agents, rules))
                agents, rules, in_rules = [], [], False
            agents.append(val.lower())
        elif key in ("allow", "disallow"):
            in_rules = True
            rules.append((key, val))
    if agents:
        groups.append((agents, rules))
    hits = []
    for agents, rules in groups:
        named = [t for t in AI_AGENT_TOKENS if t in agents]
        if not named:
            continue
        best = ("allow", "")
        for kind, prefix in rules:
            if prefix and path.startswith(prefix) and len(prefix) >= len(best[1]):
                best = (kind, prefix)
        if best[0] == "disallow":
            hits.extend(named)
    return sorted(set(hits))


def allowed(st, url):
    if st.robots.startswith("disallow-all"):
        return False
    if getattr(st, "robots_text", None):
        path = urllib.parse.urlsplit(url).path or "/"
        if ai_agent_optout(st.robots_text, path):
            return False
    return st.parser.can_fetch("*", url) if st.parser else True


def visible_text(page):
    t = TAG_STRIP.sub(" ", page)
    t = re.sub(r"<(br|/p|/div|/li|/h[1-6]|/tr|/section|/header|/footer)\b[^>]*>", "\n", t, flags=re.I)
    t = html.unescape(re.sub(r"<[^>]+>", " ", t))
    t = re.sub(r"[ \t\u00a0]+", " ", t)
    return PII.sub("[pii]", re.sub(r"\n\s*\n+", "\n", t)).strip()


def facts(url, final, page, origin):
    low = page.lower()
    title = re.search(r"<title[^>]*>(.*?)</title>", page, re.I | re.S)
    lang = re.search(r"<html[^>]*\blang=[\"']?([\w-]+)", page, re.I)
    gen = re.search(r"<meta[^>]+name=[\"']generator[\"'][^>]+content=[\"']([^\"']+)", page, re.I)
    text = visible_text(page)
    links = re.findall(r"<a\b[^>]*href=[\"']([^\"'#]+)[\"'][^>]*>(.*?)</a>", page, re.I | re.S)
    internal, follow = [], []
    for href, label in links:
        absu = urllib.parse.urljoin(final, html.unescape(href.strip()))
        parts = urllib.parse.urlsplit(absu)
        if f"{parts.scheme}://{parts.netloc}" != origin:
            continue
        path = parts.path or "/"
        if path not in internal:
            internal.append(path)
        lab = re.sub(r"<[^>]+>", " ", label)
        if (FOLLOW_OK.search(path) or FOLLOW_OK.search(lab)) and not FOLLOW_NEVER.search(path + ("?" if parts.query else "")):
            u = f"{origin}{path}"
            if u not in follow and u.rstrip("/") != final.rstrip("/"):
                follow.append(u)
    apps = sorted(set(re.findall(r"play\.google\.com/store/apps/details\?id=([\w.]+)", page)) |
                  set(re.findall(r"apps\.apple\.com/[\w/-]*?/app/[\w-]*/?(id\d+)", page)))
    return {
        "url": url, "final_url": final, "title": (html.unescape(title.group(1)).strip()[:140] if title else None),
        "lang": lang.group(1) if lang else None, "generator": gen.group(1)[:80] if gen else None,
        "bytes": len(page.encode()), "text_chars": len(text),
        "prices": sorted(set(p.strip() for p in PRICE.findall(text)))[:40],
        "counts": sorted(set(" ".join(c) for c in COUNT.findall(text)))[:12],
        "claims": sorted(set(" ".join(c) for c in CLAIM.findall(text)))[:12],
        "stack": sorted(k for k, rx in STACK.items() if re.search(rx, page, re.I)),
        "features": sorted(k for k, rx in FEATURES.items() if re.search(rx, text, re.I)),
        "app_ids": apps, "internal_paths": internal[:60],
        "api_markers": sorted(set(re.findall(r"(/wp-json/[\w/-]*|/api/[\w/.-]{1,40}|graphql|firebaseio\.com|"
                                             r"supabase\.co|algolia|/_next/data)", page)))[:20],
    }, follow, text


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("targets")
    ap.add_argument("--out", required=True)
    ap.add_argument("--private-dir", required=True)
    ap.add_argument("--no-follow", action="store_true")
    a = ap.parse_args()
    origins = {}
    with open(a.targets, encoding="utf-8") as fh, open(a.out, "a", encoding="utf-8") as out:
        for line in fh:
            if not line.strip() or line.startswith("#"):
                continue
            cols = line.rstrip("\n").split("\t")
            code, name, urls = cols[0], cols[1], cols[2:]
            rec = {"code": code, "name": name, "observed_at_utc": now_utc(), "method": "profile-reads.py (Android UA, plain GET)",
                   "pages": [], "robots": {}}
            queue, seen = list(urls), set()
            followed = 0
            pdir = os.path.join(a.private_dir, code)
            os.makedirs(pdir, exist_ok=True)
            while queue:
                url = queue.pop(0)
                if url in seen:
                    continue
                seen.add(url)
                p = urllib.parse.urlsplit(url)
                origin = f"{p.scheme}://{p.netloc}"
                st = origins.setdefault(origin, Origin(origin))
                if st.stopped:
                    rec["pages"].append({"url": url, "skipped": f"origin stopped: {st.stopped}"})
                    continue
                robots_check(st)
                rec["robots"][origin] = st.robots
                if getattr(st, "robots_text", None) and not os.path.exists(os.path.join(pdir, "robots.txt")):
                    with open(os.path.join(pdir, "robots.txt"), "w", encoding="utf-8") as rf:
                        rf.write(st.robots_text)
                if not allowed(st, url):
                    optout = ai_agent_optout(getattr(st, "robots_text", "") or "", urllib.parse.urlsplit(url).path or "/")
                    reason = (f"robots.txt AI-agent opt-out ({', '.join(optout)}; D-026)" if optout
                              else "robots.txt disallows")
                    rec["pages"].append({"url": url, "skipped": reason})
                    if optout:
                        st.stopped = reason
                    continue
                status, final, ctype, body = fetch(st, url)
                page = body.decode("utf-8", "replace") if isinstance(body, bytes) else ""
                entry = {"url": url, "status": status, "content_type": ctype.split(";")[0] if ctype else None,
                         "at_utc": now_utc()}
                if status is None:
                    entry["error"] = page[:200]
                    rec["pages"].append(entry)
                    continue
                if status in (401, 403, 429, 503) or (status == 200 and CHALLENGE.search(page[:20000]) and len(page) < 60000):
                    st.stopped = f"HTTP {status} / challenge at {url}"
                    entry["blocked"] = "challenge or access block: no further requests to this origin, no fallback"
                    rec["pages"].append(entry)
                    continue
                if "html" not in (ctype or "").lower():
                    rec["pages"].append(entry)
                    continue
                f, follow, text = facts(url, final, page, f"{urllib.parse.urlsplit(final).scheme}://{urllib.parse.urlsplit(final).netloc}")
                entry.update(f)
                rec["pages"].append(entry)
                with open(os.path.join(pdir, f"{len(rec['pages']):02d}.txt"), "w", encoding="utf-8") as pf:
                    pf.write(f"{url}\nstatus {status}\n\n{text}\n")
                if not a.no_follow and url == urls[0]:
                    for u in follow:
                        if followed < MAX_FOLLOW and u not in seen:
                            queue.append(u)
                            followed += 1
            out.write(json.dumps(rec, ensure_ascii=False) + "\n")
            out.flush()
            ok = sum(1 for pg in rec["pages"] if pg.get("status") == 200)
            print(f"{code}: {ok}/{len(rec['pages'])} pages 200; robots {list(rec['robots'].values())}", file=sys.stderr)


if __name__ == "__main__":
    main()
