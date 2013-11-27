(function () {
	'use strict';

	var copyPaste = require('copy-paste'),
		_domainManager;

	function copy(userSelection) {
		copyPaste.copy(userSelection, function(){
			console.log('copy complete');
		});
	}

	function init(domainManager) {
		_domainManager = domainManager;

		if (!domainManager.hasDomain('clipboard')) {
			domainManager.registerDomain('clipboard', {
				major: 0,
				minor: 1
			});
		}

		domainManager.registerCommand(
			'clipboard',
			'copy',
			copy,
			false,
			'Copies data into the clipboard', 
			[], 
			[{name: "clipboardContent", type: "string", description: "the contents of the clipboard"}]
		);
	}
	
	exports.init = init;
})();