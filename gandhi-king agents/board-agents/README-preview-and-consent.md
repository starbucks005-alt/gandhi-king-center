# Board-member agent previews — approach, consent, and control

Private previews so Rev. Joel King, Gregory Foster, and Carolyn Foster could SEE and HEAR what
"being an AI agent" would mean before they decided. **Update, 2026-08-23: all three gave their
explicit yes.** Joel's own message: "Yes, Joel approved. Thank you!" Gregory's, for all three:
"You have the thumbs up from all of us to go live." Their three agents are now live and public at
`/joel-king`, `/gregory-foster`, and `/carolyn-foster`, linked from `/board`. The consent process
below is preserved as-written since it is exactly what earned that yes, and it still governs
anything that changes about their agents going forward (a script change, a new voice recording,
etc. still needs their sign-off, same as the first launch did). Baroness Harris and Tushar Gandhi
have not been asked yet and remain unlisted/preview-only. Per Dr. Oroszi's original sequencing,
that ask was always meant to come after Joel/Gregory/Carolyn's own launch, which has now
happened — see `project-king-family-agents` memory for the full plan.

## The idea (consent-forward)

Build an unlisted preview page for each of them, drawn only from what they have already
published on the Gandhi-King Center board page. At Friday's meeting they can interact with
their own preview, hear a stand-in voice, and decide for themselves. The preview is a
conversation starter, not a commitment.

Tushar Gandhi is also a board member. He is in India and rarely makes the meetings, so his
consent is handled asynchronously, on his time, through the relationship. He is not dropped.

## What the preview agent can and cannot do

CAN:
- Greet a visitor warmly and explain the center, the mission, and that person's real role.
- Share the person's own published quote and published biography.
- Point visitors to the Season, the four pillars, programs, and how to get involved.

CANNOT (hard rules, especially for real living people):
- Invent opinions, statements, or quotes. It speaks only from published material.
- Take any political position or comment on anything outside the center's published mission.
- Speak about private life, or claim knowledge the person has not approved.
- Go public. Preview pages are unlisted and noindexed until the person signs off.

## Voice

The preview uses a respectful STAND-IN voice (a near-match), clearly labeled as a placeholder.
Their real agent voice would come only from their own recorded samples or explicit approval.
We never clone a real person's voice without consent. Framing for the meeting: "this is a
near-match so you can feel it; if you say yes, we tune it to you, or record you directly."

### Voice policy, per person (Dr. Oroszi's line — do not cross)

- **Rev. Joel King:** voice may be cloned ONLY after his own yes. **Status:** real ElevenLabs
  voice ID `P31dcm4p9fCpK43qjkKw` captured 2026-08-22 with his recorded consent
  (voice-capture-kit.md); `gk-joel-king.js` / `gk-joel-king-voice.js` built and live since
  2026-08-23, after his explicit approval to launch.
- **Mr. Gregory Foster:** same. **Status:** real ElevenLabs voice ID `HJw10OoM7RieWRX4efTj`
  captured 2026-08-22 with his recorded consent; `gk-gregory-foster.js` /
  `gk-gregory-foster-voice.js` built and live since 2026-08-23, after his explicit approval to
  launch.
- **Mrs. Carolyn Foster:** same. **Status:** real ElevenLabs voice ID `vo2nhpVXv9lZ7y1RwIKK`
  captured 2026-08-22 with her recorded consent; `gk-carolyn-foster.js` /
  `gk-carolyn-foster-voice.js` built and live since 2026-08-23, after her explicit approval to
  launch.
- **The Baroness Harris:** NEVER cloned. Stand-in voice only. If she ever wants her own voice,
  it comes only from a recording she gives with explicit consent. Sitting legislator: strictest.
- **Mr. Tushar Gandhi:** NEVER cloned. Stand-in only. Handled asynchronously; his own voice only
  from a recording he gives with explicit consent.

Anyone building these agents must honor this list exactly. Public availability of a voice is not
permission. The person's yes is.

## The control they keep (use this as the one-pager)

- **Approval:** they approve every line their agent can say. Nothing ships unapproved.
- **No politics, no invented words:** the agent only states published facts and their own quotes.
- **Their voice, their choice:** cloned only after their own recorded consent (Joel, Gregory,
  Carolyn all gave it — see voice-capture-kit.md).
- **Pause or pull, anytime:** one word from them and the agent goes dark, permanently if they wish.
  This still applies now that they are live, not just during the preview stage.
- **Public since their yes:** Joel, Gregory, and Carolyn's agents went public 2026-08-23, after
  each gave explicit approval. Baroness Harris and Tushar Gandhi's would-be agents stay unlisted
  until the same standard is met for them.

## For Code (hosting these agents)

- Joel/Gregory/Carolyn: public pages (`/joel-king`, `/gregory-foster`, `/carolyn-foster`), linked
  from `/board`, indexed normally. Any future board-member agent starts UNLISTED and noindexed
  (robots noindex, not linked in nav) until that person gives the same explicit yes — a direct
  link only, to share for their own review first.
- Wire the concierge from the PREVIEW persona file, with the hard rules above as system limits.
- Real cloned voice only after the person's own recorded consent; a stand-in voice, clearly
  labeled, until then.
- Easy kill switch: a single flag (`ENABLED` at the top of each chat function) that disables the
  agent instantly on redeploy.
