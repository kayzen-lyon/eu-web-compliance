# Deceptive design

Interfaces that deceive, pressure or manipulate consumers ("dark patterns"): which rules forbid them, and the concrete patterns an agent must not build. Applies to the checkout, sign-up and cancellation flows, pop-ups, newsletters and consent banners alike.

## How to use this file

1. Section 1 says which text applies. For almost every website it is the Unfair Commercial Practices Directive (UCPD). The DSA rule (Article 25) adds to it only for online platforms.
2. Before building any nudge (a timer, a stock counter, an upsell, a "Are you sure?" dialog, a retention offer), check section 3. If the feature matches a pattern, build the honest version given there instead, and tell the owner why.
3. When auditing, report each pattern found with its source. A pattern tied to an Annex I point is unfair in all circumstances; one tied to Articles 5 to 9 is unfair when it is likely to change the average consumer's decision, which is a judgement: report it as "likely non-conformity, to be confirmed by a professional".
4. The examples of the Commission's 2021 guidance (section 4.2.7, Commission Notice 2021/C 526/01) were read on that date; the guidance is not binding, the directive is.

## 1. Which rule applies

- [ ] Every site that addresses consumers: unfair commercial practices are prohibited; a practice is unfair if it is contrary to professional diligence and materially distorts, or is likely to, the economic behaviour of the average consumer [UCPD art. 5]
- [ ] ... misleading actions (false or deceptive information, including by overall presentation, about the product, the price, the trader's commitments or the consumer's rights) [UCPD art. 6]
- [ ] ... misleading omissions (hiding material information or giving it in an unclear, ambiguous or untimely way, or not identifying commercial intent) [UCPD art. 7]
- [ ] ... aggressive practices (harassment, coercion or undue influence that significantly impairs freedom of choice) [UCPD art. 8]
- [ ] ... including onerous or disproportionate non-contractual barriers to exercising contractual rights, such as terminating a contract or switching [UCPD art. 9(d)]
- [ ] The practices listed in Annex I are unfair in all circumstances, without any case-by-case test [UCPD art. 5(5)]
- [ ] Online platforms (that are not micro or small enterprises): the interface must not deceive or manipulate users or otherwise materially distort or impair their ability to make free and informed decisions [DSA art. 25]
- [ ] Article 25 does not apply to practices already covered by Directive 2005/29/EC or by the GDPR: for a shop's checkout, the UCPD rules above remain the reference [DSA art. 25(2)]

Intention is not required. According to the Commission guidance, the UCPD does not require the trader to have meant to deceive, and traders should take appropriate measures so that their interface design does not distort consumers' decisions. For an agent, this means: a pattern copied from a template is still the owner's responsibility.

Consent banners and other data choices are also judged under the GDPR and ePrivacy rules: see [../privacy/consent.md](../privacy/consent.md).

## 2. The test to apply to any nudge

Ask three questions. If any answer is "yes", do not build it as asked.

1. Is anything said or shown false, or true but presented so that it misleads (urgency, scarcity, popularity, price advantage, rights)?
2. Is information the person needs to decide (total price, duration, renewal, cost of extras, absence of withdrawal right) hidden, delayed, or harder to see than the option the trader prefers?
3. Does the design make one choice easier, more prominent or less emotionally costly than the other, in a way that would change what an average person decides?

## 3. Patterns the agent must not build

Each entry: what it is, the source, the honest alternative. "Annex I no. X" points are unfair in all circumstances.

### 3.1 Fake countdowns and false urgency

A timer that resets on reload, a "sale ends in 10:00" that is not true, "only today" on a permanent price.

- [ ] Never state that a product or a price is available for a very limited time when it is not, to push an immediate decision; the guidance names fake timers as an example [UCPD Annex I no. 7]
- [ ] A real deadline is shown as a date and time ("Offer ends 30 November at 23:59 CET"), computed on the server from the real end of the offer, and the same for every visitor [best practice]
- [ ] An animated countdown, if the owner insists on one, can be paused or hidden and is not announced every second by assistive technology (no `aria-live` on the ticking value) [WCAG 2.2.2; RGAA 13.8]

