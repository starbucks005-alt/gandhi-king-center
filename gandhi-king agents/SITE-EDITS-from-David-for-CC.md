# Gandhi-King Center site — edits before launching the domain

Compiled from David Ellis's notes (6/6 and 6/9). His later corrections are already applied below,
so this is the final list. Target: gandhi-king.netlify.app, before pointing the .org domain.
(Overall: David says the site looks great and very professional. These are the improvements.)

## 1. Fix the Peace Museum link (global)

The Dayton International Peace Museum link is broken. Correct URL:
- **https://www.peace.museum/**

Find every link to the Peace Museum and point it here.

## 2. Education page — add two program links

On the Education page, add links to:
- **Peace 101** at the Peace Museum -> https://www.peace.museum/course-descriptions
- **Nonviolence365** at the King Center -> https://thekingcenter.org/nonviolence365-training/education-training/

## 3. Scott Before King story — rewrite

David finds the current wording a little clumsy. Needs a cleaner pass. (Open copy task — see note at
the bottom; I can draft a tighter version if you paste me the current text or point to the page.)

## 4. Donate page — copy and button

Use this exact wording, in this order.

**Section heading:**
> Donate via PayPal

**Intro paragraph:**
> The Gandhi-King Center for Nonviolence accepts one-time or recurring gifts at any amount. PayPal
> handles processing securely; no PayPal account is required. You may choose which initiative you
> would like to support.

**Contribution callout (David's final version, includes Outreach):**
> Your contribution funds the Education, Advocacy, Outreach and Community-Building initiatives and the
> day-to-day stewardship of two living legacies.

**Fine print under the Donate button:**
> As a 501(c)(3) under US law, the board makes the final decision where gifts are applied; however we
> will make every effort to fulfill your request.

(Note: David corrected this line — it reads "the board makes," not "the board has makes.")

**Initiative selection:** David is configuring an initiative dropdown inside the PayPal hosted button
(so a donor can choose where their gift goes). The site just needs to point at that hosted button; the
old "Avani" option is gone, replaced by the dropdown.

**PayPal button — two options, pick one:**

Option A, official PayPal SDK button:
```html
<div id="donate-button-container">
  <div id="donate-button"></div>
  <script src="https://www.paypalobjects.com/donate/sdk/donate-sdk.js" charset="UTF-8"></script>
  <script>
    PayPal.Donation.Button({
      env:'production',
      hosted_button_id:'YBKJJKLB96VHG',
      image: {
        src:'https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif',
        alt:'Donate with PayPal button',
        title:'PayPal - The safer, easier way to pay online!',
      }
    }).render('#donate-button');
  </script>
</div>
```

Option B, a custom-styled button (recommended for design consistency) that links to:
```
https://www.paypal.com/donate/?hosted_button_id=YBKJJKLB96VHG
```
(Option B lets the button match the site's look while still using the same hosted button and dropdown.)

## 5. Images David provided — place on the site

**Image 1 — "2026 Season for Nonviolence":** Tushar Gandhi speaking at the podium (green kurta) into a
bank of microphones, local press (Channel 9), Sacred Acts / Sacred Democracy partners standing with him.
- Placement: the Season page, or the homepage "Season for Nonviolence" section.
- Suggested caption: "Tushar Gandhi at the 2026 Season for Nonviolence."

**Image 2 — "Feb 2026, Cincinnati, Black History Month":** group photo, two elders seated (Rev. Joel King
and Gregory Foster, per David), surrounded by family and community at a reserved table with white roses.
- Placement: Outreach or Community Building, or an Events / Archive section.
- Suggested caption: "Rev. King and the Fosters in Cincinnati for Black History Month, February 2026."

(These are real event photos cleared by David for site use. Get the FULL-RESOLUTION originals from his
messages — the chat screenshots are low-res. Save them to the site assets and reference from the pages above.)

---

### Open copy task
The only item that still needs new words is the **Scott Before King** rewrite. Everything else above is
final, paste-ready text or code. Point me to the current Scott Before King paragraph and I'll tighten it.
