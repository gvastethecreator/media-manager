module.exports = {
	makers: [{ name: '@electron-forge/maker-zip', platforms: ['win32'] }],
	packagerConfig: {
		appBundleId: 'com.gvaste.mediamanager',
		asar: false,
		extraResource: ['electron/extra-resources'],
		name: 'Media Manager',
	},
};
