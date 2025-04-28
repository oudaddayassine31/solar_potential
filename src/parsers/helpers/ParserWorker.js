import 'regenerator-runtime/runtime';
import { ChunkParser } from './ChunkParser.js';

onmessage = function ( e ) {

	const parser = new ChunkParser();

	const props = e.data[ 1 ];

	if ( props ) {

		if ( props.chunkSize ) {

			parser.chunkSize = props.chunkSize;

		}

		if ( props.objectColors ) {

			parser.objectColors = props.objectColors;

		}

		//geoscity
		if (props.classColors) {

			parser.classColors = props.classColors;

	}

		if ( props.lods ) {

			parser.lods = props.lods;

		}

	}



	parser.onchunkload = ( v, geometryData, lods, objectColors, surfaceColors,classColors ) => {

		const vertexArray = new Float32Array( v );
		const vertexBuffer = vertexArray.buffer;
		const classColorsToSend = classColors || parser.classColors;

		const msg = {
			type: "chunkLoaded",
			v_buffer: vertexBuffer,
			geometryData,
			lods,
			objectColors,
			surfaceColors,
			classColors: parser.classColors // geoscity
		};
		postMessage( msg, [ vertexBuffer ] );

	};

	parser.onComplete = () => {

		this.postMessage( { type: "done" } );

	};

	parser.parse( e.data[ 0 ] );

};

