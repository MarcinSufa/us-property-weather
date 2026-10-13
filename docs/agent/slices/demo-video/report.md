# Slice `demo-video`: conductor report

The final message of the subagent that recorded the demo films, round 2, saved by the manager unedited after the merge into `main` as 399026e. It was read from the subagent's own transcript. Branch head `3573064`, base `337f522`. There was no worker model and no reviewer call for this job; the manager checked the films itself, see `docs/agent/manager-state.md`.

~~~text
Round 2 is done: one new commit `3573064` on `slice/demo-video`, on top of `8b84740`, not pushed. Two builds were used (the limit); the second is the committed one. Nothing is still off in the banner timing.

## What changed

- C1 **Retiming (your D2).** Each before half now ends with the cursor hovering the decisive button, without clicking. Each after half does the real action off screen and starts about 0.35 s after the new state is in the DOM. This uses a new recorder action `cut_when`, patched in from `demo-video/run.mjs` (4 lines). The `trim_start_ms` values on the after halves are only fallbacks; the build log has 0 "action failed" lines, so they were not used.
- C2 **Cursor jump at the create cut: removed.** The cursor is at the same spot on both sides (on the "Add property" submit button before, same coordinates after).
- C3 **Addresses.** `15 Saguaro Blvd`, Fountain Hills, AZ, 85268; `220 Palm Street`, Scottsdale, AZ, 85259; `300 Pine Avenue`, Fountain Hills, AZ, 85268 (first tried with zip 00000). No narration text changed: no address is spoken and the counts stay three and two.
- C4 **Films in the repository.** The four mp4 files are in `c:/tmp/covertree-video/docs/demo/` and in `c:/tmp/covertree-video-out/`; sha256 of the committed blobs equals the output files.

## Checks

**K1 `ffprobe` and `volumedetect`** (all four: h264 1920x1080, 30 fps, yuv420p, aac 48 kHz mono)

| File | Duration | Bytes | Mean / max volume |
|---|---|---|---|
| `covertree-demo.mp4` | 109.83 s | 5,185,585 | -17.5 / -1.4 dB |
| `before-after-create.mp4` | 23.80 s | 963,575 | -17.3 / -1.4 dB |
| `before-after-validation.mp4` | 15.00 s | 563,957 | -17.5 / -1.5 dB |
| `before-after-delete.mp4` | 11.30 s | 540,744 | -17.0 / -1.4 dB |

**K2 Cut frames, read by me** (main film, frame n is at n/30 s). In all three, the first frame with the AFTER banner is also the first frame showing the new state.

| Cut | Last frame before | First frame after |
|---|---|---|
| Create | f564 (18.80 s): "BEFORE: no properties yet", filled form, cursor on the submit button | f565 (18.83 s): "AFTER: saved with its weather", detail page "15 Saguaro Blvd" with the weather card (19 °C, Patchy rain nearby) |
| Validation | f1355 (45.17 s): "BEFORE: not saved yet", form with 220 Palm Street / Scottsdale / AZ / 85259 | f1356 (45.20 s): "AFTER: corrected and saved", list "2 properties" |
| Delete | f2745 (91.50 s): "BEFORE: three properties", dialog "Delete 220 Palm Street?" over "3 properties" | f2746 (91.53 s): "AFTER: two remain", list "2 properties" (300 Pine Avenue, 15 Saguaro Blvd) |

- The three clips show the same content at their cuts: create frames 306/307, validation 368/369, delete 154/155.
- A colour fingerprint of the banner area over the neighbouring frames (4 per cut in the film, 6 per cut in the clips) changes exactly once, at these frames.
- The state cannot appear under a BEFORE banner, because no before half performs the action.

**K3 Frames showing the addresses**
- `15 Saguaro Blvd`: f565 (detail) and 31 s (list, "1 property").
- `220 Palm Street`, Scottsdale, AZ, 85259: f1356 (list) and 78 s (filter "scottsdale" gives "1 property").
- `300 Pine Avenue`, Fountain Hills, AZ, 85268: 60.3 s (detail) and 62 s (list, "3 properties").
- The detail scene at 66 to 70 s opens 300 Pine Avenue.

