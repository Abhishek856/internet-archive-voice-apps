# Changelog of Alexa Skill Scheme

Because Alexa doesn't give the way to add description to versions
here will be the Changelog of them

## v40

- *improve*: support request like: `"play unlocked symphonies"` (combination of collection and `GENRES_IA`)

## v34

- *fix*: support 

## v33

- *fix*: rename "symphony" to "symphonies" 

## v31-32

- *feat*: add support of "play <collection>" request
- *feat*: map "unlock recordings" to "unlocked recordings"

## v30

- *feat*: add custom `GENRES_IA` type for music genres missed in `AMAZON.Genre` (e.g. "symphony")
- *feat*: use `GENRES_IA` for `MusicQuerySubject` and `InOneGoMusicPlayback` intents

## v29

- *feat*: remove all conflicts like intersection between Amazon.Genre and COLLECTION_LIST
