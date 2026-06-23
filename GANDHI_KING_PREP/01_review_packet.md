# Gandhi-King Center for Nonviolence — Migration Review Packet

Drafted 2026-06-03 morning by CC for Terry. Read between calls and mark up.

---

## 1. Scope decisions — LOCKED 2026-06-03

| # | Decision | Locked value |
|---|----------|--------------|
| 1 | Stack base | Greylander-style (Node + Netlify Functions + Supabase, multi-page HTML + Tailwind) |
| 2 | Repo name | `gandhi-king-center` |
| 3 | Domain plan | Staging subdomain `new.gandhi-king-center-for-nonviolence.org` first; board reviews; DNS cutover to live `.org` after approval |
| 4 | Deploy | GitHub push to main → Netlify auto-deploy (same process as Terry's other five sites) |

### 501(c)(3) info — confirmed by IRS Letter 1076, Dec 20, 2024
- **Legal name:** Gandhi-King Center for Nonviolence
- **EIN:** 99-3986935
- **Effective exemption date:** July 18, 2024
- **Classification:** 501(c)(3) **private foundation** (Section 509(a)) — NOT public charity
- **Required filing:** Form 990-PF annually
- **Accounting year-end:** December 31
- **Registered address:** 109 North Main Street, Suite 1206, Dayton, OH 45402-1294

**Donor-facing language (locked) for the donate page footer — uses IRS classification verbatim:**
> Gandhi-King Center for Nonviolence is a 501(c)(3) private foundation. EIN 99-3986935. Contributions are tax-deductible to the extent allowed by law.

### Peace Partners — still open
Wix page is an empty "become a partner" template with no actual partners listed. Either we build a real partners gallery (if there are partners in flight) or drop the page entirely until there are.

---

## 2. Full Wix inventory and migration verdict

The Wix sitemap has 24 URLs. The slugs are Wix garbage ("copy-of-*" doesn't mean what you'd think — it's just Wix's auto-naming, and many are the real content pages with confusing names). What actually migrates:

### Keep + migrate (the core site)
| Wix slug | Real content | Migrate as |
|----------|--------------|------------|
| `/` | Home | `/` |
| `/about-1` | Terry's bio | Board page entry (you do NOT lead with this) |
| `/about-5` | Board roster page | `/board` |
| `/about-5-1` | David Ellis bio | Board page entry |
| `/about-5-2` | Tushar Gandhi bio | Board page entry |
| `/about-5-3` | Joel King bio | Board page entry |
| `/about-5-4` | Gregory Foster bio | Board page entry |
| `/about-5-5` | Former Secretary bio (resigned 2026-06; do not migrate) | DROP |
| `/about-5-6` | Brian Polkinghorn bio | Board page entry |
| `/copy-of-carolyn-foster` | **Baroness Harris** (NOT Carolyn — Wix slug is wrong) | Board page entry |
| `/copy-of-mr-gregory-foster` | **Carolyn Foster** (NOT Gregory — Wix slug is wrong) | Board page entry |
| `/copy-of-community-building` | **Education** pillar (Peace 101, Nonviolence365) | `/education` |
| `/copy-of-community-building-1` | **Community Building** pillar (Peace Camp, Season kickoffs) | `/community-building` |
| `/copy-of-outreach` | **Outreach** pillar (Gandhi Legacy Tour, Tushar Chicago talk) | `/outreach` |
| `/general-1` | **Advocacy** pillar (Dayton International Peace Museum) | `/advocacy` |
| `/peace-partners` | Become-a-partner template, no actual partners | `/peace-partners` (rebuild with real partners list when you have one) |
| `/blog` | 3 posts, all by you, all Jan 20 2025 (1 substance + 2 donation appeals) | Keep "The Gandhi-King Relationship," consider dropping the two donation-appeal posts |
| `/donate-2` | PayPal-only donation form (no EIN!) | `/donate` |
| `/donation-thank-you-page` | Post-donation page | `/donate/thanks` |
| `/file-share` | Content truncated; unknown what's there | NEEDS YOUR CALL — see Section 6 |
| `/privacy-policy` | Standard boilerplate | `/privacy` |

### Wix-native features to decide on
| Wix feature | Recommendation |
|---|---|
| **Members** (login system) | Skip unless you actually use it. None of your other ETL surfaces require login for visitors. If kept, this is a Supabase auth build. |
| **Groups** (Wix community forum) | Skip. Discord/Slack does this better if you ever need community. |
| **Gift Card** (Wix Stores) | Skip. Not a nonprofit fit. |
| **Pricing Plans** (Wix subscription) | Skip. You use PayPal donations, not subscriptions. |
| **Events RSVP** | Build later. One event currently active (Feb 20 2025 workshop, already past). |

### Cleanup
- 4 orphan `copy-of-*` pages I haven't reconciled — likely Wix duplicates from edits. Verify nothing important and drop.

---

## 3. The board: real relationships, drafted bios

The Wix bios read like Wix templates ("inspired by his cousin's legacy," "passionate humanitarian"). They lose the actual relationships. Drafted rewrites below use the texture from last night's conversation.

### Dr. Terry Oroszi — CEO, Founder, Chairperson
*Per your stated preference: your name appears here, on the board, alongside the others. Not above them on the homepage.*

**Wix bio (current):** Humanitarian leader and academic, crisis decision-making, nonverbal communication, violent extremism, iWoman Global Award Jury Award 2020, crisis leadership for Afghan women, mentoring Dalit students, Ukraine healthcare initiatives. Vice Chair Dept Pharmacology & Toxicology; founded CBRN Certificate Program at Boonshoft.

**Draft rewrite:** *Pending your edit — I will draft against your preference for understated. Want to write this one yourself, or want me to draft and you edit?*

### Rev. Joel L. King Jr. — President
**Wix bio:** Nearly 40 years in Christian ministry. Cousin of Dr. Martin Luther King Jr. Active on Ohio MLK Holiday Commission since 1985. Chaplain for Gahanna Police. "I firmly believe in the power of faith, love, and nonviolence to transform individuals and communities."

**Draft rewrite:**
> Reverend Joel L. King Jr. is the first cousin of Dr. Martin Luther King Jr. They grew up together, in the same house. Joel does not speak about Dr. King from books. He speaks about him from breakfast.
>
> Forty years in Christian ministry have given Joel a pastor's instincts for nonviolence as a daily practice, not a slogan. He has served on the Ohio Dr. Martin Luther King Jr. Holiday Commission since its founding in 1985, represents Ohio on the National MLK Advisory Committee in Atlanta, and serves as chaplain for the Gahanna Police Department. He carries his cousin's work forward not as inheritance, but as assignment.
>
> *"I firmly believe in the power of faith, love, and nonviolence to transform individuals and communities."*

### Mr. Tushar Gandhi — Global Visionary & Strategic Advisor
**Wix bio:** Great-grandson of Mahatma Gandhi. Author and social activist. Member, Gandhi-King Center.

**Draft rewrite:**
> Tushar Gandhi is the great-grandson of Mahatma Gandhi. After the death of his father Arun Gandhi in 2023, he asked Terry Oroszi to serve as Arun's US representative; together, they committed to reviving the Season for Nonviolence that Arun founded in 1998 with Coretta Scott King's support. The center exists because of that handoff.
>
> An author, social activist, and humanitarian, Tushar leads the annual Gandhi Legacy Tour in India and speaks worldwide on his great-grandfather's philosophy of satyagraha in a polarized century. His scholarship is on his website at tushargandhi.in.

### Mrs. Carolyn Foster — Executive Director
**Wix bio:** Cousin through marriage of Coretta Scott King. 28 years public school system experience supporting children and families. Suicide Crisis Counselor. With husband Gregory, deep faith guides their dedication to social justice and community empowerment.

**Draft rewrite:**
> Carolyn Foster is the Executive Director of the Gandhi-King Center. She is cousin through marriage to Coretta Scott King and has spent twenty-eight years inside the public school system supporting children and families, with additional work as a suicide crisis counselor. Her career has been a long lesson in what it costs people when systems fail them, and what it takes to hold the door open anyway.
>
> She and her husband Gregory share a deep faith and a shared call. *"Everyone has the potential to succeed regardless of their background."*

### Mr. Gregory Foster — Vice Chair
**Wix bio:** Cousin of Coretta Scott King. Social worker. Honored to be a member.

**Draft rewrite:**
> Gregory Foster is the cousin of Coretta Scott King and serves as Vice Chair of the Gandhi-King Center. A career social worker, he has spent his working life inside the agencies that exist for the people other agencies stopped seeing. He came to the center the way most of its board members came: through a relationship that already existed.
>
> *"Everyone has the potential to be a peacemaker, regardless of their background."*

### The Baroness Harris of Richmond DL — Patron
**Wix bio:** Distinguished Member of the House of Lords. Deputy Speaker. Rose through local government to Chair of North Yorkshire County Council. Long service on and Chair of North Yorkshire Police Authority. Elevated to peerage 1999. Spokesperson on policing and Northern Ireland.

**Draft rewrite:**
> Angela, Baroness Harris of Richmond DL is a life peer in the United Kingdom House of Lords, elevated in 1999. As Deputy Speaker and the long-standing Liberal Democrat voice on policing and Northern Ireland, she has spent more than a quarter-century inside the British conversation on public safety and civic accountability. Before the peerage she chaired North Yorkshire County Council and the North Yorkshire Police Authority.
>
> Lady Harris serves as Patron of the Gandhi-King Center for Nonviolence — a relationship rooted in two decades of overlap between her UK policing work and the center's US law enforcement engagement.

### Dr. Brian Polkinghorn — Ambassador
**Wix bio:** Distinguished Professor of Conflict Analysis and Dispute Resolution; Executive Director Bosserman Center for Conflict Resolution; UNU-RCE Salisbury Co-Director. 20+ year history with Mahatma Gandhi's grandson on peace initiatives. 2x Senior Fulbright Scholar, Fulbright Alumni Ambassador, Wilson Elkins Professorship, USM Regent's Award, Maryland Governor's Citation.

**Draft rewrite:**
> Brian Polkinghorn was Arun Gandhi's collaborator for more than twenty years. When Arun died in 2023, Brian carried that thread forward by helping bring his colleague Terry Oroszi into the Gandhi family's American work — the trip to India that Arun could not make is when this center began.
>
> Distinguished Professor of Conflict Analysis and Dispute Resolution at Salisbury University, Executive Director of the Bosserman Center, and Co-Director of UNU-RCE Salisbury USA, Brian has worked in conflict zones in more than thirty countries: Bosnia, Ireland, Haiti, Colombia, the Philippines, South Africa, East Timor, Indonesia, Israel, Palestine, Jordan, Myanmar, Ukraine. He has served as a Fellow at Harvard's Program on Negotiation and a US Presidential Fellow, has been a Senior American Fulbright Scholar twice, and is a US Fulbright Alumni Ambassador.

### Dr. David Ellis — Treasurer
**Wix bio:** Toxicologist at Battelle Memorial Institute, adjunct faculty Boonshoft School of Medicine. Has toured India with Tushar Gandhi. Treasurer for multiple nonprofits.

**Draft rewrite:**
> Dr. David Ellis is the center's Treasurer. A toxicologist by training, he works at Battelle Memorial Institute and teaches at Boonshoft School of Medicine. He has served as treasurer for multiple nonprofits before this one and brings the financial discipline a small humanitarian organization needs to stay accountable.
>
> David traveled with the original India delegation that introduced Terry to the Gandhi family. He has been part of this center from before there was a center.
>
> *"Everyone has the potential to be a peacemaker, regardless of their background."*

### Secretary seat — vacant
Resigned 2026-06. Position to be filled.

---

## 4. The four pillars — current programming on file

### Education
- **Peace 101** at the Dayton International Peace Museum (all ages)
- **Nonviolence365®** training at The King Center (Atlanta)

### Advocacy
- **Dayton International Peace Museum** (founded 2004 after the Dayton Peace Accords; the center's local advocacy anchor)

### Community Building
- **Peace Camp** June 22-26, 2026 (youth-focused, peacebuilding + conflict resolution + empathy) — THIS IS IN 3 WEEKS; the new site should surface registration if it's open
- Season for Nonviolence kickoffs: Chicago 2026, Salisbury University 2025, Dayton International Peace Museum 2024 (three years of proof points)

### Outreach
- **Gandhi Legacy Tour Dec 28, 2026 – Jan 13, 2027** (Tushar-led India immersion; the next big-ticket public engagement)
- Tushar Gandhi at The Lightning Strike, Chicago, Feb 2026 (YouTube exists)
- Earl H. Morris Endowed Lecture, Wright State, 2024 (hometown moment)
- 2023 Gandhi Legacy Tour with academic partners

---

## 5. Season for Nonviolence — the spine

Confirmed canonical facts (Wikipedia + your context):
- **Founded:** 1998 by **Arun Gandhi**, grandson of Mahatma Gandhi
- **Co-founders:** Dr. Michael Beckwith (Agape International Spiritual Center) and Dr. Mary Morrissey
- **Coretta Scott King** supported it at launch; her blessing is the King-family validation of the calendar
- **Dates:** Jan 30 (Mahatma's assassination, 1948) through April 4 (MLK's assassination, 1968) — **64 days**
- **Institutional partners at founding:** Association for Global New Thought + The Parliament of The World's Religions
- **Arun co-chaired until his 2023 death** — the seam Terry stepped into when Tushar asked her to serve as US representative

**This is the homepage spine.** Not the four pillars. Not the board roster. Not the donate button.

**Recommended homepage hero structure:**
1. Title: SEASON FOR NONVIOLENCE 2027 *(or whichever year is upcoming)*
2. Live day counter: "Day N of 64" during the season, "Begins January 30" during off-season
3. One-line statement of what the Season is + Arun-founded provenance
4. Today's act, today's quote, today's commitment (rotating content sourced from a `season-days.json` config)
5. CTA: "Bring the Season to your school / city / congregation"
6. THEN: this year's kickoff event + the four pillars below

---

## 6. Open questions for you (block specific surfaces)

| Question | Why it matters |
|---|---|
| Is GK a registered 501(c)(3)? If yes, what's the EIN? | Needed on donate page for tax-deductible giving + donor trust |
| If not 501(c)(3) yet, what's the fiscal status? | Determines what the donate page can legally say |
| Are there real Peace Partners to list, or is that a future-state page? | Either we build a real partners gallery or we drop the page |
| Is the File Share Wix gated, or public PDFs? Do you actually use it? | If unused, drop. If used, we replicate with simple Netlify static file routes. |
| Should the new site take donations via PayPal only (matching current), or add Stripe / Donorbox so donors can give without a PayPal account? | Affects donate-page build complexity |
| Peace Camp June 22-26 — is registration open NOW? Should the new site link to it before launch, or wait? | Affects timing of staging-vs-cutover |
| Joel voice clone for sermons/prayers — when can he record consent scripts? | Time-sensitive, separate workstream from the migration |

---

## 7. Recommended build sequence (after your three Section 1 decisions land)

1. **Create repo from Greylander template** — bring stack, deploy story, no surprises
2. **Strip Greylander-specific content** to bare scaffold
3. **Homepage with Season for Nonviolence spine** — the load-bearing piece
4. **Board page with all 9 bios** (rewritten from above)
5. **Four pillar pages** (Education / Advocacy / Community Building / Outreach) seeded with current programming
6. **Donate page** with PayPal + (if you say yes) Stripe + the 501(c)(3) info if available
7. **Blog migration** (1 substance post, 2 donation appeals dropped or consolidated)
8. **Privacy + basic legal**
9. **Stage deploy on `new.gandhi-king-center-for-nonviolence.org`** — board reviews
10. **Family approval pass** (especially Joel's bio, Tushar's bio, the Foster bios, Lady Harris's bio)
11. **DNS cutover** to make the new site the live `.org`
12. **Old Wix archived** as a static export, not deleted (for safety)

Voice clone for Joel, the peace newsletter desk, the kids/schools education layer — these all build AFTER the core site is live. Don't slow the launch on them.

---

End of packet. Mark up directly. Open questions in Section 1 + Section 6 unblock the next moves.