**K4 Stub log of the final build** (`c:/tmp/covertree-video-logs/stub.log`): exactly 4 calls: `85268 -> 200`, `85259 -> 200`, `00000 -> 400`, `85268 -> 200`.

**K5 `npm run verify`** in the worktree with the mp4 files present: exit 0, on Node v24.16.0 (`c:/tmp/covertree-video-logs/verify.log`). The log shows "All matched files use Prettier code style!".

**K6 Git**
- `git status --short`: empty.
- `git log --format='%h %an %s' 337f522..HEAD`:
  - `3573064 Marcin Sufa demo-video: retime the before/after cuts, use the test addresses and add the films`
  - `8b84740 Marcin Sufa demo-video: add the sources of the narrated demo film`
- `git diff --stat 8b84740..HEAD`: `demo-video/brand.yaml` (52 lines), `demo-video/run.mjs` (4 lines), four `docs/demo/*.mp4`; 6 files changed, 32 insertions, 24 deletions.
- The commit message has no trailer and no long dash.

**K7 Processes and leftovers**
- `netstat -ano | grep -E ':(4100|5273|4274|8765)\s' | grep LISTENING`: no output.
- The run printed all four PIDs stopped.
- No `servers.json`, and no `covertree-demo-*` folder in the temp directory.

## What I did not verify

- N1 I cannot listen to the audio. I checked only levels, the caption timing file and the build's "narration ends 1.6s before video end".
- N2 I did not view every frame. I read 12 cut frames at 1280 wide and 30 sampled frames across the film at 960 wide.
- N3 That the Scottsdale detail page never appears rests on the scene script plus those samples, not on a full frame scan.
- N4 The browser console check from round 1 was not repeated with the new addresses.

## Deviations and things to know

- D1 **Validation scene restructured.** Retiming alone could not fix it, because the old AFTER half contained the correction. The correction now happens in the before half, whose label is `BEFORE: not saved yet`. The scene is 1.0 s longer (15.0 to 16.0 s), with a matching narration pause (1.8 to 2.8 s) after "With a real street and city, the property saves."
- D2 **Validation after half shows the list, not the detail page.** The app redirects to the Scottsdale detail page after every save, so that page does load, but only in the trimmed part of the recording.
- D3 **Stale errors at the validation cut.** In f1355 the two field errors are still shown beside the corrected values. The app keeps server errors until the next submit; I left it as recorded.
- D4 **Cursor.** It is switched off in the validation after half, so it disappears at that cut (in build 1 it sat on the word "Scottsdale"). At the delete cut it is hidden behind the modal dialog before and reappears after, because the recorder draws it under the dialog.
- D5 **Addresses agree with the tests only partly.** The cities and zips are yours. `e2e/stories.spec.ts` in the main checkout has `220 Palm Street` with zip 85268 and `300 Pine Avenue` in Austin, TX, 78701. Those two streets are not in the worktree, so I ran one read-only grep in the main checkout to find them.
- D6 **Placeholder equals the first address.** `15 Saguaro Blvd`, Fountain Hills and 85268 are also the form's grey placeholders, so at 12 s the empty form already shows the text that is typed next.
- D7 **Same weather on all rows.** The stub replays the one fixture for 85259 too, so the Scottsdale row also shows 19 °C, Patchy rain nearby.
- D8 **Second build.** Build 1 already had the timing right; build 2 only removed the cursor over "Scottsdale". Build 1 output is kept in `c:/tmp/covertree-video-logs/r2-build1/` and is not committed.

Frames are in `c:/tmp/covertree-video-logs/frames-r2/final/` (`cuts`, `clips`, `walk`); the final build log is `c:/tmp/covertree-video-logs/build-1791910128896.log`.
~~~
