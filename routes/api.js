/*
|--------------------------------------------------------------------------
| Variable
|--------------------------------------------------------------------------
*/
	// Node Modules
	const RoutesVersioning = require( 'express-routes-versioning' )();
	
	// Controllers
	const Controllers = {
		v_1_0: {
			Finding: require( _directory_base + '/app/v1.0/Http/Controllers/FindingController.js' ),
			Report: require( _directory_base + '/app/v1.0/Http/Controllers/ReportController.js' ),
			SyncMobile: require( _directory_base + '/app/v1.0/Http/Controllers/SyncMobileController.js' ),
			Summary: require( _directory_base + '/app/v1.0/Http/Controllers/SummaryController.js' )
		}
	}

	const SyncDatabase = {
		TR_FINDING: require( _directory_base + '/app/v1.0/Http/Controllers/SyncDatabase/TR_FINDING.js' )
	};

	// Middleware
	const Middleware = {
		v_1_0: {
			VerifyToken: require( _directory_base + '/app/v1.0/Http/Middleware/VerifyToken.js' )
		}
	}

	const MT = require( _directory_base + '/app/v1.0/Http/Middleware/Testing.js' );

/*
 |--------------------------------------------------------------------------
 | Routing
 |--------------------------------------------------------------------------
 */
	module.exports = ( app ) => {

		app.get( '/xxxx', SyncDatabase.TR_FINDING.sync );

		/*
		 |--------------------------------------------------------------------------
		 | Welcome Message
		 |--------------------------------------------------------------------------
		 */
			app.get( '/', ( req, res ) => {
				res.json( { 
					application: {
						name : config.app.name,
						env : config.app.env,
						port : config.app.port[config.app.env]
					} 
				} )
			} );


		/*
		 |--------------------------------------------------------------------------
		 | API Versi 1.0
		 |--------------------------------------------------------------------------
		 */
			// Finding
			app.get( '/api/v1.0/sync-mobile/comment', Middleware.v_1_0.VerifyToken, Controllers.v_1_0.Finding.findComment );
			app.get( '/api/v1.0/finding/comment', Middleware.v_1_0.VerifyToken, Controllers.v_1_0.Finding.findComment );
			app.get( '/api/v1.0/finding', Middleware.v_1_0.VerifyToken, Controllers.v_1_0.Finding.find );
			app.get( '/api/v1.0/finding/all', Middleware.v_1_0.VerifyToken, Controllers.v_1_0.Finding.findAll );
			app.get( '/api/v1.0/finding/q', Middleware.v_1_0.VerifyToken, Controllers.v_1_0.Finding.findAll );
			app.get( '/api/v1.0/finding/:id', Middleware.v_1_0.VerifyToken, Controllers.v_1_0.Finding.findOne );
			app.post( '/api/v1.0/finding', Middleware.v_1_0.VerifyToken, Controllers.v_1_0.Finding.create_or_update, MT );
			app.post( '/api/v1.0/finding/comment', Middleware.v_1_0.VerifyToken, Controllers.v_1_0.Finding.create_or_update_comment );

			// Summary
			app.post( '/api/v1.0/summary/total', Middleware.v_1_0.VerifyToken, Controllers.v_1_0.Summary.total );

			// Report
			app.get( '/api/v1.0/report/web/finding/all', Middleware.v_1_0.VerifyToken, Controllers.v_1_0.Report.find );
			app.get( '/api/v1.0/report/web/finding/q', Middleware.v_1_0.VerifyToken, Controllers.v_1_0.Report.find );

			// Sync Mobile
			app.get( '/api/v1.0/sync-mobile/finding/:start_date/:end_date', Middleware.v_1_0.VerifyToken, Controllers.v_1_0.SyncMobile.synchronize );
			app.get( '/api/v1.0/sync-mobile/finding-images/:start_date/:end_date', Middleware.v_1_0.VerifyToken, Controllers.v_1_0.SyncMobile.synchronize_images );
		/*
		 |--------------------------------------------------------------------------
		 | Old API
		 |--------------------------------------------------------------------------
		 */
			// Finding
			app.get( '/finding', Middleware.v_1_0.VerifyToken, RoutesVersioning( {
				"1.0.0": Controllers.v_1_0.Finding.find
			} ) );

			app.get( '/finding/all', Middleware.v_1_0.VerifyToken, RoutesVersioning( {
				"1.0.0": Controllers.v_1_0.Finding.findAll
			} ) );

			app.get( '/finding/q', Middleware.v_1_0.VerifyToken, RoutesVersioning( {
				"1.0.0": Controllers.v_1_0.Finding.findAll
			} ) );
			
			app.get( '/finding/:id', Middleware.v_1_0.VerifyToken, RoutesVersioning( {
				"1.0.0": Controllers.v_1_0.Finding.findOne
			} ) );

			app.post( '/finding', Middleware.v_1_0.VerifyToken, RoutesVersioning( {
				"1.0.0": Controllers.v_1_0.Finding.create_or_update
			} ) );

			// Report
			app.get( '/finding-report/all', Middleware.v_1_0.VerifyToken, RoutesVersioning( {
				"1.0.0": Controllers.v_1_0.Report.find
			} ) );

			app.get( '/finding-report/q', Middleware.v_1_0.VerifyToken, RoutesVersioning( {
				"1.0.0": Controllers.v_1_0.Report.find
			} ) );

			// Sync Mobile
			app.get( '/sync-mobile/finding/:start_date/:end_date', Middleware.v_1_0.VerifyToken, RoutesVersioning( {
				"1.0.0": Controllers.v_1_0.SyncMobile.synchronize
			} ) );

			app.get( '/sync-mobile/finding-images/:start_date/:end_date', Middleware.v_1_0.VerifyToken, RoutesVersioning( {
				"1.0.0": Controllers.v_1_0.SyncMobile.synchronize_images
			} ) );
			
	}