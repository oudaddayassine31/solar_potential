import {
	Vector3
} from 'three';
import earcut from 'earcut';

import { TRIANGLES, GeometryData } from './GeometryData.js';
import { BaseParser } from './BaseParser.js';

export class TriangleParser extends BaseParser {

	constructor( json, objectIds, objectColors, vertices ) {

		super( json, objectIds, objectColors );

		if ( vertices ) {

			this.vertices = vertices;

		} else {

			this.vertices = this.json.vertices;

		}

		this.geomData = new GeometryData( TRIANGLES );

	}

	clean() {

		this.geomData = new GeometryData( TRIANGLES );

	}

	/**
	 * Flattens the given geometry, meaning that a Solid or MultiSolid will be
	 * basically converted to a MultiSuface
	 */
	flattenGeometry( geometry ) {

		const geometryType = geometry.type;

		if ( geometryType == "MultiSurface" || geometryType == "CompositeSurface" ) {

			return geometry;

		}

		if ( geometryType == "Solid" ) {

			const newGeometry = Object.assign( {}, geometry );

			newGeometry.boundaries = geometry.boundaries.flat( 1 );

			if ( geometry.semantics ) {

				newGeometry.semantics.values = geometry.semantics.values.flat( 1 );

			}

			if ( geometry.material ) {

				for ( const theme in geometry.material ) {

					newGeometry.material[ theme ].values = geometry.material[ theme ].values.flat( 1 );

				}

			}

			if ( geometry.texture ) {

				for ( const theme in geometry.texture ) {

					newGeometry.texture[ theme ].values = geometry.texture[ theme ].values.flat( 1 );

				}

			}

			return newGeometry;

		}

		if ( geometryType == "MultiSolid" || geometryType == "CompositeSolid" ) {

			const newGeometry = Object.assign( {}, geometry );

			newGeometry.boundaries = geometry.boundaries.flat( 2 );

			if ( geometry.semantics ) {

				newGeometry.semantics.values = geometry.semantics.values.flat( 2 );

			}

			if ( geometry.material ) {

				for ( const theme in geometry.material ) {

					newGeometry.material[ theme ].values = geometry.material[ theme ].values.flat( 2 );

				}

			}

			if ( geometry.texture ) {

				for ( const theme in geometry.texture ) {

					newGeometry.texture[ theme ].values = geometry.texture[ theme ].values.flat( 2 );

				}

			}

			return newGeometry;

		}

	}

	parseGeometry( geometry, objectId, geomIdx ) {

		const cityObj = this.json.CityObjects[ objectId ];

		const idIdx = cityObj ? this.getObjectIdx( objectId ) : - 1;
		const objType = cityObj ? this.getObjectTypeIdx( cityObj.type ) : - 1;
		const lodIdx = this.getLodIndex( geometry.lod );

		// We flatten the geometry to a MultiSurface, basically, so that it's
		// easily parsable.
		const flatGeometry = this.flattenGeometry( geometry );

		if ( flatGeometry ) {

			this.parseShell( flatGeometry, idIdx, objType, geomIdx, lodIdx );

		}


	}

	parseShell( geometry, idIdx, objType, geomIdx, lodIdx ) {

		const boundaries = geometry.boundaries;
		const semantics = geometry.semantics ? geometry.semantics.values : [];
		const surfaces = geometry.semantics ? geometry.semantics.surfaces : [];
		const material = geometry.material ? geometry.material : {};
		const texture = geometry.texture ? geometry.texture : {};

		// Contains the boundary but with the right verticeId
		for ( let i = 0; i < boundaries.length; i ++ ) {

			let boundary = [];
			let holes = [];

			const surfaceType = this.getSurfaceTypeIdx( i, semantics, surfaces );
			const classType = this.getSurfaceClassIdx(i, semantics, surfaces); //geoscity
			const materialValue = this.getSurfaceMaterials( i, material );

			for ( let j = 0; j < boundaries[ i ].length; j ++ ) {

				if ( boundary.length > 0 ) {

					holes.push( boundary.length );

				}

				// const new_boundary = this.extractLocalIndices( geom, boundaries[ i ][ j ], vertices, json );
				// boundary.push( ...new_boundary );
				boundary.push( ...boundaries[ i ][ j ] );

			}

			if ( boundary.length == 3 ) {

				for ( let n = 0; n < 3; n ++ ) {

					this.geomData.addVertex( boundary[ n ],
											 idIdx,
											 objType,
											 surfaceType,
											 classType, // geoscity
											 geomIdx,
											 i,
											 lodIdx,
											 materialValue,
											 this.getTextureData( i, n, holes, texture ) );

				}


			} else if ( boundary.length > 3 ) {

				//create list of points
				let pList = [];
				for ( let k = 0; k < boundary.length; k ++ ) {

					pList.push( {
						x: this.vertices[ boundary[ k ] ][ 0 ],
						y: this.vertices[ boundary[ k ] ][ 1 ],
						z: this.vertices[ boundary[ k ] ][ 2 ]
					} );

				}

				//get normal of these points
				const normal = this.getNewellsNormal( pList );

				//convert to 2d (for triangulation)
				let pv = [];
				for ( let k = 0; k < pList.length; k ++ ) {

					const re = this.to_2d( pList[ k ], normal );
					pv.push( re.x );
					pv.push( re.y );

				}

				//triangulate
				const tr = earcut( pv, holes, 2 );

				// create faces based on triangulation
				for ( let k = 0; k < tr.length; k += 3 ) {

					for ( let n = 0; n < 3; n ++ ) {

						const vertex = boundary[ tr[ k + n ] ];

						this.geomData.addVertex( vertex,
											 	 idIdx,
												 objType,
												 surfaceType,
												 classType,//geoscity
												 geomIdx,
												 i,
												 lodIdx,
												 materialValue,
												 this.getTextureData( i, tr[ k + n ], holes, texture ) );

					}

				}

			}

		}

	}

	getNewellsNormal( indices ) {

		// find normal with Newell's method
		let n = [ 0.0, 0.0, 0.0 ];

		for ( let i = 0; i < indices.length; i ++ ) {

			let nex = i + 1;

			if ( nex == indices.length ) {

				nex = 0;

			}

			n[ 0 ] = n[ 0 ] + ( ( indices[ i ].y - indices[ nex ].y ) * ( indices[ i ].z + indices[ nex ].z ) );
			n[ 1 ] = n[ 1 ] + ( ( indices[ i ].z - indices[ nex ].z ) * ( indices[ i ].x + indices[ nex ].x ) );
			n[ 2 ] = n[ 2 ] + ( ( indices[ i ].x - indices[ nex ].x ) * ( indices[ i ].y + indices[ nex ].y ) );

		}

		let b = new Vector3( n[ 0 ], n[ 1 ], n[ 2 ] );
		return ( b.normalize() );

	}

	to_2d( p, n ) {

		p = new Vector3( p.x, p.y, p.z );
		let x3 = new Vector3( 1.1, 1.1, 1.1 );
		if ( x3.distanceTo( n ) < 0.01 ) {

			x3.add( new Vector3( 1.0, 2.0, 3.0 ) );

		}

		let tmp = x3.dot( n );
		let tmp2 = n.clone();
		tmp2.multiplyScalar( tmp );
		x3.sub( tmp2 );
		x3.normalize();
		let y3 = n.clone();
		y3.cross( x3 );
		let x = p.dot( x3 );
		let y = p.dot( y3 );
		let re = { x: x, y: y };
		return re;

	}

}