### 3.2 Fake scarcity and fake popularity

"Only 2 left!" when stock is not low, "12 people are looking at this", invented "sold out soon" badges.

- [ ] Stock or demand messages come from real data, computed at render time; the guidance names false limited-stock claims as an example [UCPD Annex I no. 7]
- [ ] Never pass on materially inaccurate information on market conditions or the possibility of finding the product to make the person buy on less favourable terms [UCPD Annex I no. 18]
- [ ] Never offer a product at an advertised price when the trader expects not to be able to supply it, or refuse to sell or show it in order to push another (bait and switch) [UCPD Annex I no. 5]

### 3.3 Hidden costs revealed late (drip pricing)

Service fees, "handling", compulsory insurance or delivery costs that appear only on the payment step.

- [ ] The price shown in an invitation to purchase includes taxes, and delivery and other charges or how they are calculated, unless already apparent from the context [UCPD art. 7(4)(c)]
- [ ] Material information is not given in an untimely manner: costs appear as soon as they can be calculated, not on the last step [UCPD art. 7(2)]
- [ ] The total price is part of the pre-contractual information and of the summary before the order [CRD art. 6(1)(e)]

### 3.4 Pre-ticked add-ons and sneaking into the basket

Insurance, donation, extended warranty or newsletter pre-selected; an item added to the basket without the person choosing it.

- [ ] Every extra payment needs the consumer's express consent; a default option the consumer has to reject gives a right to reimbursement, and the guidance cites pre-ticked boxes for extra services as prohibited [CRD art. 22]
- [ ] Optional extras are offered with both choices equally visible and nothing selected, or as an unchecked checkbox; "No thanks" is not hidden in a list or a smaller link [UCPD art. 6]
- [ ] Marketing consent (newsletter) is never pre-ticked and never bundled with the order [GDPR art. 7(2)]

### 3.5 Confirmshaming and emotional steering

"No, I don't like saving money", "We're sorry to see you go, are you sure you want to lose everything?"

- [ ] The option to decline is worded neutrally ("No thanks", "Cancel my subscription"). The guidance says that using emotion to steer users away from a choice could be an aggressive practice through undue influence [UCPD art. 8]
- [ ] Both choices have the same element type, size and visual weight; one is not a large button while the other is a faint link [best practice]

### 3.6 Trick questions and visual interference

Double negatives ("Uncheck to not receive..."), "Yes" and "No" swapped halfway through a sequence, the option the trader prefers shown big and the other hidden, a long path for one choice and a short one for the other.

- [ ] Questions are worded positively, one decision per control, with the same order of "Yes" and "No" throughout; the guidance gives swapped buttons and double negatives as misleading practices [UCPD art. 6]
- [ ] Information is not visually obscured or ordered to promote one option; the guidance treats this as a likely misleading action or omission [UCPD art. 7]

### 3.7 Roach motel: easy to get in, hard to get out

Subscribing in one click, cancelling only by phone, by letter, after several "retention" screens, or through a link hidden in the account settings.

- [ ] Cancelling a subscription or exercising a contractual right is not made harder by non-contractual barriers (extra steps, mandatory call, survey, repeated retention offers) [UCPD art. 9(d)]
- [ ] Unsubscribing is as easy as subscribing, through the same channel; this is the Commission guidance's principle, given with a cancellation example that combines confirmshaming and visual interference [UCPD art. 7]
- [ ] Online platforms: the Commission may issue guidelines on making termination harder than subscribing; none were read by this skill [DSA art. 25(3)(c)]
- [ ] The withdrawal function of a purchase follows its own rules: [withdrawal-function.md](withdrawal-function.md) [CRD 11a]

The honest version: a "Cancel subscription" link in the account and in the footer, one confirmation screen that states the end date, a single button "Cancel my subscription", an email confirmation. One optional retention offer, if the owner wants one, is shown on that screen without blocking the button.

