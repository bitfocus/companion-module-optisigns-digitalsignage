'use strict'

const {
	graphqlRequest,
	findAssetPosition,
	ASSIGN_PLAYLIST,
	ASSIGN_ASSET,
	ADD_PLAYLIST_ITEMS,
	REMOVE_PLAYLIST_ITEMS,
	UPDATE_PLAYLIST_ITEM_DURATION,
} = require('./api')

module.exports = function updateActions(self) {
	const deviceChoices = self.devices.map((d) => ({ id: d._id, label: d.deviceName }))
	const playlistChoices = self.playlists.map((p) => ({ id: p._id, label: p.name }))
	const assetChoices = self.assets.map((a) => ({ id: a._id, label: a.filename }))

	self.setActionDefinitions({
		assign_playlist: {
			name: 'Assign Playlist to Screen',
			options: [
				{
					id: 'device_id',
					type: 'dropdown',
					label: 'Screen',
					choices: deviceChoices,
					default: deviceChoices[0]?.id ?? '',
					allowCustom: true,
					tooltip: 'Select the target screen',
				},
				{
					id: 'playlist_id',
					type: 'dropdown',
					label: 'Playlist',
					choices: playlistChoices,
					default: playlistChoices[0]?.id ?? '',
					allowCustom: true,
					tooltip: 'Select the playlist to assign',
				},
			],
			callback: async (event) => {
				const { device_id, playlist_id } = event.options
				if (!device_id || !playlist_id) {
					self.log('warn', 'Assign Playlist: screen or playlist not selected')
					return
				}
				try {
					const data = await graphqlRequest(self.secrets.api_key, ASSIGN_PLAYLIST, {
						_id: device_id,
						playlistId: playlist_id,
					})
					const device = data?.updateDevice
					if (device) {
						self.log('info', `Assigned playlist to "${device.deviceName}"`)
						await self.refreshData()
					}
				} catch (err) {
					self.log('error', `Assign Playlist failed: ${err?.message ?? String(err)}`)
				}
			},
		},

		assign_asset: {
			name: 'Assign Asset/File to Screen',
			options: [
				{
					id: 'device_id',
					type: 'dropdown',
					label: 'Screen',
					choices: deviceChoices,
					default: deviceChoices[0]?.id ?? '',
					allowCustom: true,
					tooltip: 'Select the target screen',
				},
				{
					id: 'asset_id',
					type: 'dropdown',
					label: 'Asset / File',
					choices: assetChoices,
					default: assetChoices[0]?.id ?? '',
					allowCustom: true,
					tooltip: 'Select the asset or file to display',
				},
			],
			callback: async (event) => {
				const { device_id, asset_id } = event.options
				if (!device_id || !asset_id) {
					self.log('warn', 'Assign Asset: screen or asset not selected')
					return
				}
				try {
					const data = await graphqlRequest(self.secrets.api_key, ASSIGN_ASSET, {
						_id: device_id,
						assetId: asset_id,
					})
					const device = data?.updateDevice
					if (device) {
						self.log('info', `Assigned asset to "${device.deviceName}"`)
						await self.refreshData()
					}
				} catch (err) {
					self.log('error', `Assign Asset failed: ${err?.message ?? String(err)}`)
				}
			},
		},

		add_asset_to_playlist: {
			name: 'Add Asset to Playlist',
			options: [
				{
					id: 'playlist_id',
					type: 'dropdown',
					label: 'Playlist',
					choices: playlistChoices,
					default: playlistChoices[0]?.id ?? '',
					allowCustom: true,
					tooltip: 'Select the playlist to add the asset to',
				},
				{
					id: 'asset_id',
					type: 'dropdown',
					label: 'Asset / File',
					choices: assetChoices,
					default: assetChoices[0]?.id ?? '',
					allowCustom: true,
					tooltip: 'Select the asset or file to add',
				},
				{
					id: 'position',
					type: 'number',
					label: 'Position (0 = first, 9999 = end)',
					default: 9999,
					min: 0,
					max: 9999,
					tooltip: 'Where to insert the asset in the playlist. Use 9999 to append at the end.',
				},
			],
			callback: async (event) => {
				const { playlist_id, asset_id, position } = event.options
				if (!playlist_id || !asset_id) {
					self.log('warn', 'Add Asset to Playlist: playlist or asset not selected')
					return
				}
				try {
					await graphqlRequest(self.secrets.api_key, ADD_PLAYLIST_ITEMS, {
						playlistId: playlist_id,
						assetIds: [asset_id],
						pos: position,
					})
					const playlistName = self.playlists.find((p) => p._id === playlist_id)?.name ?? playlist_id
					const assetName = self.assets.find((a) => a._id === asset_id)?.filename ?? asset_id
					self.log('info', `Added "${assetName}" to playlist "${playlistName}"`)
				} catch (err) {
					self.log('error', `Add Asset to Playlist failed: ${err?.message ?? String(err)}`)
				}
			},
		},

		remove_asset_from_playlist: {
			name: 'Remove Asset from Playlist',
			options: [
				{
					id: 'playlist_id',
					type: 'dropdown',
					label: 'Playlist',
					choices: playlistChoices,
					default: playlistChoices[0]?.id ?? '',
					allowCustom: true,
					tooltip: 'Select the playlist to remove the asset from',
				},
				{
					id: 'asset_id',
					type: 'dropdown',
					label: 'Asset / File',
					choices: assetChoices,
					default: assetChoices[0]?.id ?? '',
					allowCustom: true,
					tooltip: 'If the asset appears multiple times, the first occurrence is removed.',
				},
			],
			callback: async (event) => {
				const { playlist_id, asset_id } = event.options
				if (!playlist_id || !asset_id) {
					self.log('warn', 'Remove Asset from Playlist: playlist or asset not selected')
					return
				}
				try {
					const pos = await findAssetPosition(self.secrets.api_key, playlist_id, asset_id)
					await graphqlRequest(self.secrets.api_key, REMOVE_PLAYLIST_ITEMS, {
						playlistId: playlist_id,
						pos: [pos],
					})
					const playlistName = self.playlists.find((p) => p._id === playlist_id)?.name ?? playlist_id
					const assetName = self.assets.find((a) => a._id === asset_id)?.filename ?? asset_id
					self.log('info', `Removed "${assetName}" from playlist "${playlistName}"`)
				} catch (err) {
					self.log('error', `Remove Asset from Playlist failed: ${err?.message ?? String(err)}`)
				}
			},
		},

		set_asset_duration_in_playlist: {
			name: 'Set Asset Duration in Playlist',
			options: [
				{
					id: 'playlist_id',
					type: 'dropdown',
					label: 'Playlist',
					choices: playlistChoices,
					default: playlistChoices[0]?.id ?? '',
					allowCustom: true,
					tooltip: 'Select the playlist containing the asset',
				},
				{
					id: 'asset_id',
					type: 'dropdown',
					label: 'Asset / File',
					choices: assetChoices,
					default: assetChoices[0]?.id ?? '',
					allowCustom: true,
					tooltip: 'If the asset appears multiple times, the first occurrence is updated.',
				},
				{
					id: 'duration',
					type: 'number',
					label: 'Duration (seconds)',
					default: 10,
					min: 1,
					max: 3600,
					tooltip: 'How long the asset should display in the playlist (in seconds)',
				},
			],
			callback: async (event) => {
				const { playlist_id, asset_id, duration } = event.options
				if (!playlist_id || !asset_id) {
					self.log('warn', 'Set Asset Duration: playlist or asset not selected')
					return
				}
				try {
					const pos = await findAssetPosition(self.secrets.api_key, playlist_id, asset_id)
					await graphqlRequest(self.secrets.api_key, UPDATE_PLAYLIST_ITEM_DURATION, {
						playlistId: playlist_id,
						pos: [pos],
						duration: duration,
					})
					const playlistName = self.playlists.find((p) => p._id === playlist_id)?.name ?? playlist_id
					const assetName = self.assets.find((a) => a._id === asset_id)?.filename ?? asset_id
					self.log('info', `Set "${assetName}" duration to ${duration}s in playlist "${playlistName}"`)
				} catch (err) {
					self.log('error', `Set Asset Duration failed: ${err?.message ?? String(err)}`)
				}
			},
		},
	})
}
