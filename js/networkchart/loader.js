/**
 * Created by phoenix on 15/10/27.
 */
var loadingManager = new THREE.LoadingManager();

loadingManager.onLoad = function () {

    document.getElementById( '载入数据中...' ).style.display = 'none'; // hide loading animation when finished
    console.log( '载入完成.' );

    main();

};

loadingManager.onProgress = function ( item, loaded, total ) {

    console.log( loaded + '/' + total, item );

};

var shaderLoader = new THREE.XHRLoader( loadingManager );
shaderLoader.setResponseType( 'text' );

shaderLoader.loadMultiple = function ( SHADER_CONTAINER, urlObj ) {

    _.each( urlObj, function ( value, key ) {

        shaderLoader.load( value, function ( shader ) {

            SHADER_CONTAINER[ key ] = shader;

        } );

    } );

};

var SHADER_CONTAINER = {};
shaderLoader.loadMultiple( SHADER_CONTAINER, {

    entityVert: 'shaders/entity.vert',
    entityFrag: 'shaders/entity.frag',

    relationVert: 'shaders/relation.vert',
    relationFrag: 'shaders/relation.frag'

} );



/*var OBJ_MODELS = {};
var OBJloader = new THREE.OBJLoader( loadingManager );
OBJloader.load( 'models/brain_vertex_low.obj', function ( model ) {

    OBJ_MODELS.brain = model.children[ 0 ];

} );*/


var TEXTURES = {};
var textureLoader = new THREE.TextureLoader( loadingManager );
textureLoader.load( 'sprites/electric.png', function ( tex ) {

    TEXTURES.electric = tex;

} );