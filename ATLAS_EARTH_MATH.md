# Atlas Earth — Check the Math

A reference guide for the key metrics, formulas, and calculations that power the Atlas Earth game. Use this to verify your rent earnings, badge strategy, and parcel acquisition decisions.

---

## Table of Contents

- [Parcel Rarity & Rent Values](#parcel-rarity--rent-values)
- [Expected Value Calculation](#expected-value-calculation)
- [Badge System & Passport Levels](#badge-system--passport-levels)
- [Rent Multipliers](#rent-multipliers)
- [Parcel Acquisition Strategy](#parcel-acquisition-strategy)
- [Quick Decision Formulas](#quick-decision-formulas)
- [Boost Levels](#boost-levels)
- [Key References](#key-references)

---

## Parcel Rarity & Rent Values

Every parcel you purchase has a **rarity**, which determines how much rent it generates per second.

| Rarity | Probability | Rent per Second |
|--------|-------------|-----------------|
| **Common** | 50% | $0.0000000011 |
| **Rare** | 30% | $0.0000000016 |
| **Epic** | 15% | $0.0000000022 |
| **Legendary** | 5% | $0.0000000044 |

### Quick Rarity Reference (Simplified Units)

If you want to do hand calculations, use these simplified values:

| Rarity | Simplified Value |
|--------|------------------|
| Common | 0.11 |
| Rare | 0.16 |
| Epic | 0.22 |
| Legendary | 0.44 |

**Example:** If you own 10 common parcels, they generate 0.11 × 10 = 1.1 units of rent.

---

## Expected Value Calculation

When buying a random parcel, you don't know its rarity in advance. The **expected value** tells you the average rent you'll earn.

### Formula

**Expected Value = Σ (Probability × Rent Value)**

```
EV = (0.50 × $0.0000000011) + (0.30 × $0.0000000016) 
     + (0.15 × $0.0000000022) + (0.05 × $0.0000000044)

EV = $0.00000000158 per second
```

**Or using simplified units: 0.158**

This means, on average, each parcel you buy will generate approximately 0.158 units of rent per time period.

---

## Badge System & Passport Levels

Badges come in four rarities (common, rare, epic, legendary) and unlock **passport levels** that multiply all your parcel rent.

### Passport Levels & Requirements

| Level | Badge Range | Minimum to Unlock | Rent Multiplier |
|-------|-------------|-------------------|-----------------|
| **0** | 0 badges | 0 | 1.00× (0% boost) |
| **1** | 1–10 badges | 1 | 1.05× (5% boost) |
| **2** | 11–30 badges | 11 | 1.10× (10% boost) |
| **3** | 31–60 badges | 31 | 1.15× (15% boost) |
| **4** | 61–100 badges | 61 | 1.20× (20% boost) |
| **5** | 101–9,999 badges | 101 | 1.25× (25% boost) |

### Important Notes About Badge Progression

- You must reach the **minimum badge count** to unlock the next level
- Simply having 6 badges does not give you a multiplier—you need 11 to reach Level 2
- Each additional level requires collecting a significant number of new badges
- Badges are typically found through physical exploration or travel
- Level 5 can accommodate up to 9,999 badges (theoretical maximum display)
- The boost percentage refers to the **multiplier applied to all your parcel rent**

---

## Rent Multipliers

Your total rent is calculated by combining **three independent multipliers**:

### Formula

```
Total Rent = Base Parcel Rent × Badge Multiplier × Boost Multiplier
```

**Example:**
- You own 50 common parcels = 0.11 × 50 = 5.5 units base rent
- You have 31 badges (Passport Level 3) = 1.15× multiplier
- Your current boost is 50× 
- **Total Multiplier = 1.15 × 50 = 57.5×**
- **Your rent = 5.5 × 57.5 = 316.25 units**

---

## Atlas Bucks (AB) & Pricing

### Parcel & Badge Costs

| Item | Cost |
|------|------|
| **1 Parcel** | 100 AB |
| **1 Badge** | 200 AB |

### In-App AB Packs

| Price | AB Gained | Cost per AB | Parcels You Can Buy |
|-------|-----------|-------------|-------------------|
| $4.99 | 100 | $0.0499 | 1 parcel |
| $14.99 | 315 | $0.0476 | 3 parcels |
| $39.99 | 900 | $0.0444 | 9 parcels |
| $99.99 | 2,400 | $0.0417 | 24 parcels |

**Best Value:** The $99.99 pack has the lowest cost per AB.

### Rent Withdrawal Rules

- **Minimum withdrawal amount:** $5 USD
- **How it works:** As you earn rent, it accumulates in your account. Once you reach $5 in total earned rent, you can withdraw it.
- **Using rent to buy parcels:** You can also use accrued rent directly to purchase additional parcels instead of withdrawing it.

---

## Parcel Acquisition Strategy

The optimal strategy for maximizing rent over time is well-researched and depends on your parcel count.

### Phase 1: Buy Your First Badge at ~40 Parcels

**The Math:**
- Each new parcel gives you a diminishing % increase in total rent
- At 40 parcels, adding a new parcel gives a 2.5% increase
- The first badge also gives a 2.5% increase (per 100 AB cost)
- Since parcel increases are *always above* 2.5% until 42 parcels, buy parcels first

**Threshold Calculation:**
If your rarity distribution total exceeds **6.32 units**, buy your first badge.

**For Mayors:**
If your total exceeds **5.688 units** (~36 parcels), buy your first badge. (Mayors receive 10% of badge cost back as town income.)

### Phase 2: Buy Parcels Up to 150

Between 40 and 150 parcels:
- Buying additional parcels gives higher rent increases than buying badges
- Each parcel at 149 gives a ~0.67% increase, which beats badges
- Continue acquiring parcels up to exactly 150

### Phase 3: Buy Badges Beyond 150

**Critical Threshold:** 150 parcels is a hard limit for maximizing rent under standard boost conditions.

**Why?**
- Buying your 151st parcel drops you into a lower **boost multiplier tier**
- The boost penalty is so severe that it offsets any parcel rent gains
- Instead, buy badges to increase your parcel multiplier

**Strategy:**
- Stay at 150 parcels and collect badges to reach higher passport levels
- Only buy beyond 150 parcels if you plan to collect 70+ additional parcels simultaneously (to offset the boost penalty)

---

## Quick Decision Formulas

### Should I Buy a Parcel or Badge?

**Calculate the % rent increase for a new parcel:**

```
Parcel % Increase = (Expected Parcel Value / Current Total Parcel Rent) × 100
```

**Then compare to badge % increase:**
- Parcel % increase **higher than badge %** → Buy parcel
- Parcel % increase **lower than badge %** → Buy badge

### Example

You have 40 parcels (6.32 units total) and no badges.

- New parcel: (0.158 / 6.32) × 100 = **2.5%**
- First badge: 2.5% (per 100 AB cost)
- **Result:** Equivalent, but parcel is usually recommended for simplicity

---

## Boost Levels

The boost system rewards geographic diversity and concentration. Your **boost multiplier** depends on your parcel count in a specific area.

### Approximate Boost Multiplier Ranges (USA)

| Parcel Count Range | Typical Boost Multiplier |
|--------------------|-------------------------|
| 1–10 | 0.5–2× |
| 11–50 | 2–10× |
| 51–100 | 10–20× |
| 101–150 | 20–30× |
| 151–500 | 5–20× (penalty tier) |
| 501+ | Scales upward again |

**Key Insight:** There's a dramatic penalty between 150 and 500 parcels, making the 150-parcel threshold strategic.

⚠️ **Note:** Exact boost rates vary by region and game version. Check [Atlas Reality's official boost documentation](https://atlasreality.helpshift.com/hc/en/3-atlas-earth/faq/39-why-do-ad-boosts-change-and-how-do-i-see-my-current-boost-rate/) for your area.

---

## Key Formulas at a Glance

### Rent per Second

```
Rent = (Parcel Count × Expected Value) × Badge Multiplier × Boost Multiplier
```

### Expected Parcel Value (Simplified)

```
EV = (0.11 × 0.50) + (0.16 × 0.30) + (0.22 × 0.15) + (0.44 × 0.05)
   = 0.158
```

### Percent Increase from New Parcel

```
% Increase = (0.158 / Current Total Units) × 100
```

### Percent Increase from Badge Milestone

```
% Increase = ((Base × New Multiplier) - (Base × Old Multiplier)) / (Base × Old Multiplier) × 100
```

### ROI on Badge Cost

```
ROI = (Rent Increase per Second × Seconds Until Parity) / Badge Cost (AB)
```

---

## Strategy Tips & Best Practices

### First Badge Strategy

**Recommended Timing:** Around 40 parcels

- Calculate your total parcel rarity units (common=0.11, rare=0.16, epic=0.22, legendary=0.44)
- If your total exceeds **6.32 units**, purchase your first badge
- **For Mayors:** If your total exceeds **5.688 units** (~36 parcels), buy your first badge. Mayors receive 10% of badge cost back as town income, making the threshold lower.

### Mayor Badge Timing

If you're aiming to become mayor, coordinate your badge purchase with your promotion:
- Become mayor around 40 parcels
- Purchase your first badge while mayor (within the UTC day)
- You'll earn 20 AB back from the badge purchase, offsetting 10% of the cost

### The 150-Parcel Threshold

**Critical Strategy Point:** Never buy your 151st parcel without a plan.

- At 150 parcels, your ad boost multiplier is typically **30×**
- At 151+ parcels, your boost drops to **20×** (a 33% penalty)
- **Instead of buying parcel #151:** Focus on collecting badges to increase your passport level
- **Future growth:** Only buy beyond 150 if you can acquire 70+ parcels simultaneously (to offset the boost penalty)

### Diamonds & Spinning the Wheel

- Collect diamonds whenever you're out and about—they're abundant
- Use diamonds to spin the daily wheel for AB and rewards
- **Free spins:** 3 spins without watching ads
- **Bonus spins:** 2 additional spins available by watching ads (5 spins total per day)
- All 5 spins require a diamond

### Rent Withdrawal Strategy

- Rent accumulates in real-world dollars as you earn
- You can withdraw once you reach **$5 total earned**
- Alternatively, use accrued rent directly to buy parcels (no need to withdraw)
- Consider your play style: quick cash out vs. reinvestment for growth

### Badge Hunting During Travel

- If you're visiting a location you rarely travel to, prioritize collecting badges
- Badges are location-specific and permanent—they're harder to replace than parcels
- Parcels can be purchased anytime with AB, but badges must be physically located

---

**Note:** The mathematics differs slightly outside the USA. Key differences:

- Rent values and expected values may vary
- Boost multiplier thresholds and ranges differ
- Optimal parcel/badge strategy may shift slightly

For Canada and other regions, see [Atlas Earth Guides' regional strategies](https://atlasearthguides.com/resources/).

---

## Helpful Context

### What is an "Atlas Buck" (AB)?

Atlas Bucks are the in-app premium currency. You earn them slowly through daily logins and achievements, or purchase them with real money. They are used to buy:
- **Parcels** — 100 AB each
- **Badges** — 200 AB each
- **Premium features** — Various prices

### What is a "Badge Hunt"?

A badge hunt is when a player travels to a specific location to collect badges for their collection. Badges increase your passport level, which increases rent on all parcels.

### Mayors & Town Badges

If you're the mayor of a town, you earn 10% of all badge purchases in that town as rent. This makes the first badge decision slightly different (threshold becomes 36 parcels instead of 40).

---

## References & Further Reading

**Primary Source:**
- [The Mathematics Behind Badges and Maximizing Rent – Atlas Earth Guides](https://atlasearthguides.com/2023/03/17/the-mathematics-behind-badges-and-maximizing-rent/)

**Other Useful Resources:**
- [Atlas Earth Guides – Badge Optimization Beyond 150 Parcels](https://www.reddit.com/r/AtlasEarthOfficial/comments/1argbe5/new_badge_optimization_strategy_based_on_64hour/)
- [Atlas Earth Official Boost Documentation](https://atlasreality.helpshift.com/hc/en/3-atlas-earth/faq/39-why-do-ad-boosts-change-and-how-do-i-see-my-current-boost-rate/)
- [Atlas Earth Calculators](https://www.aecalc.com/)

**Community:**
- [Official Atlas Earth Subreddit](https://reddit.com/r/AtlasEarthOfficial/)
- [Atlas Earth Discord](https://discord.gg/AtlasEarth)

---

## Disclaimer

This document is based on publicly available information and community research. Game mechanics may change. Always verify calculations with current in-game data. This is an unofficial guide and is not affiliated with Atlas Reality or Atlas Earth.

**Last Updated:** April 2026

---

## Glossary

| Term | Definition |
|------|-----------|
| **Parcel** | A virtual land tile you own in Atlas Earth. Each generates rent. |
| **Rarity** | The quality level of a parcel (common, rare, epic, legendary). Determines rent per second. |
| **Badge** | A collectible item found in specific locations. Increases passport level. |
| **Passport Level** | A tier that multiplies all your parcel rent. Unlocked by collecting badges. |
| **Boost** | A temporary multiplier on rent based on parcel concentration in an area. |
| **Expected Value** | The average rent generated by a random parcel. |
| **Rent** | Virtual income generated by your parcels per second. |
| **AB** | Atlas Bucks, the in-game premium currency. |
| **Mayor** | The player who owns the most parcels in a town. Earns % of town badge sales. |

