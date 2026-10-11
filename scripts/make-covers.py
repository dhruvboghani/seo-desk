"""Draws a 1200x630 cover for every guide in content/posts.json.
Writes public/blog/covers/<slug>.webp (shown on the site) and .jpg (for social share previews),
plus the site-wide share image public/og.png and the favicons.
Run after adding guides:  python3 scripts/make-covers.py   (needs Pillow: pip install pillow)"""
import json, os, sys
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Pillow is not installed. Install it once with:\n"
             "  python3 -m pip install --user pillow\n"
             "If that says 'externally-managed-environment' (Homebrew Python), use:\n"
             "  python3 -m pip install --user --break-system-packages pillow\n"
             "Then run: npm run covers")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, 'scripts', 'fonts')
OUT = os.path.join(ROOT, 'public', 'blog', 'covers')
os.makedirs(OUT, exist_ok=True)
F = lambda name, size: ImageFont.truetype(os.path.join(FONTS, name), size)
DISPLAY = 'bricolage-grotesque-latin-800-normal.woff'
DISPLAY_M = 'bricolage-grotesque-latin-500-normal.woff'
BODY = 'geist-sans-latin-500-normal.woff'
BODY_B = 'geist-sans-latin-600-normal.woff'

INK = (11, 18, 32); INK2 = (70, 81, 102); WHITE = (255, 255, 255); MARK = (255, 227, 110)
CATS = {  # soft background, strong accent, label
  'technical': ((233, 238, 255), (36, 72, 245), 'Technical SEO'),
  'on-page':   ((255, 246, 206), (176, 124, 0), 'On-page SEO'),
  'schema':    ((239, 233, 255), (109, 61, 245), 'Schema'),
  'local':     ((226, 245, 235), (11, 143, 90), 'Local SEO'),
  'keywords':  ((255, 233, 228), (211, 64, 42), 'Keyword research'),
  'social':    ((255, 232, 243), (194, 37, 122), 'Social search'),
  'strategy':  ((228, 244, 247), (10, 127, 149), 'Strategy'),
}
S = 2  # draw at 2x, then downsample for smooth edges

def wrap(d, text, font, width):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=font) <= width: cur = t
        else: lines.append(cur); cur = w
    lines.append(cur)
    return lines

def motif(d, cat, acc, x, y, r):
    """Right-hand illustration: a rank dial plus a category glyph."""
    d.ellipse([x - r, y - r, x + r, y + r], outline=WHITE, width=34 * S)
    d.arc([x - r, y - r, x + r, y + r], start=-90, end=150, fill=acc, width=34 * S)
    # glyph inside the dial
    g = r * 0.42
    if cat == 'technical':   # </>
        d.line([(x - g * .35, y - g * .5), (x - g, y), (x - g * .35, y + g * .5)], fill=INK, width=14 * S, joint='curve')
        d.line([(x + g * .35, y - g * .5), (x + g, y), (x + g * .35, y + g * .5)], fill=INK, width=14 * S, joint='curve')
        d.line([(x + g * .15, y - g * .7), (x - g * .15, y + g * .7)], fill=acc, width=14 * S)
    elif cat == 'on-page':   # heading lines
        for i, w in enumerate([1, .7, .85]):
            yy = y - g * .55 + i * g * .55
            d.rounded_rectangle([x - g, yy - 8 * S, x - g + 2 * g * w, yy + 8 * S], radius=8 * S, fill=INK if i == 0 else INK2)
        d.rounded_rectangle([x - g, y - g * .55 - 14 * S, x + g * .2, y - g * .55 + 14 * S], radius=6 * S, outline=None, fill=None)
    elif cat == 'schema':    # { }
        f = F(DISPLAY, int(g * 1.9))
        t = '{ }'; w = d.textlength(t, font=f)
        d.text((x - w / 2, y - g * 1.25), t, font=f, fill=INK)
    elif cat == 'local':     # map pin
        d.ellipse([x - g * .7, y - g * 1.05, x + g * .7, y + g * .35], fill=acc)
        d.polygon([(x - g * .55, y), (x + g * .55, y), (x, y + g * 1.05)], fill=acc)
        d.ellipse([x - g * .28, y - g * .63, x + g * .28, y - g * .07], fill=WHITE)
    elif cat == 'keywords':  # magnifier
        d.ellipse([x - g * .8, y - g * .8, x + g * .4, y + g * .4], outline=INK, width=14 * S)
        d.line([(x + g * .3, y + g * .3), (x + g * .85, y + g * .85)], fill=acc, width=18 * S)
    elif cat == 'social':    # #
        f = F(DISPLAY, int(g * 2.1))
        w = d.textlength('#', font=f)
        d.text((x - w / 2, y - g * 1.35), '#', font=f, fill=INK)
    else:                    # strategy: rising bars
        for i, h in enumerate([.5, .9, 1.4]):
            bx = x - g + i * g * .75
            d.rounded_rectangle([bx, y + g * .7 - g * h, bx + g * .5, y + g * .7], radius=8 * S, fill=acc if i == 2 else INK)

