#!/usr/bin/env python3
"""Rebuilds the category pages, the photo counts on the home pages and sitemap.xml.

Run from anywhere after adding photos to assets/products/<slug>/ (+ thumbs/):
    python3 tools/build_pages.py
"""
import datetime
import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://rosela.gr"
TODAY = datetime.date.today().isoformat()
PHONE_TEXT, PHONE_TEL = "210 3255 394", "+302103255394"
EMAIL = "rozelaklmt@hotmail.com"
ADDRESS = "Καλαμιώτου 12, Αθήνα 10560"
MAPS = "https://maps.google.com/?q=%CE%9A%CE%B1%CE%BB%CE%B1%CE%BC%CE%B9%CF%8E%CF%84%CE%BF%CF%85+12,+%CE%91%CE%B8%CE%AE%CE%BD%CE%B1+10560"

# slug, τίτλος, title tag, εισαγωγικό κείμενο
CATEGORIES = [
    ("karavopana", "Καραβόπανα", "Καραβόπανα στην Αθήνα",
     "Καραβόπανα σε εμπριμέ, φλοράλ και γεωμετρικά σχέδια, κατάλληλα για μαξιλάρια, καλύμματα, ριχτάρια και τραπεζομάντηλα."),
    ("karo-riges", "Καρό - ρίγες", "Υφάσματα καρό & ριγέ στην Αθήνα",
     "Υφάσματα καρό και ριγέ σε πολλούς χρωματισμούς, για κουρτίνες, τραπεζομάντηλα, μαξιλάρια και καλύμματα."),
    ("naftika", "Ναυτικά σχέδια", "Υφάσματα με ναυτικά σχέδια",
     "Υφάσματα με ναυτικά σχέδια — άγκυρες, καράβια, φάροι και θαλασσινά μοτίβα — για εξοχικά, σκάφη και βεράντες."),
    ("kouzines", "Σχέδια για κουζίνες", "Υφάσματα & κουρτίνες κουζίνας",
     "Υφάσματα με σχέδια για την κουζίνα, για κουρτινάκια, τραπεζομάντηλα και καλύμματα."),
    ("adiavroxa", "Αδιάβροχα", "Αδιάβροχα υφάσματα εξωτερικού χώρου",
     "Αδιάβροχα υφάσματα για μαξιλάρια και καλύμματα εξωτερικού χώρου, βεράντες και κήπους."),
    ("lina-gazes", "Λινά - γάζες & διάφανες κουρτίνες", "Λινά, γάζες & διάφανες κουρτίνες",
     "Λινά, γάζες και ημιδιάφανα υφάσματα για κουρτίνες που αφήνουν το φως να περνά."),
    ("adiafanes", "Κουρτίνες αδιάφανες", "Αδιάφανες κουρτίνες στην Αθήνα",
     "Αδιάφανα υφάσματα για κουρτίνες, μονόχρωμα και με σχέδια, για σαλόνι και υπνοδωμάτιο."),
    ("velouda", "Βελούδα", "Βελούδα επίπλωσης & κουρτίνας",
     "Βελούδα σε πλούσια χρώματα για επιπλώσεις, μαξιλάρια και κουρτίνες."),
    ("epiplopana", "Επιπλόπανα - στόφες - μπροκάρ", "Επιπλόπανα, στόφες & μπροκάρ στην Αθήνα",
     "Επιπλόπανα, στόφες και μπροκάρ για καναπέδες, πολυθρόνες, καρέκλες και διακοσμητικά μαξιλάρια."),
    ("monochroma-epiplosis", "Μονόχρωμα για επιπλώσεις", "Μονόχρωμα υφάσματα επίπλωσης",
     "Μονόχρωμα υφάσματα επίπλωσης σε μεγάλη γκάμα αποχρώσεων, για καναπέδες, πολυθρόνες και καλύμματα."),
    ("dermatines", "Δερματίνες", "Δερματίνες επίπλωσης",
     "Δερματίνες για επενδύσεις επίπλων, καρέκλες και καθίσματα."),
    ("roller", "Ρόλερ", "Ρόλερ – ρολοκουρτίνες στην Αθήνα",
     "Ρόλερ σε διάφορα υφάσματα και σχέδια. Αναλαμβάνουμε και την τοποθέτησή τους."),
    ("kourtinoxyla", "Κουρτινόξυλα & σιδηρόδρομοι", "Κουρτινόξυλα & σιδηρόδρομοι κουρτινών",
     "Κουρτινόξυλα και σιδηρόδρομοι για κάθε τύπο κουρτίνας. Αναλαμβάνουμε και την τοποθέτησή τους."),
    ("paidika", "Παιδικά σχέδια", "Παιδικά υφάσματα & κουρτίνες",
     "Υφάσματα με παιδικά σχέδια για κουρτίνες, μαξιλάρια και καλύμματα στο παιδικό δωμάτιο."),
    ("erga", "Κάποιες από τις δουλειές μας", "Κουρτίνες σε σπίτια – δουλειές μας",
     "Κουρτίνες που ράψαμε και τοποθετήσαμε σε σπίτια πελατών μας."),
]

