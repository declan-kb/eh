# 6996 Koalafied — Technical Binder

A static, zero-dependency website version of the team technical binder, plus a
paged print/PDF version at `print.html`.

**Every image on the site right now is a labelled placeholder.** The layout,
bullets and interactions are real; the CAD renders and photos are not — see
[Images](#images) for what to send me and how.

---

## Running it

**Just open `index.html`.** Double-click it. There is no build step, no `npm
install`, nothing to compile.

If you'd rather serve it (needed if you add anything that fetches files):

```bash
python3 -m http.server 4996
```

Then open <http://localhost:4996>.

---

## Structure

The binder is six mechanical sections, in this order: **Block Model, Intake,
Spindexer & Kicker, Shooter, Turret, Climber**. Spindexer and Kicker share a
section since the kicker sits right at the spindexer's exit, feeding the
shooter — see that section's `media` array in `content.js` for how a section
carries more than one mechanism's worth of Main View + supporting media.
Each section is just:

- a one-line **thesis** (the summary under the title)
- a **feature list** (bullets, with optional sub-bullets)
- a stack of **media components**, chosen from the standard types below

The section's *first* media block (its Main View, or the compare slider for
Block Model) renders beside the feature list, side by side. Anything after
that — a carousel, a version slider — runs full width below. On narrow
screens everything stacks, media first.

**Click any image to enlarge it** against a dimmed backdrop — Main View,
Carousel, Iterations, the hero. Escape, the × button, or clicking the
backdrop closes it; clicking the enlarged image itself doesn't (in case you
want to look longer). The one exception is the Block Model compare slider —
a click there drags the wipe instead, so it isn't click-to-enlarge.

There's no specs table and no software section by design — this pass is
mechanical-only, bullets-and-pictures.

---

## Editing content

**`content.js` is the only file most people need to touch.** It is plain JSON
with one line of JavaScript wrapped around the top — that wrapper is what lets
the site work by double-clicking, with no server. It also has a copy/paste
block near the top (`STANDARD MEDIA COMPONENTS`) with a blank starting point
for each of the four types below.

### Adding a section

Add an object to the `sections` array. Order in the array = order on the page,
and section numbers (01, 02, …) are assigned automatically.

```js
{
  id: "hopper",              // must be unique; becomes the #anchor link
  category: "mechanical",
  title: "Hopper",
  thesis: "One sentence on what it is and why it's built this way.",
  features: [
    { text: "Top-level bullet", children: ["Sub-bullet", "Another sub-bullet"] },
    { text: "Bullet with no children" }
  ],
  media: [ /* see below */ ]
}
```

`features` is optional — use `[]` and the block disappears.

In any text you can write `**bold**` and `` `code` ``.

### The media components

Every section is built from these. Mix any number of them, in any order —
`media` is just a list, and the **first block in the list is the one paired
with Features** (see Structure above). **Every block can take an optional
`label`**, which prints as a small heading above it (e.g. `"Prototyping"`) —
that's how the types stay visually distinct on the page.

**1. Main view** (`highlight`) — the primary image, almost always first in
the list. Give it one view and it's a plain picture; give it two or more and
pill buttons appear to crossfade between them, isolating a sub-system. This
is the "press a button to highlight a part of a mechanism" feature — see
below for how to make the images for it.

```js
{ type: "highlight", label: "Main View", views: [
    { tag: "Full Assembly", src: "…", alt: "…" },
    { tag: "Gearbox",       src: "…", alt: "…" }
]}
```

**2. Carousel** (`carousel`) — Prototyping and Alternate View photos,
combined into one fixed-height strip. As many items show side by side as
fit the width; arrows page the strip sideways when there isn't room for all
of them (and disappear entirely when there's nothing to page). Each item's
`tag` is optional — use it to mark which images are which when you mix
different kinds of photo in one carousel (e.g. `"Alternate View"` vs.
`"Prototyping"`).

```js
{ type: "carousel", label: "Prototyping", items: [
    { tag: "Alternate View", src: "…", alt: "…", caption: "How the gearbox works" },
    { tag: "Prototyping",    src: "…", alt: "…", caption: "Early linkage prototype" }
]}
```

Each item's frame is a **fixed height** (not matched to that photo's aspect
ratio) — on purpose, so a mix of portrait and landscape photos sits flush in
a row instead of resizing every time you page through them.

**3. Version slider** (`iterations`) — a scrubber that steps through
prototype versions, V1 → Vn, with a note per version on what changed and why.

```js
{ type: "iterations", label: "Iterations", versions: [
    { tag: "V1", src: "…", alt: "…", note: "What changed and why." }
]}
```

**4. Compare** (`compare`) — a draggable before/after wipe. Currently used
only by Block Model (block model vs. final CAD).

```js
{ type: "compare", label: "…", caption: "…",
    before: { src: "…", alt: "…", tag: "Before" },
    after:  { src: "…", alt: "…", tag: "After" } }
```

There's also a fifth type, `figures` (a plain wrapping image grid), left over
from an earlier pass — carousel replaced its uses in every current section,
but it still works if a plain grid is ever a better fit than a carousel.

### Hero callouts

`hero.callouts` positions the labelled pins on the robot render. `x` and `y`
are percentages across the hero image (0–100 from the top-left). `side` picks
which column the label sits in. `id` must match a section `id` so the pin
links to it.

