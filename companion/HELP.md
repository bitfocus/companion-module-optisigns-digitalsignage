# OptiSigns Module for Bitfocus Companion

Control your OptiSigns digital signage screens from Companion.

## Setup

1. Log in to [app.optisigns.com](https://app.optisigns.com)
2. Go to **Settings → API Keys** and generate a new key with read/write permissions
3. Paste the key into the **API Key** field in this module's configuration

## Actions

| Action | Description |
|--------|-------------|
| **Assign Playlist to Screen** | Immediately switches a screen to display the selected playlist |
| **Assign Asset/File to Screen** | Immediately switches a screen to display a single asset (image, video, URL, etc.) |

Screens, playlists, and assets are loaded automatically from your OptiSigns account and refresh every 5 minutes (configurable). You can also type an ID directly into any dropdown if you prefer.

## Feedbacks

| Feedback | Description |
|----------|-------------|
| **Screen is Showing Playlist** | Button lights up when the selected screen is currently displaying the selected playlist |
| **Screen is Showing Asset/File** | Button lights up when the selected screen is currently displaying the selected asset |

## Variables

The module exposes the following variables (replace `<screen>` with the sanitized screen name):

| Variable | Description |
|----------|-------------|
| `$(optisigns:device_count)` | Total number of paired screens |
| `$(optisigns:playlist_count)` | Total number of playlists |
| `$(optisigns:asset_count)` | Total number of assets |
| `$(optisigns:screen_<screen>_content_type)` | Current content type for a screen (`PLAYLIST`, `ASSET`, or `NONE`) |
| `$(optisigns:screen_<screen>_content_name)` | Name of the playlist or filename of the asset currently on a screen |

Screen name keys are lower-cased with spaces and special characters replaced by underscores. For example, a screen named "Lobby Display" becomes `lobby_display`.

## Notes

- Data is polled from OptiSigns every **5 minutes** by default (configurable in module settings). Feedback and variable states update automatically.
- After an action fires, the local state updates immediately without waiting for the next poll.
