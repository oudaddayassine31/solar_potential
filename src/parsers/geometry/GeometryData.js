// Geometry types
export const POINTS = 0;
export const LINES = 1;
export const TRIANGLES = 2;

export class GeometryData {

	constructor( geometryType ) {

		this.geometryType = geometryType;

		this.vertexIds = [];
		this.objectIds = [];
		this.objectTypes = [];
		this.semanticSurfaces = [];
		this.semanticClasses = []; // geoscity
		this.geometryIds = [];
		this.boundaryIds = [];
		this.lodIds = [];
		this.materials = {};
		this.textures = {};

	}

	appendMaterial( theme, v ) {

		if ( ! ( theme in this.materials ) ) {

			this.materials[ theme ] = [];

		}

		const themeArray = this.materials[ theme ];

		for ( let i = themeArray.length; i < this.count() - 1; i ++ ) {

			themeArray.push( - 1 );

		}

		this.materials[ theme ].push( v );

	}

	appendTexture( theme, values ) {

		if ( ! ( theme in this.textures ) ) {

			this.textures[ theme ] = {
				index: [],
				uvs: []
			};

		}

		const themeObject = this.textures[ theme ];

		for ( let i = themeObject.index.length; i < this.count() - 1; i ++ ) {

			themeObject.index.push( - 1 );
			themeObject.uvs.push( [ 0, 0 ] );

		}

		themeObject.index.push( values.index );
		themeObject.uvs.push( values.uvs );

	}

	addVertex( vertexId, objectId, objectType, surfaceType,classType , geometryIdx, boundaryIdx, lodIdx, material, texture) {

		this.vertexIds.push( vertexId );
		this.objectIds.push( objectId );
		this.objectTypes.push( objectType );
		this.semanticSurfaces.push( surfaceType );
		this.semanticClasses.push(classType); // geoscity
		this.geometryIds.push( geometryIdx );
		this.boundaryIds.push( boundaryIdx );
		this.lodIds.push( lodIdx );

		if ( material ) {

			const context = this;

			Object.entries( material ).forEach( entry => {

				const [ theme, value ] = entry;

				context.appendMaterial( theme, value );

			} );

		}

		if ( texture ) {

			const context = this;

			Object.entries( texture ).forEach( entry => {

				const [ theme, value ] = entry;

				context.appendTexture( theme, value );

			} );

		}

	}

	completeMaterials() {

		for ( const theme in this.materials ) {

			const themeArray = this.materials[ theme ];

			for ( let i = themeArray.length; i < this.count(); i ++ ) {

				themeArray.push( - 1 );

			}

		}

	}

	completeTextures() {

		for ( const theme in this.textures ) {

			const themeObject = this.textures[ theme ];

			for ( let i = themeObject.index.length; i < this.count(); i ++ ) {

				themeObject.index.push( - 1 );
				themeObject.uvs.push( [ 0, 0 ] );

			}

		}

	}

	count() {

		return this.vertexIds.length;

	}

	getVertices( vertexList ) {

		let vertices = [];

		for ( const vertexIndex of this.vertexIds ) {

			const vertex = vertexList[ vertexIndex ];

			vertices.push( ...vertex );

		}

		return vertices;

	}

	toObject() {

		this.completeMaterials();
		this.completeTextures();

		return {
			geometryType: this.geometryType,
			objectIds: this.objectIds,
			objectType: this.objectTypes,
			semanticSurfaces: this.semanticSurfaces,
			semanticClasses: this.semanticClasses, // geoscity
			geometryIds: this.geometryIds,
			boundaryIds: this.boundaryIds,
			lodIds: this.lodIds,
			materials: this.materials,
			textures: this.textures
		};

	}

	setObjectId( objectId ) {

		for ( let i = 0; i < this.objectIds.length; i ++ ) {

			this.objectIds[ i ] = objectId;

		}

	}


	setObjectType( objectType ) {

		for ( let i = 0; i < this.objectTypes.length; i ++ ) {

			this.objectTypes[ i ] = objectType;

		}

	}

	setGeometryIdx( geometryIdx ) {

		for ( let i = 0; i < this.geometryIds.length; i ++ ) {

			this.geometryIds[ i ] = geometryIdx;

		}

	}
 //geoscity
	merge(otherGeomData) {
    if (otherGeomData.geometryType != this.geometryType) {
        console.warn("Merging different types of geometry data!");
    }

    this.vertexIds = this.vertexIds.concat(otherGeomData.vertexIds);
    this.objectIds = this.objectIds.concat(otherGeomData.objectIds);
    this.objectTypes = this.objectTypes.concat(otherGeomData.objectTypes);
    this.semanticSurfaces = this.semanticSurfaces.concat(otherGeomData.semanticSurfaces);
    this.semanticClasses = this.semanticClasses.concat(otherGeomData.semanticClasses);
    this.geometryIds = this.geometryIds.concat(otherGeomData.geometryIds);
    this.boundaryIds = this.boundaryIds.concat(otherGeomData.boundaryIds);
    this.lodIds = this.lodIds.concat(otherGeomData.lodIds);

    // Handle materials merging
    for (const theme in otherGeomData.materials) {
        if (this.materials[theme]) {
            this.materials[theme] = this.materials[theme].concat(otherGeomData.materials[theme]);
        } else {
            this.materials[theme] = [...otherGeomData.materials[theme]];
        }
    }

    // Handle textures merging
    for (const theme in otherGeomData.textures) {
        if (this.textures[theme]) {
            this.textures[theme].index = this.textures[theme].index.concat(otherGeomData.textures[theme].index);
            this.textures[theme].uvs = this.textures[theme].uvs.concat(otherGeomData.textures[theme].uvs);
        } else {
            this.textures[theme] = {
                index: [...otherGeomData.textures[theme].index],
                uvs: [...otherGeomData.textures[theme].uvs]
            };
        }
    }
}