e = lambda s: html.escape(s, quote=True)


def count(slug):
    d = os.path.join(ROOT, "assets", "products", slug)
    n = len([f for f in os.listdir(d) if re.fullmatch(r"\d{3}\.jpg", f)])
    assert all(os.path.exists(os.path.join(d, x, f"{i:03d}.jpg")) for i in range(1, n + 1) for x in ("", "thumbs")), slug
    return n


COUNTS = {c[0]: count(c[0]) for c in CATEGORIES}
COUNTS["katastima"] = count("katastima")

STORE_LD = {
    "@type": "HomeGoodsStore",
    "@id": SITE + "/#store",
    "name": "ROSELA",
    "url": SITE + "/",
    "telephone": PHONE_TEL,
    "address": {"@type": "PostalAddress", "streetAddress": "Καλαμιώτου 12", "addressLocality": "Αθήνα",
                "postalCode": "10560", "addressCountry": "GR"},
}

HEAD_ICONS = """    <link rel="icon" href="/favicon.ico" sizes="48x48">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="manifest" href="/site.webmanifest">
    <meta name="theme-color" content="#11110f">"""


def category_page(slug, title, seo_title, intro):
    n = COUNTS[slug]
    url = f"{SITE}/{slug}/"
    page_title = f"{seo_title} | ROSELA"
    desc = f"{intro} {n} φωτογραφίες από το κατάστημα ROSELA, Καλαμιώτου 12 στο κέντρο της Αθήνας. Τηλ. {PHONE_TEXT}."
    og_image = f"{SITE}/assets/products/{slug}/001.jpg"
    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "CollectionPage", "@id": url, "url": url, "name": page_title, "description": desc,
             "inLanguage": "el", "primaryImageOfPage": og_image, "about": {"@id": SITE + "/#store"}},
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Αρχική", "item": SITE + "/"},
                {"@type": "ListItem", "position": 2, "name": title, "item": url}]},
            STORE_LD,
        ],
    }
    thumbs = "\n".join(
        f'            <a class="folder-thumb" href="../assets/products/{slug}/{i:03d}.jpg">'
        f'<img {"" if i <= 8 else "loading=\"lazy\" "}width="480" height="480" src="../assets/products/{slug}/thumbs/{i:03d}.jpg" '
        f'alt="{e(title)} – φωτογραφία {i} | ROSELA Αθήνα"></a>'
        for i in range(1, n + 1))
    others = "\n".join(
        f'                <li><a href="../{s}/">{e(t)}</a></li>' for s, t, _, _ in CATEGORIES if s != slug)
    return f"""<!DOCTYPE html>
<html lang="el">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{e(page_title)}</title>
    <meta name="description" content="{e(desc)}">
    <link rel="canonical" href="{url}">
{HEAD_ICONS}
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="ROSELA">
    <meta property="og:locale" content="el_GR">
    <meta property="og:url" content="{url}">
    <meta property="og:title" content="{e(page_title)}">
    <meta property="og:description" content="{e(desc)}">
    <meta property="og:image" content="{og_image}">
    <meta name="twitter:card" content="summary_large_image">
    <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="../style.css">
</head>
<body>
    <header class="header">
        <a href="../" class="logo">ROSELA<span class="logo-since">Since 1996</span></a>
        <nav>
            <button class="hamburger" aria-label="Άνοιγμα μενού">☰</button>
            <ul class="nav-links">
                <li><a href="../">Αρχική</a></li>
                <li><a href="../#space">Ο χώρος μας</a></li>
                <li><a href="../#products">Προϊόντα</a></li>
                <li><a href="../#services">Υπηρεσίες</a></li>
                <li><a href="../#contact">Επικοινωνία</a></li>
            </ul>
        </nav>
    </header>

    <main>
    <section class="page-hero">
        <nav class="breadcrumb" aria-label="Breadcrumb"><a href="../">Αρχική</a> / <a href="../#products">Προϊόντα</a> / <span>{e(title)}</span></nav>
        <h1>{e(title)}</h1>
        <p>{e(intro)}</p>
        <p class="page-hero-note">{n} {"φωτογραφία" if n == 1 else "φωτογραφίες"} · Θα τα βρείτε στο κατάστημά μας, {ADDRESS}</p>
    </section>

    <section class="section category-page">
        <div class="folder-grid" data-gallery data-title="{e(title)}">
{thumbs}
        </div>
    </section>

    <section class="section category-contact">
        <div class="section-header">
            <h2>Ελάτε στο κατάστημα</h2>
            <p class="section-desc">ROSELA · {ADDRESS} · Οικογενειακή επιχείρηση από το 1996. Αναλαμβάνουμε ραφή κουρτινών, τραπεζομάντηλων, ριχταριών και μαξιλαριών, καθώς και τοποθέτηση κουρτινών, κουρτινόξυλων και ρόλερ.</p>
        </div>
        <div class="hero-actions category-actions">
            <a href="tel:2103255394" class="btn">Καλέστε {PHONE_TEXT}</a>
            <a href="{MAPS}" target="_blank" rel="noopener" class="btn btn-outline">Οδηγίες στον χάρτη</a>
        </div>
        <nav class="category-links" aria-label="Άλλες κατηγορίες">
            <h2>Δείτε επίσης</h2>
            <ul>
{others}
            </ul>
        </nav>
    </section>
    </main>

    <footer class="footer">
        <div class="footer-bottom">© ROSELA · Since 1996 · {ADDRESS}<span class="made-by">Made by <a href="https://braingroup.tech" target="_blank" rel="noopener">BRAINGROUP</a></span></div>
    </footer>

    <script src="../script.js"></script>
</body>
</html>
"""


