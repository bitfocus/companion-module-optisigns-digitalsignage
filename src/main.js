'use strict'

const { InstanceBase, InstanceStatus, runEntrypoint } = require('@companion-module/base')
const { graphqlRequest, extractEdges, GET_DEVICES, GET_PLAYLISTS, GET_ASSETS } = require('./api')
const updateActions = require('./actions')
const updateFeedbacks = require('./feedbacks')
const updateVariableDefinitions = require('./variables')
const { updateVariableValues } = require('./variables')
const UpgradeScripts = require('./upgrades')

class OptiSignsInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Local cache of data from OptiSigns
		this.devices = []
		this.playlists = []
		this.assets = []

		this._pollTimer = null
	}

	// ─── Lifecycle ────────────────────────────────────────────────────────────

	async init(config) {
		this.config = config
		this.updateStatus(InstanceStatus.Connecting)

		if (!this.config.api_key) {
			this.updateStatus(InstanceStatus.BadConfig, 'API key is required')
			return
		}

		// Register empty definitions so actions/feedbacks/variables are visible
		// even if the initial API call fails
		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()

		await this.refreshData()
		this._startPolling()
	}

	async destroy() {
		this._stopPolling()
	}

	async configUpdated(config) {
		this._stopPolling()
		this.config = config

		if (!this.config.api_key) {
			this.updateStatus(InstanceStatus.BadConfig, 'API key is required')
			return
		}

		this.updateStatus(InstanceStatus.Connecting)
		await this.refreshData()
		this._startPolling()
	}

	getConfigFields() {
		return [
			{
				id: 'api_key',
				type: 'secret-text',
				label: 'API Key',
				tooltip: 'Generate at app.optisigns.com → Settings → API Keys',
				width: 12,
			},
			{
				id: 'poll_interval',
				type: 'number',
				label: 'Poll Interval (seconds)',
				tooltip: 'How often to refresh screens, playlists, and assets from OptiSigns. Set to 0 to disable polling.',
				default: 300,
				min: 0,
				max: 3600,
				width: 4,
			},
		]
	}

	// ─── Data Refresh ─────────────────────────────────────────────────────────

	async refreshData() {
		const [devicesResult, playlistsResult, assetsResult] = await Promise.allSettled([
			graphqlRequest(this.config.api_key, GET_DEVICES),
			graphqlRequest(this.config.api_key, GET_PLAYLISTS),
			graphqlRequest(this.config.api_key, GET_ASSETS),
		])

		const allFailed = [devicesResult, playlistsResult, assetsResult].every((r) => r.status === 'rejected')
		if (allFailed) {
			const err = devicesResult.reason
			this.log('error', `Failed to fetch data from OptiSigns: ${err?.message ?? String(err)}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, err?.message ?? String(err))
			return
		}

		let newDevices = this.devices
		let newPlaylists = this.playlists
		let newAssets = this.assets

		if (devicesResult.status === 'fulfilled') {
			newDevices = extractEdges(devicesResult.value?.devices)
		} else {
			this.log('error', `Failed to fetch devices: ${devicesResult.reason?.message ?? String(devicesResult.reason)}`)
		}

		if (playlistsResult.status === 'fulfilled') {
			newPlaylists = extractEdges(playlistsResult.value?.playlists)
		} else {
			this.log('error', `Failed to fetch playlists: ${playlistsResult.reason?.message ?? String(playlistsResult.reason)}`)
		}

		if (assetsResult.status === 'fulfilled') {
			newAssets = extractEdges(assetsResult.value?.assets)
		} else {
			this.log('error', `Failed to fetch assets: ${assetsResult.reason?.message ?? String(assetsResult.reason)}`)
		}

		this.log('debug', `Loaded ${newDevices.length} screens, ${newPlaylists.length} playlists, ${newAssets.length} assets`)
		this.updateStatus(InstanceStatus.Ok)

		// Only rebuild action/feedback definitions if the lists changed —
		// rebuilding wipes existing feedback instances from buttons.
		const listsChanged =
			_listSignature(newDevices) !== _listSignature(this.devices) ||
			_listSignature(newPlaylists) !== _listSignature(this.playlists) ||
			_listSignature(newAssets) !== _listSignature(this.assets)

		this.devices = newDevices
		this.playlists = newPlaylists
		this.assets = newAssets

		if (listsChanged) {
			this.updateActions()
			this.updateFeedbacks()
			this.updateVariableDefinitions()
		}

		// Always update variable values and re-evaluate feedbacks
		this.updateVariables()
		this.checkFeedbacks()
	}

	// ─── Helpers called by actions/feedbacks ──────────────────────────────────

	updateActions() {
		updateActions(this)
	}

	updateFeedbacks() {
		updateFeedbacks(this)
	}

	updateVariableDefinitions() {
		updateVariableDefinitions(this)
	}

	updateVariables() {
		updateVariableValues(this)
	}

	// ─── Polling ──────────────────────────────────────────────────────────────

	_startPolling() {
		this._stopPolling()
		const intervalMs = (this.config.poll_interval ?? 300) * 1000
		if (intervalMs === 0) return
		this._pollTimer = setInterval(() => {
			this.refreshData()
		}, intervalMs)
	}

	_stopPolling() {
		if (this._pollTimer) {
			clearInterval(this._pollTimer)
			this._pollTimer = null
		}
	}
}

// Returns a string that changes when the set of IDs or display names in a list changes.
// Used to avoid rebuilding action/feedback definitions on every poll.
function _listSignature(list) {
	return list
		.map((item) => `${item._id}:${item.deviceName ?? item.name ?? item.filename}`)
		.sort()
		.join(',')
}

runEntrypoint(OptiSignsInstance, UpgradeScripts)
