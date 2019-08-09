/*
 |--------------------------------------------------------------------------
 | App Setup
 |--------------------------------------------------------------------------
 |
 | Untuk menghandle models, libraries, helper, node modules, dan lain-lain
 |
 */
	// Node Module
	const NodeRestClient = require( 'node-rest-client' ).Client;

/*
 |--------------------------------------------------------------------------
 | Versi 1.0
 |--------------------------------------------------------------------------
 */
	exports.sync = ( req, res ) => {
		var url = 'http://tap-ldapdev.tap-agri.com/kafka';
		var args = {
			// headers: { "Content-Type": "application/json", "Authorization": req.headers.authorization }
		};

		( new NodeRestClient() ).get( url, args, function ( data, response ) {
			return res.json( { 
				"message": "First time sync"
			} );
		});

		// return res.json( { 
		// 	"message": "XXXX",
		// 	"data": []
		// } );
	};