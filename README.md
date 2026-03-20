# companion-module-optisigns-digitalsignage

Bitfocus Companion module for controlling [OptiSigns](https://www.optisigns.com) digital signage screens.

## Features

- Assign playlists to screens
- Assign individual assets/files to screens
- Add assets to playlists
- Remove assets from playlists
- Set asset display duration within a playlist
- Per-screen variables showing current content type and name
- Feedbacks for triggering button states based on what a screen is currently displaying

## Configuration

| Field | Description |
|---|---|
| API Key | Your OptiSigns API key. Found in the OptiSigns portal under **Settings → Integrations → API**. |
| Poll Interval | How often (in seconds) to refresh screen, playlist, and asset data from OptiSigns. Set to 0 to disable polling. |

## Actions

| Action | Description |
|---|---|
| Assign Playlist to Screen | Sets a screen to display a specific playlist |
| Assign Asset/File to Screen | Sets a screen to display a specific asset or file |
| Add Asset to Playlist | Adds an asset to a playlist at a given position |
| Remove Asset from Playlist | Removes the first occurrence of an asset from a playlist |
| Set Asset Duration in Playlist | Sets how long (in seconds) an asset displays within a playlist |

## Feedbacks

| Feedback | Description |
|---|---|
| Screen is showing playlist | True when the selected screen is currently assigned to the selected playlist |
| Screen is showing asset | True when the selected screen is currently assigned to the selected asset |

## Variables

For each screen, the following variables are available:

| Variable | Description |
|---|---|
| `screen_N_name` | Display name of screen N |
| `screen_N_content_type` | Current content type (`PLAYLIST`, `ASSET`, or `NONE`) |
| `screen_N_content_name` | Name of the currently assigned playlist or asset |

Screens are numbered 1–N, sorted alphabetically by name.

## Requirements

- Bitfocus Companion 4.x
- An active OptiSigns account with API access

## License

MIT — Copyright (c) 2026 Eric Davidson
