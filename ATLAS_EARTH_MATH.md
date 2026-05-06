# Atlas Earth — Check the Math

A reference guide for the key metrics, formulas, and calculations that power the Atlas Earth game. Use this to verify your rent earnings, badge strategy, and parcel acquisition decisions.

---

## Table of Contents

- [Parcel Rarity & Rent Values](#parcel-rarity--rent-values)
- [Expected Value Calculation](#expected-value-calculation)
- [Badge System & Passport Levels](#badge-system--passport-levels)
- [Rent Multipliers](#rent-multipliers)
- [Daily Login Bonus](#daily-login-bonus)
- [Atlas Bucks & Pricing](#atlas-bucks--pricing)
- [Premium Subscriptions](#premium-subscriptions)
- [Challenge Reward Ladder](#challenge-reward-ladder)
- [Parcel Acquisition Strategy](#parcel-acquisition-strategy)
- [Quick Decision Formulas](#quick-decision-formulas)
- [Boost Levels](#boost-levels)
- [Strategy Tips & Best Practices](#strategy-tips--best-practices)
- [Daily Spin Wheel & Mini-Games](#daily-spin-wheel--mini-games)
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

## Daily Login Bonus

### Two Tiers: Free vs. Atlas Explorer Club

The game rewards consecutive daily logins with increasing bonuses. There are two pricing tiers:

| Day | Free | Explorer Club | Difference |
|-----|------|---------------|-----------|
| **1–6** | 1 AB | 90 AB | +89 AB |
| **7** | 8 AB | 180 AB | +172 AB |
| **8–13** | 1 AB | 90 AB | +89 AB |
| **14** | 25 AB | 325 AB | +300 AB |
| **15–29** | 1 AB | 90 AB | +89 AB |
| **30** | 50 AB | 500 AB | +450 AB |
| **31–59** | 1 AB | 90 AB | +89 AB |
| **60** | 80 AB | 650 AB | +570 AB |
| **61–89** | 1 AB | 90 AB | +89 AB |
| **90** | 200 AB | 1,200 AB | +1,000 AB |

### 90-Day Cycle Totals

A full 90-day login streak gives you:

| Tier | Total AB | Parcels | % More |
|------|----------|---------|--------|
| **Free** | 391 AB | 3.91 parcels | — |
| **Explorer Club** | 5,375 AB | 53.75 parcels | **1,275% more** |

**Cost of Explorer Club:** Typically $9.99/month or regional equivalent.

**Value Calculation:**
- Free players earn ~391 AB per 90 days = **$0.00 investment**
- Explorer Club members earn ~5,375 AB per 90 days = **$9.99 investment**
- **Net gain:** 4,984 AB extra per 90 days
- **Cost per parcel:** $9.99 ÷ 49.84 parcels = **$0.20 per parcel** (vs. $4.99 for the cheapest pack: $0.0499 per AB)

If you plan to play consistently for 90+ days, the Explorer Club offers strong value if you're already spending on the game.

**Pro Tip:** The biggest bonuses are on **Day 7 (+172 AB difference), Day 14 (+300), Day 30 (+450), and Day 90 (+1,000)**. These bonus days are where Explorer Club pays for itself fastest.

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

**Best Value (In-App):** The $99.99 pack has the lowest cost per AB.

### Web App AB Packs (Better Value!)

The web app offers significantly larger packs with better per-AB pricing:

| Price | AB Gained | Cost per AB | Parcels | Savings vs. In-App |
|-------|-----------|-------------|---------|-------------------|
| $4.99 | 110 | $0.0454 | 1.1 | +10 AB |
| $39.99 | 990 | $0.0404 | 9.9 | +90 AB |
| $99.99 | 2,550 | $0.0392 | 25.5 | +150 AB |
| $199.99 | 5,150 | $0.0388 | 51.5 | +2,750 AB |
| $499.99 | 12,900 | $0.0388 | 129 | +12,500 AB |
| $999.99 | 26,000 | $0.0385 | 260 | +26,000 AB |
| $1,999.00 | 54,000 | $0.0370 | 540 | +54,000 AB |
| $4,999.99 | 140,000 | $0.0357 | 1,400 | +140,000 AB |
| $9,999.99 | 290,000 | $0.0345 | 2,900 | +290,000 AB |

**💡 Pro Tip:** The web app packs are significantly cheaper per AB. For example:
- In-app $99.99 = 2,400 AB ($0.0417 per AB)
- Web app $99.99 = 2,550 AB ($0.0392 per AB) = **6% savings**
- Web app $4,999.99 = 140,000 AB = **57 parcels worth!**

---

## Premium Subscriptions

Atlas Earth offers **two separate subscription tiers**:

### 1. Atlas Explorer Club

**Pricing:**
- Monthly: $49.99/month
- Yearly: $549.99/year (8% discount per year)

**Benefits:**
- Free daily atlas bucks (see [Daily Login Bonus](#daily-login-bonus) section for exact amounts)

**Value Analysis:**
- 90-day cycle = 5,375 AB extra = 53.75 parcels
- Cost: $49.99/month × 3 = $149.97 for 90 days
- Cost per parcel: **$2.79 per parcel** (excellent value)

### 2. Challenges Premium

**Pricing:**
- Monthly: $9.99/month
- Yearly: $109.99/year (8% discount per year)

**Benefits:**
- Premium rewards for completing challenges
- Rewards program starts June 1 (annually)

**Value Analysis:**
- Challenge rewards vary by season
- Cost: $9.99/month
- Best for dedicated players completing many challenges

### Subscription Strategy

**For Casual Players:**
- Skip both subscriptions; rely on free daily login bonus and spin wheel

**For Regular Players:**
- Atlas Explorer Club ($49.99/month) pays for itself quickly (~3 parcels' worth of value per month)

**For Dedicated Players:**
- Consider both subscriptions (~$59.98/month) if you're already spending on AB packs
- Both together are cheaper than buying mid-tier AB packs

---

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

## Challenge Reward Ladder

The **Challenge Reward Ladder** is a seasonal system where you earn rewards by completing challenges during a 90-day season. There are two tiers:

### Free Tier vs. Premium Tier

| Feature | Free | Season Pass Premium |
|---------|------|-------------------|
| **Challenges Needed** | 50 out of 120 | 120 out of 120 |
| **Reward Types** | AB, Diamonds | AB, Diamonds, Badges, Legendary Parcel Upgrades |
| **Cost** | $0 | $9.99/month or $109.99/year |

### Typical Reward Examples (Varies by Season)

**Free Tier Progression:**
- Checkpoint 20: 5 AB (free) / 20 AB (premium)
- Checkpoint 40: 6 diamonds (free) / 25 diamonds (premium)
- Checkpoint 65: 10 AB (free) / 30 AB (premium)

**Premium Tier Progression:**
- Higher AB amounts at each checkpoint
- Diamond rewards increase significantly
- Exclusive rewards: Badges, Legendary Parcel Upgrades
- Final reward tiers often include special items

### Challenge Reward Strategy

**Free Players:**
- Complete challenges to earn ~100+ AB per season
- Get some free diamonds from ladder progression
- No time-gated advantage—all rewards are consistent

**Season Pass Subscribers:**
- Earn 3–5× more rewards than free players
- Get exclusive badges and parcel upgrades
- Season pass cost (~$10/month) breaks even if you earn 100+ AB in premium rewards

**⚠️ Important Notes:**
- **Atlas Bucks are non-transferable** — AB you purchase cannot be traded to other players
- Subscribing to the Season Pass **resets your daily login bonus calendar** (restarts at Day 1)
- Explorer Club membership can be identified by a **compass logo** next to player names
- Season Pass subscriptions have **no visible indicator**—only you can see your own status

---

### Payout Odds

The daily spin wheel offers various rewards. Each spin requires a diamond. Here are the official odds:

| Reward | Odds | Probability |
|--------|------|-------------|
| 1 Diamond | 1 in 16 spins | 6.25% |
| 1 AB | 1 in 2 spins | 50% |
| 2 AB | 1 in 3 spins | 33.33% |
| 6 AB | 1 in 25 spins | 4% |
| 8 AB | 1 in 50 spins | 2% |
| 15 AB | 1 in 100 spins | 1% |
| 50 AB | 1 in 200 spins | 0.5% |

### Expected Value Per Spin

To calculate the average AB you can expect from a single spin:

```
EV = (0.5 × 1) + (0.3333 × 2) + (0.04 × 6) + (0.02 × 8) 
     + (0.01 × 15) + (0.005 × 50) + (0.0625 × 1 Diamond)

EV ≈ 1.57 AB per spin (plus occasional diamonds)
```

**In practice:** Expect approximately **1.5–2 AB per spin** on average, with occasional diamond drops offsetting the diamond cost.

### Spin Strategy

- **Free spins:** 3 spins per day without watching ads (costs 3 diamonds)
- **Bonus spins:** 2 additional spins by watching ads (costs 2 more diamonds)
- **Total:** Up to 5 spins per day (costs 5 diamonds)
- **Diamond collection:** Collect diamonds when you're out and about—they're abundant
- **Expected daily return:** 5 spins × ~1.57 AB = ~7.85 AB per day (before diamond drops)

### Diamond Economy

Since diamonds are abundant when exploring and you get 3 free spins daily, the spin wheel is a reliable source of passive AB income:

- **Daily baseline:** ~1.5–2 AB per day from the 3 free spins
- **With all 5 spins:** ~7.85 AB per day (if diamonds are available)
- **Weekly earnings:** ~55 AB per week (5 spins/day × 7 days)
- **Monthly earnings:** ~240 AB per month (assuming consistent play)

This is equivalent to about **2.4 parcels per month** from spins alone.

---

## Non-USA Variations

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

**Last Updated:** April 2026 (Challenge Reward Ladder, Premium Subscriptions, Web App AB packs, Daily Login Bonus & Daily Spin Wheel odds added)

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