def update_home(path, words):
    s = open(path, encoding="utf-8").read()

    def fix(m):
        line, slug = m.group(0), m.group(1)
        n = COUNTS[slug]
        line = re.sub(r'data-count="\d+"', f'data-count="{n}"', line)
        return re.sub(r'(<span class="category-meta">)[^<]*', lambda mm: f"{mm.group(1)}{n} {words[n != 1]}", line)

    s = re.sub(r'<div class="service-item category-card" data-slug="([^"]+)".*', fix, s)
    open(path, "w", encoding="utf-8").write(s)


def sitemap():
    def images(slug, n):
        return "".join(f"<image:image><image:loc>{SITE}/assets/products/{slug}/{i:03d}.jpg</image:loc></image:image>"
                       for i in range(1, n + 1))

    alt = (f'<xhtml:link rel="alternate" hreflang="el" href="{SITE}/"/>'
           f'<xhtml:link rel="alternate" hreflang="en" href="{SITE}/en/"/>'
           f'<xhtml:link rel="alternate" hreflang="x-default" href="{SITE}/"/>')
    rows = [
        f"    <url><loc>{SITE}/</loc><lastmod>{TODAY}</lastmod>{alt}{images('katastima', COUNTS['katastima'])}</url>",
        f"    <url><loc>{SITE}/en/</loc><lastmod>{TODAY}</lastmod>{alt}</url>",
    ]
    rows += [f"    <url><loc>{SITE}/{s}/</loc><lastmod>{TODAY}</lastmod>{images(s, COUNTS[s])}</url>" for s, *_ in CATEGORIES]
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
            'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" '
            'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + "\n".join(rows) + "\n</urlset>\n")


if __name__ == "__main__":
    for slug, title, seo_title, intro in CATEGORIES:
        os.makedirs(os.path.join(ROOT, slug), exist_ok=True)
        open(os.path.join(ROOT, slug, "index.html"), "w", encoding="utf-8").write(category_page(slug, title, seo_title, intro))
    update_home(os.path.join(ROOT, "index.html"), ("φωτογραφία", "φωτογραφίες"))
    update_home(os.path.join(ROOT, "en", "index.html"), ("photo", "photos"))
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(sitemap())
    print("built", len(CATEGORIES), "category pages;", sum(COUNTS.values()), "photos")