### 3.8 Nagging

A pop-up asking again on every page for something the person already refused (notifications, app install, newsletter, rating).

- [ ] Do not ask again for a choice already made; the guidance says repeated intrusions to get the consumer to accept something could amount to persistent and unwanted solicitation [UCPD Annex I no. 26]
- [ ] Online platforms: repeatedly requesting a choice already made, notably with pop-ups, is one of the practices the Commission may address in DSA guidelines [DSA art. 25(3)(b)]
- [ ] A refusal is remembered (for the session at least, and for a period the owner sets) [best practice]

### 3.9 Disguised advertising and fake reviews

Sponsored content styled as editorial, paid results presented as organic, invented testimonials.

- [ ] Paid editorial content says it is advertising, in the content or by clearly identifiable images or sounds (advertorial) [UCPD Annex I no. 11]
- [ ] Search results do not hide paid placement or payment for higher ranking [UCPD Annex I no. 11a]
- [ ] Commercial communications are clearly identifiable as such, with the person on whose behalf they are made [ECD art. 6]
- [ ] Never write, generate or commission fake consumer reviews or endorsements, and never misrepresent reviews (for example by showing only positive ones as if they were all) [UCPD Annex I no. 23c]
- [ ] Do not claim that reviews come from real buyers or users unless reasonable and proportionate checks are in place; where the site shows reviews, it says whether and how it checks them [UCPD art. 7(6)]
- [ ] Online platforms: each advertisement shows, in real time, that it is an advertisement, on whose behalf it is presented, who paid, and the main targeting parameters [DSA art. 26]

The agent never generates sample reviews, ratings or testimonials on a live site, even as placeholders. Placeholder reviews that are published become fake reviews.

### 3.10 Other Annex I points that appear in web interfaces

- [ ] "Free", "gratis" or "without charge" only when nothing is due beyond the unavoidable costs of responding and delivery [UCPD Annex I no. 20]
- [ ] No false impression that the person has won a prize, or that claiming it is free when it costs money [UCPD Annex I no. 31]
- [ ] No trust mark, quality label or code-of-conduct badge without authorisation or membership [UCPD Annex I no. 2]
- [ ] Rights the consumer has by law (withdrawal, legal guarantee) are not presented as a special feature of the offer [UCPD Annex I no. 10]
- [ ] No direct exhortation to children to buy, or to ask adults to buy for them [UCPD Annex I no. 28]

## 4. Patterns without a primary source

The following are commonly listed as dark patterns but this skill has found no specific provision naming them. Avoid them as good practice; report them as `[best practice]`, never as a legal breach.

- [ ] Default focus or keyboard shortcut placed on the option the trader prefers in a decision dialog [best practice]
- [ ] Infinite scroll or autoplay of the next item used to prolong use, with no way to stop it [best practice]
- [ ] Forced account creation before checkout when guest checkout would be possible [best practice]
- [ ] "Disguised close": a close icon that opens an offer instead of closing [best practice]

## 5. Accessibility makes some patterns worse

People using screen readers, magnification or cognitive aids are more exposed to these designs: a visually de-emphasised "No thanks" link may be unreachable at 400 % zoom; a timer read aloud every second is unusable; a hidden cost in a tooltip is missed by keyboard users. The UCPD assesses practices that target a vulnerable group from the point of view of an average member of that group [UCPD art. 5(3)]. Building the honest version above also removes these barriers.

## 6. Review checklist

- [ ] No countdown or stock claim that is not true [UCPD Annex I no. 7]
- [ ] All costs visible before the last step [UCPD art. 7(4)(c)]
- [ ] No pre-selected paid option [CRD art. 22]
- [ ] Decline options worded neutrally and given equal visual weight [UCPD art. 8]
- [ ] Cancellation as easy as subscription [UCPD art. 9(d)]
- [ ] No repeated prompts for a choice already made [UCPD Annex I no. 26]
- [ ] Advertising and paid ranking identified; no fake reviews [UCPD Annex I no. 23c]
