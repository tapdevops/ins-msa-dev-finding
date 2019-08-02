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
	const FindingLogModel = require( _directory_base + '/app/v1.0/Http/Models/FindingLog.js' );
	const FindingCommentModel = require( _directory_base + '/app/v1.0/Http/Models/FindingComment.js' );
	const FindingCommentTagModel = require( _directory_base + '/app/v1.0/Http/Models/FindingCommentTag.js' );
	const FindingCommentLogModel = require( _directory_base + '/app/v1.0/Http/Models/FindingCommentLog.js' );
	const RatingModel = require( _directory_base + '/app/v1.0/Http/Models/Rating.js' );
	const RatingLogModel = require( _directory_base + '/app/v1.0/Http/Models/RatingLog.js' );
	const UserAuthModel = require( _directory_base + '/app/v1.0/Http/Models/UserAuth.js' );
	const SyncMobileModel = require( _directory_base + '/app/v1.0/Http/Models/SyncMobile.js' );

	// Node Module
	const Validator = require( 'ferds-validator');

	// Libraries
	const HelperLib = require( _directory_base + '/app/v1.0/Http/Libraries/HelperLib.js' );
	async function asyncForEach(array, callback) {
		for (let index = 0; index < array.length; index++) {
			await callback(array[index], index, array);
		}
	}

 	/** 
 	  * Contacts
	  * Contacts adalah data-data user pengguna Mobile Inspection untuk di
	  * gunakan pada aplikasi mobile. Tidak ada filter lokasi, semua data
	  * ditampilkan baik PJS maupun HRIS.
	  * --------------------------------------------------------------------
	*/
	const findContacts = async function( authCode ) {

		return await UserAuthModel.findOne({
			USER_AUTH_CODE:authCode
		})
		.select( {
			USER_AUTH_CODE: 1,
			EMPLOYEE_NIK: 1,
			USER_ROLE: 1,
			LOCATION_CODE: 1,
			REF_ROLE: 1,
			PJS_JOB: 1,
			PJS_FULLNAME: 1,
			HRIS_JOB: 1,
			HRIS_FULLNAME: 1
		} )
		.then( data => {
			console.log(data);
			// return data;
			
			if( !data ) {
				return [];
			}

			var results = [];
			// data.forEach( function( result ) {
				var result = Object.keys(data).map(function(k) {
					return [+k, data[k]];
				});
				result = result[3][1];


				var JOB = '';
				var FULLNAME = '';
				var location_code = result.LOCATION_CODE + '';
				var location_code_regional = '';
				
				if ( result.PJS_JOB ) { JOB = result.PJS_JOB; }
				else if( result.HRIS_JOB ) { JOB = String( result.HRIS_JOB ); }
		
				if ( result.PJS_FULLNAME ) { FULLNAME = result.PJS_FULLNAME; }
				else if( result.HRIS_FULLNAME ) { FULLNAME = result.HRIS_FULLNAME; }

				var i = 0;
				location_code.split( ',' ).forEach( function( lc ) {
					var first_char = lc.substr( 0, 1 );
					if ( lc != 'ALL' ) {
						if ( i == 0 ) {
							if ( first_char != '0' ) {
								location_code_regional += '0' + lc.substr( 0, 1 );
							}
							else {
								location_code_regional += lc;
							}
						}
						else {
							if ( first_char != '0' ) {
								location_code_regional += ',0' + lc.substr( 0, 1 );
							}
							else {
								location_code_regional += ',' + lc;
							}
						}
					}
					else {
						location_code_regional = 'ALL';
					}
					i++;
				} );

				return {
					USER_AUTH_CODE: result.USER_AUTH_CODE,
					EMPLOYEE_NIK: result.EMPLOYEE_NIK,
					USER_ROLE: result.USER_ROLE,
					LOCATION_CODE: String( result.LOCATION_CODE ),
					REF_ROLE: result.REF_ROLE,
					JOB: JOB,
					FULLNAME: FULLNAME,
					REGION_CODE: location_code_regional
				}// );
			// } );
			// console.log(results[0]);
			// return results[0];
		} ).catch( err => {
			return [];
		} );
	};


