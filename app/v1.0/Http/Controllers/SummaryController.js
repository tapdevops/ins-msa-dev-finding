/*
 |--------------------------------------------------------------------------
 | App Setup
 |--------------------------------------------------------------------------
 |
 | Untuk menghandle models, libraries, helper, node modules, dan lain-lain
 |
 */
 	// Models
	const FindingModel = require( _directory_base + '/app/v1.0/Http/Models/Finding.js' );

	// Node Module
	const MomentTimezone = require( 'moment-timezone' );

/*
 |--------------------------------------------------------------------------
 | Versi 1.0
 |--------------------------------------------------------------------------
 */
 	/** 
 	  * Total
	  * --------------------------------------------------------------------
	*/
 	exports.total = async ( req, res ) => {
 		var date = new Date();
 			date.setDate( date.getDate() - 1 );
 		var max_finding_date = parseInt( MomentTimezone( date ).tz( "Asia/Jakarta" ).format( "YYYYMMDD" ) + '235959' );
 		var finding_progress_complete = await FindingModel.aggregate( [
 			{
 				"$match": {
 					"INSERT_TIME": {
 						"$lte": max_finding_date
 					},
 					"PROGRESS": 100
 				}
 			},
 			{
 				"$count": "jumlah"
 			}
 		] );
 		var finding_progress_incomplete = await FindingModel.aggregate( [
 			{
 				"$match": {
 					"INSERT_TIME": {
 						"$lte": max_finding_date
 					},
 					"PROGRESS": {
 						"$lte": 100
 					}
 				}
 			},
 			{
 				"$count": "jumlah"
 			}
 		] );

 		return res.status( 200 ).json( {
 			status: true,
 			message: "OK",
 			data: {
 				complete: ( finding_progress_complete.length > 0 ? finding_progress_complete[0].jumlah : 0 ),
 				incomplete: ( finding_progress_incomplete.length > 0 ? finding_progress_incomplete[0].jumlah : 0 ),
 				target: 10 // Masih hardcode
 			}
 		} );
 	}