def cover(title, cat, minutes, out_base, kicker=None):
    bg, acc, label = CATS.get(cat, CATS['strategy'])
    W, H = 1200 * S, 630 * S
    im = Image.new('RGB', (W, H), bg); d = ImageDraw.Draw(im)
    # dotted grid
    for gx in range(40 * S, W, 36 * S):
        for gy in range(40 * S, H, 36 * S):
            d.ellipse([gx - 1.6 * S, gy - 1.6 * S, gx + 1.6 * S, gy + 1.6 * S], fill=tuple(max(0, c - 18) for c in bg))
    motif(d, cat, acc, 1000 * S, 300 * S, 175 * S)
    x0 = 72 * S
    # category pill
    pf = F(BODY_B, 24 * S); lab = (kicker or label).upper()
    tw = d.textlength(lab, font=pf) + 1.5 * S * len(lab)
    d.rounded_rectangle([x0, 64 * S, x0 + tw + 40 * S, 112 * S], radius=24 * S, fill=WHITE)
    d.ellipse([x0 + 18 * S, 82 * S, x0 + 30 * S, 94 * S], fill=acc)
    cx = x0 + 40 * S
    for ch in lab:
        d.text((cx, 74 * S), ch, font=pf, fill=INK); cx += d.textlength(ch, font=pf) + 1.5 * S
    # title, shrinking to fit 4 lines
    for size in (70, 64, 58, 52, 48):
        tf = F(DISPLAY, size * S)
        lines = wrap(d, title, tf, 640 * S)
        if len(lines) <= 4: break
    lh = int(size * 1.08 * S)
    ty = 150 * S + (4 - len(lines)) * lh * 0.35
    for i, line in enumerate(lines):
        d.text((x0, ty + i * lh), line, font=tf, fill=INK)
    # footer
    ff = F(BODY, 24 * S)
    d.rounded_rectangle([x0, 540 * S, x0 + 34 * S, 574 * S], radius=9 * S, fill=INK)
    d.arc([x0 + 8 * S, 548 * S, x0 + 26 * S, 566 * S], start=-90, end=170, fill=MARK, width=4 * S)
    foot = 'Rankdesk' + (f'  ·  {minutes} min read' if minutes else '')
    d.text((x0 + 48 * S, 543 * S), foot, font=ff, fill=INK2)
    im = im.resize((1200, 630), Image.LANCZOS)
    im.save(out_base + '.webp', quality=82, method=6)
    im.save(out_base + '.jpg', quality=84, optimize=True, progressive=True)

def favicons():
    def icon(n):
        s = n * 4; i = Image.new('RGBA', (s, s), (0, 0, 0, 0)); g = ImageDraw.Draw(i)
        g.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * .28), fill=INK)
        m = int(s * .23); w = int(s * .12)
        g.ellipse([m, m, s - m, s - m], outline=(42, 53, 80), width=w)
        g.arc([m, m, s - m, s - m], start=-90, end=170, fill=MARK, width=w)
        return i.resize((n, n), Image.LANCZOS)
    pub = os.path.join(ROOT, 'public')
    icon(48).save(os.path.join(pub, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
    icon(180).save(os.path.join(pub, 'apple-touch-icon.png'))
    open(os.path.join(pub, 'favicon.svg'), 'w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#0b1220"/><circle cx="16" cy="16" r="8.5" fill="none" stroke="#2a3550" stroke-width="4"/><path d="M16 7.5a8.5 8.5 0 1 1-8.4 9.8" fill="none" stroke="#ffe36e" stroke-width="4"/></svg>')

if __name__ == '__main__':
    data = json.load(open(os.path.join(ROOT, 'content', 'posts.json')))
    for p in data['posts']:
        cover(p['title'], p['category'], p['minutes'], os.path.join(OUT, p['slug']))
    cover('Free SEO audit and toolkit. Every check, on one desk.', 'technical', 0, os.path.join(ROOT, 'public', 'og'), kicker='Free · No signup')
    Image.open(os.path.join(ROOT, 'public', 'og.jpg')).save(os.path.join(ROOT, 'public', 'og.png'), optimize=True)
    os.remove(os.path.join(ROOT, 'public', 'og.webp')); os.remove(os.path.join(ROOT, 'public', 'og.jpg'))
    favicons()
    print(f"Drew {len(data['posts'])} covers, og.png and favicons")