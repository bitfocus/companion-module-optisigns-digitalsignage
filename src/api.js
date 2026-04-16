'use strict'

const GRAPHQL_ENDPOINT = 'https://graphql-gateway.optisigns.com/graphql'

async function graphqlRequest(apiKey, query, variables = {}) {
	const response = await fetch(GRAPHQL_ENDPOINT, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({ query, variables }),
		signal: AbortSignal.timeout(30_000),
	})

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`)
	}

	const json = await response.json()

	if (json.errors && json.errors.length > 0) {
		throw new Error(json.errors.map((e) => e.message).join(', '))
	}

	return json.data
}

const GET_DEVICES = `
query GetDevices {
  devices(query: {}) {
    page {
      edges {
        node {
          _id
          deviceName
          currentType
          currentAssetId
          currentPlaylistId
        }
      }
    }
  }
}`

const GET_PLAYLISTS = `
query GetPlaylists {
  playlists(query: {}) {
    page {
      edges {
        node {
          _id
          name
        }
      }
    }
  }
}`

const GET_ASSETS = `
query GetAssets {
  assets(query: {}) {
    page {
      edges {
        node {
          _id
          filename
          type
        }
      }
    }
  }
}`

const ASSIGN_PLAYLIST = `
mutation AssignPlaylist($_id: String!, $playlistId: String!) {
  updateDevice(_id: $_id, payload: {
    currentType: PLAYLIST
    currentPlaylistId: $playlistId
  }) {
    _id
    deviceName
    currentType
    currentPlaylistId
  }
}`

const ASSIGN_ASSET = `
mutation AssignAsset($_id: String!, $assetId: String!) {
  updateDevice(_id: $_id, payload: {
    currentType: ASSET
    currentAssetId: $assetId
  }) {
    _id
    deviceName
    currentType
    currentAssetId
  }
}`

const GET_PLAYLIST_ITEMS = `
query GetPlaylistItems($id: String!) {
  playlists(query: { _id: $id }) {
    page {
      edges {
        node {
          _id
          assets {
            _id
            filename
            type
          }
        }
      }
    }
  }
}`

const ADD_PLAYLIST_ITEMS = `
mutation AddPlaylistItems($playlistId: String!, $assetIds: [String!]!, $pos: Int!) {
  addPlaylistItems(_id: [$playlistId], payload: { ids: $assetIds, pos: $pos }) {
    _id
    filename
  }
}`

const REMOVE_PLAYLIST_ITEMS = `
mutation RemovePlaylistItems($playlistId: String!, $pos: [Int!]!) {
  removePlaylistItems(_id: [$playlistId], payload: { pos: $pos }) {
    _id
    filename
  }
}`

const UPDATE_PLAYLIST_ITEM_DURATION = `
mutation UpdatePlaylistItemDuration($playlistId: String!, $pos: [Int!]!, $duration: Int!) {
  updatePlaylistItems(_id: [$playlistId], payload: { pos: $pos, duration: $duration }) {
    _id
    filename
  }
}`

// Extract edges from paginated GraphQL response
function extractEdges(pageData) {
	return (pageData?.page?.edges ?? []).map((e) => e.node)
}

// Fetch the ordered list of assets in a playlist.
// Returns an array of { _id, filename, type } in playlist order.
async function getPlaylistItems(apiKey, playlistId) {
	const data = await graphqlRequest(apiKey, GET_PLAYLIST_ITEMS, { id: playlistId })
	const node = extractEdges(data?.playlists)[0]
	return node?.assets ?? []
}

// Find the zero-based position of an asset in a playlist.
// Throws if not found.
async function findAssetPosition(apiKey, playlistId, assetId) {
	const items = await getPlaylistItems(apiKey, playlistId)
	const pos = items.findIndex((item) => item._id === assetId)
	if (pos === -1) throw new Error(`Asset not found in playlist`)
	return pos
}

module.exports = {
	graphqlRequest,
	extractEdges,
	getPlaylistItems,
	findAssetPosition,
	GET_DEVICES,
	GET_PLAYLISTS,
	GET_ASSETS,
	GET_PLAYLIST_ITEMS,
	ASSIGN_PLAYLIST,
	ASSIGN_ASSET,
	ADD_PLAYLIST_ITEMS,
	REMOVE_PLAYLIST_ITEMS,
	UPDATE_PLAYLIST_ITEM_DURATION,
}