/*
 |--------------------------------------------------------------------------
 | Versi 1.0
 |--------------------------------------------------------------------------
 */
 	/** 																																																																																																																	http.Agent(options);																				ZZZZZZ
 	  * Create Or Update
	  * Untuk membuat data finding baru, jika data (berdasarkan finding code)
	  * sudah terbentuk maka akan mengupdate data.
	  * --------------------------------------------------------------------
	*/
	exports.create_or_update = async ( req, res, next ) => {
		
		// Rule Validasi
		var rules = [
			{ "name": "FINDING_CODE", "value": req.body.FINDING_CODE, "rules": "required|alpha_numeric" },
			{ "name": "WERKS", "value": req.body.WERKS, "rules": "required|numeric" },
			{ "name": "AFD_CODE", "value": req.body.AFD_CODE, "rules": "required|alpha_numeric" },
			{ "name": "BLOCK_CODE", "value": req.body.BLOCK_CODE, "rules": "required|alpha_numeric" },
			{ "name": "FINDING_CATEGORY", "value": req.body.FINDING_CATEGORY, "rules": "required|alpha_numeric" },
			{ "name": "FINDING_DESC", "value": req.body.FINDING_DESC, "rules": "required" },
			{ "name": "FINDING_PRIORITY", "value": req.body.FINDING_PRIORITY, "rules": "required|alpha" },
			{ "name": "PROGRESS", "value": req.body.PROGRESS, "rules": "required|numeric" },
			{ "name": "LAT_FINDING", "value": parseFloat( req.body.LAT_FINDING ), "rules": "required|latitude" },
			{ "name": "LONG_FINDING", "value": parseFloat( req.body.LONG_FINDING ), "rules": "required|longitude" },
			{ "name": "INSERT_USER", "value": req.body.INSERT_USER, "rules": "required|alpha_numeric" },
			//{ "name": "INSERT_TIME", "value": req.body.INSERT_TIME.toString(), "rules": "required|exact_length(14)|numeric" }
		];
		var run_validator = Validator.run( rules );
		console.log( run_validator );

		if ( run_validator.status == false ) {
			res.json( {
				status: false,
				message: "Error! Periksa kembali inputan anda.",
				data: []
			} );
		}
		else {
			var auth = req.auth;
			var check = await FindingModel
				.find( {
					FINDING_CODE : req.body.FINDING_CODE
				} )
				.select( {
					_id: 0,
					FINDING_CODE: 1
				} );

			// Jika sudah terdapat data, maka akan mengupdate Data Finding.
			if ( check.length > 0 ) {
				FindingModel.findOneAndUpdate( { 
					FINDING_CODE : req.body.FINDING_CODE
				}, {
					WERKS: req.body.WERKS || "",
					BLOCK_CODE: req.body.BLOCK_CODE || "",
					FINDING_CATEGORY: req.body.FINDING_CATEGORY || "",
					FINDING_DESC: req.body.FINDING_DESC || "",
					FINDING_PRIORITY: req.body.FINDING_PRIORITY || "",
					DUE_DATE: ( req.body.DUE_DATE == "" ) ? 0 : HelperLib.date_format( req.body.DUE_DATE, 'YYYYMMDDhhmmss' ),
					ASSIGN_TO: req.body.ASSIGN_TO || "",
					PROGRESS: req.body.PROGRESS || 0,
					LAT_FINDING: req.body.LAT_FINDING || "",
					LONG_FINDING: req.body.LONG_FINDING || "",
					REFFERENCE_INS_CODE: req.body.REFFERENCE_INS_CODE || "",
					UPDATE_USER: req.body.UPDATE_USER || "",
					UPDATE_TIME: req.body.UPDATE_TIME || 0,
					RATING_VALUE: parseInt( req.body.RATING_VALUE ) || 0,
					RATING_MESSAGE: req.body.RATING_MESSAGE || ""
				}, { new: true } )
				.then( data => {
					if ( !data ) {
						return res.send( {
							status: false,
							message: config.app.error_message.put_404,
							data: {}
						} );
					}
					
					// Insert Finding Log
					const set_log = new FindingLogModel( {
						FINDING_CODE: req.body.FINDING_CODE,
						PROSES: 'UPDATE',
						PROGRESS: req.body.PROGRESS,
						IMEI: auth.IMEI,
						SYNC_TIME: req.body.INSERT_TIME || 0,
						SYNC_USER: req.body.INSERT_USER,
					} );

					set_log.save()
					.then( async data_log => {
						if ( !data_log ) {
							return res.send( {
								status: false,
								message: config.app.error_message.create_404 + ' - Log',
								data: {}
							} );
						}

						next();

						return res.send( {
							status: true,
							message: config.app.error_message.put_200 + 'Data berhasil diupdate.',
							data: {}
						} );
					} ).catch( err => {
						return res.send( {
							status: false,
							message: config.app.error_message.create_500 + ' - 2',
							data: {}
						} );
					} );
				} ).catch( err => {
					return res.send( {
						status: false,
						message: config.app.error_message.put_500,
						data: {}
					} );
				} );
			}
			// Insert Data Finding
			else {
				const set_data = new FindingModel( {
					FINDING_CODE: req.body.FINDING_CODE || "",
					WERKS: req.body.WERKS || "",
					AFD_CODE: req.body.AFD_CODE || "",
					BLOCK_CODE: req.body.BLOCK_CODE || "",
					FINDING_CATEGORY: req.body.FINDING_CATEGORY || "",
					FINDING_DESC: req.body.FINDING_DESC || "",
					FINDING_PRIORITY: req.body.FINDING_PRIORITY || "",
					DUE_DATE: HelperLib.date_format( req.body.DUE_DATE, 'YYYYMMDDhhmmss' ),
					ASSIGN_TO: req.body.ASSIGN_TO || "",
					PROGRESS: req.body.PROGRESS || "",
					LAT_FINDING: req.body.LAT_FINDING || "",
					LONG_FINDING: req.body.LONG_FINDING || "",
					REFFERENCE_INS_CODE: req.body.REFFERENCE_INS_CODE || "",
					INSERT_USER: req.body.INSERT_USER,
					INSERT_TIME: req.body.INSERT_TIME || 0,
					UPDATE_USER: req.body.UPDATE_USER || "",
					UPDATE_TIME: req.body.UPDATE_TIME || 0,
					DELETE_USER: "",
					DELETE_TIME: 0,
					RATING_VALUE: parseInt( req.body.RATING_VALUE ) || 0,
					RATING_MESSAGE: req.body.RATING_MESSAGE || ""
				} );

				set_data.save()
				.then( data => {
					if ( !data ) {
						return res.send( {
							status: false,
							message: config.app.error_message.create_404,
							data: {}
						} );
					}
					// Insert Finding Log
					const set_log = new FindingLogModel( {
						FINDING_CODE: req.body.FINDING_CODE,
						PROSES: 'INSERT',
						PROGRESS: req.body.PROGRESS,
						IMEI: auth.IMEI,
						SYNC_TIME: HelperLib.date_format( req.body.INSERT_TIME, 'YYYYMMDDhhmmss' ),
						SYNC_USER: req.body.INSERT_USER,
					} );

					set_log.save()
					.then( data_log => {
						if ( !data_log ) {
							return res.send( {
								status: false,
								message: config.app.error_message.create_404 + ' - Log',
								data: {}
							} );
						}
						res.send( {
							status: true,
							message: config.app.error_message.create_200,
							data: {}
						} );
					} ).catch( err => {
						res.send( {
							status: false,
							message: config.app.error_message.create_500 + ' - 2',
							data: {}
						} );
					} );
				} ).catch( err => {
					res.send( {
						status: false,
						message: config.app.error_message.create_500,
						data: {}
					} );
				} );
			}
		}
	};

	exports.create_or_update_comment = async ( req, res ) => {
		
		// Rule Validasi
		var rules = [
			{ "name": "FINDING_COMMENT_ID", "value": req.body.FINDING_COMMENT_ID, "rules": "required|alpha_numeric" },
			{ "name": "FINDING_CODE", "value": req.body.FINDING_CODE, "rules": "required|alpha_numeric" },
			{ "name": "USER_AUTH_CODE", "value": req.body.USER_AUTH_CODE, "rules": "required|alpha_numeric" },
			{ "name": "MESSAGE", "value": req.body.MESSAGE, "rules": "required" }
		];
		var run_validator = Validator.run( rules );

		if ( run_validator.status == false ) {
			res.json( {
				status: false,
				message: "Error! Periksa kembali inputan anda.",
				data: run_validator
			} );
		}
		else {
			var auth = req.auth;
			var check = await FindingCommentModel
				.find( {
					FINDING_COMMENT_ID : req.body.FINDING_COMMENT_ID
				} )
				.select( {
					_id: 0,
					FINDING_COMMENT_ID: 1
				} );

			// Jika sudah terdapat data, maka akan mengupdate Data Finding.
			if ( check.length > 0 ) {
				FindingModel.findOneAndUpdate( { 
					FINDING_CODE : req.body.FINDING_CODE
				}, {
					WERKS: req.body.WERKS || "",
					BLOCK_CODE: req.body.BLOCK_CODE || "",
					FINDING_CATEGORY: req.body.FINDING_CATEGORY || "",
					FINDING_DESC: req.body.FINDING_DESC || "",
					FINDING_PRIORITY: req.body.FINDING_PRIORITY || "",
					//DUE_DATE: Number( req.body.DUE_DATE ) || 0,
					DUE_DATE: ( req.body.DUE_DATE == "" ) ? 0 : HelperLib.date_format( req.body.DUE_DATE, 'YYYYMMDDhhmmss' ),
					ASSIGN_TO: req.body.ASSIGN_TO || "",
					PROGRESS: req.body.PROGRESS || "",
					LAT_FINDING: req.body.LAT_FINDING || "",
					LONG_FINDING: req.body.LONG_FINDING || "",
					REFFERENCE_INS_CODE: req.body.REFFERENCE_INS_CODE || "",
					UPDATE_USER: req.body.UPDATE_USER,
					UPDATE_TIME: req.body.UPDATE_TIME
				}, { new: true } )
				.then( data => {
					if ( !data ) {
						return res.send( {
							status: false,
							message: config.app.error_message.put_404,
							data: {}
						} );
					}
					
					// Insert Finding Log
					const set_log = new FindingLogModel( {
						FINDING_CODE: req.body.FINDING_CODE,
						PROSES: 'UPDATE',
						PROGRESS: req.body.PROGRESS,
						IMEI: auth.IMEI,
						SYNC_TIME: req.body.INSERT_TIME || 0,
						SYNC_USER: req.body.INSERT_USER,
					} );

					set_log.save()
					.then( data_log => {
						if ( !data_log ) {
							return res.send( {
								status: false,
								message: config.app.error_message.create_404 + ' - Log',
								data: {}
							} );
						}
						if(req.body.RATING){
							// Insert Rating
							const set_rating = new RatingModel( {
								FINDING_CODE: req.body.RATING.FINDING_CODE,
								RATE: req.body.RATING.RATE,
								MESSAGE: req.body.RATING.MESSAGE
							} );
							set_rating.save().then(data=>{
								if ( !data ) {
									return res.send( {
										status: false,
										message: config.app.error_message.create_404 + ' - Rating',
										data: {}
									} );
								}
								// Insert Rating Log
								const set_rating_log = new RatingLogModel( {
									FINDING_CODE: req.body.FINDING_CODE,
									PROSES: 'INSERT',
									IMEI: auth.IMEI,
									SYNC_TIME: req.body.INSERT_TIME || 0,
									SYNC_USER: req.body.INSERT_USER,
								} );
								set_rating_log.save().then(data=>{
									if ( !data ) {
										return res.send( {
											status: false,
											message: config.app.error_message.create_404 + ' - Rating Log',
											data: {}
										} );
									}
									res.send( {
										status: true,
										message: config.app.error_message.put_200 + 'Data berhasil diupdate.',
										data: {}
									} );
								}).catch( err => {
									res.send( {
										status: false,
										message: config.app.error_message.create_500 + ' - Rating Log',
										data: {}
									} );
								} );
							}).catch( err => {
								res.send( {
									status: false,
									message: config.app.error_message.create_500 + ' - Rating',
									data: {}
								} );
							} );
						}
						res.send( {
							status: true,
							message: config.app.error_message.put_200 + 'Data berhasil diupdate.',
							data: {}
						} );
					} ).catch( err => {
						res.send( {
							status: false,
							message: config.app.error_message.create_500 + ' - 2',
							data: {}
						} );
					} );
				} ).catch( err => {
					res.send( {
						status: false,
						message: config.app.error_message.put_500,
						data: {}
					} );
				} );
			}
			// Insert Data Finding
			else {
				const set_data = new FindingCommentModel( {
					FINDING_COMMENT_ID: req.body.FINDING_COMMENT_ID || "",
					FINDING_CODE: req.body.FINDING_CODE || "",
					USER_AUTH_CODE: req.body.USER_AUTH_CODE || "",
					MESSAGE: req.body.MESSAGE || "",
					INSERT_TIME: req.body.INSERT_TIME || 0
				} );

				set_data.save()
				.then( data => {
					if ( !data ) {
						return res.send( {
							status: false,
							message: config.app.error_message.create_404,
							data: {}
						} );
					}
					if(req.body.TAG_USER&&Array.isArray(req.body.TAG_USER)){
						req.body.TAG_USER.forEach( function( tag ) {
							const set_tag = new FindingCommentTagModel({
								FINDING_COMMENT_ID: req.body.FINDING_COMMENT_ID,
								USER_AUTH_CODE: tag.USER_AUTH_CODE
							});
							set_tag.save()
							.then( data_tag => {
								if ( !data_tag ) {
									return res.send( {
										status: false,
										message: config.app.error_message.create_404 + ' - Log',
										data: {}
									} );
								}
							} ).catch( err => {
								return res.send( {
									status: false,
									message: config.app.error_message.create_500 + ' - 2',
									data: {}
								} );
							} );
						});
					}

					// Insert Finding Log
					const set_log = new FindingCommentLogModel( {
						FINDING_COMMENT_ID: req.body.FINDING_COMMENT_ID,
						PROSES: 'INSERT',
						IMEI: auth.IMEI,
						SYNC_TIME: HelperLib.date_format( req.body.INSERT_TIME, 'YYYYMMDDhhmmss' )
					} );
					set_log.save()
					.then( data_log => {
						if ( !data_log ) {
							return res.send( {
								status: false,
								message: config.app.error_message.create_404 + ' - Log',
								data: {}
							} );
						}
						res.send( {
							status: true,
							message: config.app.error_message.create_200,
							data: {}
						} );
					} ).catch( err => {
						res.send( {
							status: false,
							message: config.app.error_message.create_500 + ' - 2',
							data: {}
						} );
					} );
				} ).catch( err => {
					res.send( {
						status: false,
						message: config.app.error_message.create_500,
						data: {}
					} );
				} );
			}
		}
	}

	/** 
 	  * Find
	  * Untuk mengambil data finding berdasarkan location code yang diperoleh
	  * dari token yang dikirimkan.
	  * --------------------------------------------------------------------
	*/
	exports.find = ( req, res ) => {
		var auth = req.auth;
		var location_code_group = String( auth.LOCATION_CODE ).split( ',' );
		var ref_role = auth.REFFERENCE_ROLE;
		var location_code_final = [];
		var query_search = [];
		var afd_code = [];

		if ( ref_role != 'ALL' ) {
			location_code_group.forEach( function( data ) {
				switch ( ref_role ) {
					case 'REGION_CODE':
						location_code_final.push( data.substr( 1, 1 ) );
					break;
					case 'COMP_CODE':
						location_code_final.push( data.substr( 0, 2 ) );
					break;
					case 'AFD_CODE':
						location_code_final.push( data );
					break;
					case 'BA_CODE':
						location_code_final.push( data.substr( 0, 4 ) );
					break;
				}
			} );
		}

		switch ( ref_role ) {
			case 'REGION_CODE':
				location_code_final.forEach( function( q ) {
					query_search.push( new RegExp( '^' + q.substr( 0, 1 ) ) );
				} );
			break;
			case 'COMP_CODE':
				location_code_final.forEach( function( q ) {
					query_search.push( new RegExp( '^' + q.substr( 0, 2 ) ) );
				} );
			break;
			case 'AFD_CODE':
				location_code_final.forEach( function( q ) {
					query_search.push( new RegExp( '^' + q.substr( 0, 4 ) ) )
					afd_code = q.substr( 4, 10 );
				} );
			break;
			case 'BA_CODE':
				location_code_final.forEach( function( q ) {
					query_search.push( q );
				} );
			break;
		
		}

		if ( ref_role == 'NATIONAL' ) {
			var qs = {
				DELETE_USER: ""
			}
		}
		else {
			var qs = {
				DELETE_USER: "",
				// WERKS: {"$in":query_search}
			}
		}

		FindingModel.aggregate( [
			{ 
				"$project" : {
					"_id" : 0.0, 
					"DELETE_TIME" : 0.0, 
					"__v" : 0.0
				}
			}, 
			{ 
				"$sort" : {
					"INSERT_TIME" : -1.0
				}
			}, 
			{ 
				"$match" : qs
			}
 		] )
		.then( data => {
			// console.log("XXX");
			// console.log(data);
			if( !data ) {
				return res.send( {
					status: false,
					message: config.app.error_message.find_404,
					data: {}
				} );
			}

			var results = [];
			data.forEach( function( result ) {
				console.log(result);

				results.push( {
					FINDING_CODE: result.FINDING_CODE,
					WERKS: result.WERKS,
					AFD_CODE: result.AFD_CODE,
					BLOCK_CODE: result.BLOCK_CODE,
					FINDING_CATEGORY: result.FINDING_CATEGORY,
					FINDING_DESC: result.FINDING_DESC,
					FINDING_PRIORITY: result.FINDING_PRIORITY,
					DUE_DATE: HelperLib.date_format( String( result.DUE_DATE ), 'YYYY-MM-DD hh-mm-ss' ),
					//DUE_DATE: Number( result.INSERT_TIME ),
					//DUE_DATE: Number( data.DUE_DATE ) || 0,
					STATUS: HelperLib.status_finding( result.PROGRESS ),
					ASSIGN_TO: result.ASSIGN_TO,
					//PROGRESS: result.PROGRESS,
					PROGRESS: Number( result.PROGRESS ),
					LAT_FINDING: result.LAT_FINDING,
					LONG_FINDING: result.LONG_FINDING,
					REFFERENCE_INS_CODE: result.REFFERENCE_INS_CODE,
					// RATING: rating_column,
					INSERT_USER: result.INSERT_USER,
					INSERT_TIME: HelperLib.date_format( String( result.INSERT_TIME ), 'YYYY-MM-DD hh-mm-ss' ),
					UPDATE_USER: result.UPDATE_USER || '',
					UPDATE_TIME: HelperLib.date_format( String( result.UPDATE_TIME ), 'YYYY-MM-DD hh-mm-ss' ),
					STATUS_SYNC: "Y",
					RATING_VALUE: result.RATING_VALUE,
					RATING_MESSAGE: result.RATING_MESSAGE,
					//INSERT_TIME: HelperLib.date_format( String( result.INSERT_TIME ), 'YYYY-MM-DD hh-mm-ss' ),
				} );

			} );

			res.send( {
				status: true,
				message: config.app.error_message.find_200,
				data: results
			} );
		} ).catch( err => {
			res.send( {
				status: false,
				message: config.app.error_message.find_500,
				data: {}
			} );
		} );
	};
	
	exports.findComment = async ( req, res ) => {

		// Get tanggal terakhir sync dari s_auth.T_MOBILE_SYNC
		var check_mobile_sync = await SyncMobileModel.aggregate( [
			{
				$match: {
					INSERT_USER: req.auth.USER_AUTH_CODE,
					IMEI: req.auth.IMEI,
					TABEL_UPDATE: "finding"
				}
			},
			{
				$sort: {
					TGL_MOBILE_SYNC: -1
				}
			},
			{
				$limit: 1
			}
		] );


		var auth = req.auth;
		var location_code_group = String( auth.LOCATION_CODE ).split( ',' );
		var ref_role = auth.REFFERENCE_ROLE;
		var location_code_final = [];
		var query_search = [];
		var afd_code = [];

		if ( ref_role != 'ALL' ) {
			location_code_group.forEach( function( data ) {
				switch ( ref_role ) {
					case 'REGION_CODE':
						location_code_final.push( data.substr( 1, 1 ) );
					break;
					case 'COMP_CODE':
						location_code_final.push( data.substr( 0, 2 ) );
					break;
					case 'AFD_CODE':
						location_code_final.push( data );
					break;
					case 'BA_CODE':
						location_code_final.push( data.substr( 0, 4 ) );
					break;
				}
			} );
		}

		switch ( ref_role ) {
			case 'REGION_CODE':
				location_code_final.forEach( function( q ) {
					query_search.push( new RegExp( '^' + q.substr( 0, 1 ) ) );
				} );
			break;
			case 'COMP_CODE':
				location_code_final.forEach( function( q ) {
					query_search.push( new RegExp( '^' + q.substr( 0, 2 ) ) );
				} );
			break;
			case 'AFD_CODE':
				location_code_final.forEach( function( q ) {
					query_search.push( new RegExp( '^' + q.substr( 0, 4 ) ) )
					afd_code = q.substr( 4, 10 );
				} );
			break;
			case 'BA_CODE':
				location_code_final.forEach( function( q ) {
					query_search.push( q );
				} );
			break;
		
		}

		if ( ref_role != 'NATIONAL' ) {
			var qs = {
				DELETE_USER: "",
			}
		}
		else {
			var qs = {
				DELETE_USER: "",
				WERKS: query_search
			}
		}

		var now = HelperLib.date_format( 'now', 'YYYYMMDD' ).substr( 0, 8 );
		var tanggal_terakhir_sync = ( check_mobile_sync.length == 1 ? ( check_mobile_sync[0].TGL_MOBILE_SYNC.toString() ).substr( 0, 8 ) + '000000' : 0 );
		var start_date = parseInt( tanggal_terakhir_sync );
		var end_date = parseInt( now + '235959' );
		qs["$and"] = [ {
			"$or": [
				{
					"INSERT_TIME": {
						"$gte": parseInt( start_date ),
						"$lte": parseInt( end_date )
					}
				},
				{
					"UPDATE_TIME": {
						"$gte": parseInt( start_date ),
						"$lte": parseInt( end_date )
					}
				},
				{
					"DELETE_TIME": {
						"$gte": parseInt( start_date ),
						"$lte": parseInt( end_date )
					}
				}
			]
		} ];

		FindingModel.aggregate( [
			{
				"$match": qs
			},
			{
		        "$lookup" : {
		            "from" : "VIEW_COMMENT", 
		            "localField" : "FINDING_CODE", 
		            "foreignField" : "FINDING_CODE", 
		            "as" : "comment"
		        }
		    },
		    {
		        "$project": {
		            "_id": 0,
		            "__v": 0
		        }
		    }
			/*
			{ 
				"$lookup" : {
					"from" : "TR_FINDING_COMMENT", 
					"localField" : "FINDING_CODE", 
					"foreignField" : "FINDING_CODE", 
					"as" : "comment"
				}
			}, 
			{ 
				"$lookup" : {
					"from" : "TR_FINDING_COMMENT_TAG", 
					"localField" : "comment.FINDING_COMMENT_ID", 
					"foreignField" : "FINDING_COMMENT_ID", 
					"as" : "tag"
				}
			}, 
			{ 
				"$unwind" : {
					"path" : "$comment", 
					"preserveNullAndEmptyArrays" : false
				}
			}
			*/
 		] )
		.then( async data => {
			// console.log(data);
			if( !data ) {
				return res.send( {
					status: false,
					message: config.app.error_message.find_404,
					data: {}
				} );
			}
			var temp_insert = [];
			var temp_update = [];
			var temp_delete = [];
			await asyncForEach( data, async function( result ) {

				// console.log(result);
				if ( result.comment.length > 0 ) {
					for ( var n = 0; n < result.comment.length; n++ ) {
						var ini_tags = [];
							console.log("A");
						if ( result.comment[n].tag.length > 0 ) {
							for( var i = 0; i < result.comment[n].tag.length; i++ ) {
								var contact = await findContacts( result.comment[n].tag[i].USER_AUTH_CODE );
								var ccc = Object.values( contact );
								// console.log(ccc);
								ini_tags.push( {
									USER_AUTH_CODE: ccc[0],
									EMPLOYEE_NIK: ccc[1],
									USER_ROLE: ccc[2],
									LOCATION_CODE: ccc[3],
									REF_ROLE: ccc[4],
									JOB: ccc[5],
									FULLNAME: ccc[6]
								} );
							}
						}

						var contact_comment = await findContacts( result.comment[n].USER_AUTH_CODE );
						var con_comment = Object.values( contact_comment );

						// console.log(con_comment);
						if ( result.DELETE_TIME >= start_date && result.DELETE_TIME <= end_date ) {
							temp_delete.push( {
								FINDING_COMMENT_ID: result.comment[n].FINDING_COMMENT_ID,
								FINDING_CODE: result.comment[n].FINDING_CODE,
								USER_AUTH_CODE: result.comment[n].USER_AUTH_CODE,
								FULLNAME: con_comment[6],
								MESSAGE: result.comment[n].MESSAGE,
								INSERT_TIME: result.comment[n].INSERT_TIME,
								TAGS: ini_tags
							} );
						}

						if ( result.INSERT_TIME >= start_date && result.INSERT_TIME <= end_date ) {
							temp_insert.push( {
								FINDING_COMMENT_ID: result.comment[n].FINDING_COMMENT_ID,
								FINDING_CODE: result.comment[n].FINDING_CODE,
								USER_AUTH_CODE: result.comment[n].USER_AUTH_CODE,
								FULLNAME: con_comment[6],
								MESSAGE: result.comment[n].MESSAGE,
								INSERT_TIME: result.comment[n].INSERT_TIME,
								TAGS: ini_tags
							} );
						}

						if ( result.UPDATE_TIME >= start_date && result.UPDATE_TIME <= end_date ) {
							temp_update.push( {
								FINDING_COMMENT_ID: result.comment[n].FINDING_COMMENT_ID,
								FINDING_CODE: result.comment[n].FINDING_CODE,
								USER_AUTH_CODE: result.comment[n].USER_AUTH_CODE,
								FULLNAME: con_comment[6],
								MESSAGE: result.comment[n].MESSAGE,
								INSERT_TIME: result.comment[n].INSERT_TIME,
								TAGS: ini_tags
							} );
						}
					}
				}
			} );

			return res.send( {
				status: true,
				message: config.app.error_message.find_200,
				data: {
					"hapus": temp_delete,
					"simpan": temp_insert,
					"ubah": temp_update
				}
			} );
		} ).catch( err => {
			console.log(err);
			res.send( {
				status: false,
				message: config.app.error_message.find_500,
				data: {}
			} );
		} );
	}

	/** 
 	  * Find All/Query
	  * Untuk mengambil data finding berdasarkan URL query. Contohnya :
	  * http://URL.DOMAIN/finding/q?WERKS=4421&FINDING_CODE=ABC123
	  * Jika URL query tidak diisi, maka akan menampilkan seluruh data.
	  * --------------------------------------------------------------------
	*/
	exports.findAll = ( req, res ) => {

		var url_query = req.query;
		var url_query_length = Object.keys( url_query ).length;
		var query = {};
			query.DELETE_USER = "";

		if ( req.query.WERKS ) {
			var length_werks = String( req.query.WERKS ).length;

			if ( length_werks < 4 ) {
				query.WERKS = new RegExp( '^' + req.query.WERKS );
			}
			else {
				query.WERKS = req.query.WERKS;
			}
		}

		if ( req.query.AFD_CODE ) {
			query.AFD_CODE = req.query.AFD_CODE;
		}

		if ( req.query.BLOCK_CODE ) {
			query.BLOCK_CODE = req.query.BLOCK_CODE;
		}

		FindingModel.aggregate( [
	        { 
	            "$project" : {
	                "_id" : 0.0, 
	                "__v" : 0.0
	            }
	        }, 
	        { 
	            "$sort" : {
	                "INSERT_TIME" : -1.0
	            }
	        }, 
	        { 
	            "$match" : qs
	        }
		] )
		.then( data => {
			if( !data ) {
				return res.send( {
					status: false,
					message: config.app.error_message.find_404,
					data: {}
				} );
			}
			var results = [];
			data.forEach( function( result ) {
				results.push( {
					FINDING_CODE: result.FINDING_CODE,
					WERKS: result.WERKS,
					AFD_CODE: result.AFD_CODE,
					BLOCK_CODE: result.BLOCK_CODE,
					FINDING_CATEGORY: result.FINDING_CATEGORY,
					FINDING_DESC: result.FINDING_DESC,
					FINDING_PRIORITY: result.FINDING_PRIORITY,
					DUE_DATE: HelperLib.date_format( String( result.DUE_DATE ), 'YYYY-MM-DD hh-mm-ss' ),
					STATUS: HelperLib.status_finding( result.PROGRESS ),
					ASSIGN_TO: result.ASSIGN_TO,
					PROGRESS: result.PROGRESS,
					LAT_FINDING: result.LAT_FINDING,
					LONG_FINDING: result.LONG_FINDING,
					REFFERENCE_INS_CODE: result.REFFERENCE_INS_CODE,
					INSERT_USER: result.INSERT_USER,
					INSERT_TIME: HelperLib.date_format( String( result.INSERT_TIME ), 'YYYY-MM-DD hh-mm-ss' ),
					UPDATE_USER: result.UPDATE_USER,
					UPDATE_TIME: HelperLib.date_format( String( result.UPDATE_TIME ), 'YYYY-MM-DD hh-mm-ss' ),
					RATING_VALUE: data.RATING_VALUE,
					RATING_MESSAGE: data.RATING_MESSAGE,
				} );
			} );

			res.send( {
				status: true,
				message: config.app.error_message.find_200,
				data: results
			} );
		} ).catch( err => {
			res.send( {
				status: false,
				message: config.app.error_message.find_500,
				data: {}
			} );
		} );
	};

	/** 
 	  * Find One
	  * Untuk mengambil saty row data Finding berdasarkan Finding Code. 
	  * --------------------------------------------------------------------
	*/
	exports.findOne = ( req, res ) => {

		FindingModel.findOne( { 
			FINDING_CODE : req.params.id,
			DELETE_USER: ""
		} )
		.select( {
			_id: 0,
			DELETE_USER: 0,
			DELETE_TIME: 0,
			__v: 0
		} )
		.then( data => {
			if( !data ) {
				return res.send( {
					status: false,
					message: config.app.error_message.find_404,
					data: {}
				} );
			}
			var rowdata = {
				FINDING_CODE: data.FINDING_CODE,
				WERKS: data.WERKS,
				AFD_CODE: data.AFD_CODE,
				BLOCK_CODE: data.BLOCK_CODE,
				FINDING_CATEGORY: data.FINDING_CATEGORY,
				FINDING_DESC: data.FINDING_DESC,
				FINDING_PRIORITY: data.FINDING_PRIORITY,
				DUE_DATE: HelperLib.date_format( String( data.DUE_DATE ), 'YYYY-MM-DD hh-mm-ss' ),
				STATUS: HelperLib.status_finding( data.PROGRESS ),
				ASSIGN_TO: data.ASSIGN_TO,
				PROGRESS: Number( data.PROGRESS ),
				LAT_FINDING: data.LAT_FINDING,
				LONG_FINDING: data.LONG_FINDING,
				REFFERENCE_INS_CODE: data.REFFERENCE_INS_CODE,
				INSERT_USER: data.INSERT_USER,
				INSERT_TIME: HelperLib.date_format( String( data.INSERT_TIME ), 'YYYY-MM-DD hh-mm-ss' ),
				STATUS_SYNC: "Y"
			};
			res.send( {
				status: true,
				message: config.app.error_message.find_200,
				data: rowdata
			} );
		} ).catch( err => {
			res.send( {
				status: false,
				message: config.app.error_message.find_500,
				data: {}
			} );
		} );
	};