To reposition a pin, nudge `x`/`y` and reload — the leader lines redraw
themselves.

Add an `hl` to a callout and it also gets a pill in the "Highlight a system"
row under the hero, same mechanism as a section's Main View — clicking it
crossfades the full-robot image to `hl.src` (same camera, that one system
left solid). Omit `hl` and the callout is just a label with no pill.

```js
{ id: "turret", side: "right", x: 49, y: 36, blurb: "…",
  hl: { src: "assets/img/hero-hl-turret.webp", alt: "…" } }
```

### Team details

`team.robot` is the huge word on the hero. It's currently the team name; swap
it for the robot's name if you give it one. `team.accent` recolours the whole
site — it's the teal sampled from the team logo.

---

## Highlighting a part of a mechanism

The pill buttons on a Main View are the reference site's signature feature.
**All the work is in CAD — the code just crossfades between images.**

Each view is the *same render, from the same camera*, with everything ghosted
to translucent white except the part being highlighted. Because the renderer
draws it, occlusion stays correct: a highlighted gear behind a ghosted plate
still sits behind it. (A transparent-PNG overlay on top of one base image
*doesn't* have this property — a highlighted part behind something would
incorrectly draw in front — which is why this isn't done that way.)

### Exporting the images

For each mechanism, set up the camera once and **do not touch it again** —
every view has to line up pixel for pixel.

1. Render the assembly normally. That's your "Full Assembly" view.
2. Select everything you *don't* want to highlight and set its appearance to
   white at roughly 85–90% transparency. Leave the highlighted parts alone.
3. Render again without moving the camera. That's one highlight view.
4. Undo the transparency, select a different group, repeat.

Export as PNG with a **transparent background** at ~1600px wide. Every view of
one mechanism must be identical in pixel dimensions.

Onshape: right-click → *Edit appearance* → Opacity. SolidWorks: *Appearances*
→ Advanced → Illumination → Transparency. Fusion: *Appearance* → drag a glass
or plastic material on and raise opacity.

### What's needed, section by section

| Section | Main View pills | Carousel items | Other |
|---|---|---|---|
| Block Model | — (compare slider instead) | — | Block Model vs. Final CAD |
| Intake | Full Assembly · Gearbox · Intake | Alternate View (how the gearbox works) · 2× Prototyping | — |
| Spindexer & Kicker | Full Hopper · Spindexer Module | Kicker: 1× Prototyping (integration with spindexer + shooter) | — |
| Shooter | Full Assembly · Rack & Pinion Hood | 2× Prototyping | — |
| Turret | Full Assembly · Limit Switch · Gearbox | 2× Prototyping (254 inspiration + turret on prior robot) | — |
| Climber | Full Assembly · Gearbox · Hook | — | — |

Two or three pills per Main View is plenty — the point is to answer "where is
it?" for a judge who's never seen the robot.

---

## Images

**Every file in `assets/img/` (except `logo.svg`, `logo.png` and
`favicon.png`) is currently a generated placeholder** — a grey or teal box
labelled with the mechanism and view name, so the layout can be judged before
real renders exist. `content.js` already points at the final filenames, so
replacing a placeholder is just overwriting that file — no code or content.js
changes needed as long as the filename stays the same.

- Any format works (`.webp`, `.png`, `.jpg`) — just point `src` at the file if
  you do rename something.
- Export CAD renders **on a white background** (or transparent, for highlight
  views — see above).
- Aim for ~1400–1600px wide. Bigger just slows the page down.
- All views within one Main View or Iterations set should share the same
  pixel dimensions so switching between them doesn't jump the page.

### Full placeholder list

```
hero-robot.webp              hero-hl-shooter.webp         hero-hl-intake.webp
hero-hl-spindexer.webp       hero-hl-climber.webp         hero-hl-turret.webp

block-model.webp             robot-final-cad.webp

intake-full.webp             intake-hl-gearbox.webp       intake-hl-roller.webp
intake-alt-gearbox.webp      intake-proto-1.webp          intake-proto-2.webp

spindexer-full.webp          spindexer-hl-module.webp

kicker-proto-integration.webp

shooter-full.webp            shooter-hl-hood.webp
shooter-proto-1.webp         shooter-proto-2.webp

turret-full.webp             turret-hl-limitswitch.webp   turret-hl-gearbox.webp
turret-proto-254.webp        turret-proto-oldrobot.webp

climber-full.webp            climber-hl-gearbox.webp      climber-hl-hook.webp
```

Send me images (or drop them straight into `assets/img/` yourself, matching
these names) and I'll wire in anything that needs a content.js change too.

---

## Publishing

Any static host works. For GitHub Pages:

1. Push this repo to GitHub.
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `root`.
3. It'll be live at `https://<user>.github.io/<repo>/` in a minute or two.

For a custom domain like the reference site, add a `CNAME` file containing the
domain and point a DNS record at GitHub.

---

## File map

```
index.html            web version
print.html             paged A4 version, has a Print / Save as PDF button
content.js            all content lives here
assets/css/binder.css site styles and design tokens
assets/css/print.css  paper layout
assets/js/binder.js   renders content.js into the page
assets/js/print.js    renders content.js into A4 sheets
assets/img/           images — currently all placeholders (see above)
assets/img/logo.svg   team logo (vector) — nav mark, favicon and print cover
```

`.claude/launch.json` just tells the editor how to start a local server; it
has no effect on the published site.
