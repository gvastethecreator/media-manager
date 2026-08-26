module.exports = {
	makers: [{ name: '@electron-forge/maker-zip', platforms: ['win32'] }],
	packagerConfig: {
		appBundleId: 'com.imagemanager.app',
		asar: false,
		extraResource: ['electron/extra-resources'],
		name: 'Media Manager',
	},
};
