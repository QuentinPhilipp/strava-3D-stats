import {
    PerspectiveCamera,
    Mesh,
    MeshBasicMaterial,
    BoxGeometry,
    WebGLRenderer,
    Scene
  } from "../vendor/three/build/three.module.js";
  
import { OrbitControls } from "../vendor/three/examples/jsm/controls/OrbitControls.js";
  
const renderer = new WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const scene = new Scene();

const camera = new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );

const controls = new OrbitControls( camera, renderer.domElement );


const geometry = new BoxGeometry();
const bottomGeometry = new BoxGeometry(10, 1, 5);
const materialRed = new MeshBasicMaterial( { color: 0xff0000, wireframe: true } );
const materialWhite = new MeshBasicMaterial( { color: 0xffffff, wireframe: true } );
const materialGreen = new MeshBasicMaterial( { color: 0x00ff00, wireframe: true } );
const materialBlue = new MeshBasicMaterial( { color: 0x0000ff, wireframe: true  } );


var cube = new Mesh( geometry, materialRed );
scene.add( cube );
cube.position.x = 2;
cube.position.y = 1;
var cube2 = new Mesh( geometry, materialGreen );
scene.add( cube2 );
cube2.position.y = 3;       
var cube3 = new Mesh( geometry, materialBlue );
scene.add( cube3 );
cube3.position.z = 2;   
cube3.position.y = 1;


let center = new Mesh( bottomGeometry, materialWhite);
scene.add( center );

//controls.update() must be called after any manual changes to the camera's transform
camera.position.set( 0, 20, 50 );
controls.update();

function animate() {

	requestAnimationFrame( animate );

	// required if controls.enableDamping or controls.autoRotate are set to true
	controls.update();

	renderer.render( scene, camera );

}

animate();