import {
    PerspectiveCamera,
    Mesh,
    MeshBasicMaterial,
    BoxGeometry,
    WebGLRenderer,
    Scene,
    AxesHelper,
    EdgesGeometry,
    LineBasicMaterial,
    LineSegments
  } from "../vendor/three/build/three.module.js";
  
import { OrbitControls } from "../vendor/three/examples/jsm/controls/OrbitControls.js";

const daysInWeek = 7;
const weeks = 52;
const borderWidth = 2;
const renderer = new WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const scene = new Scene();
const camera = new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
const controls = new OrbitControls( camera, renderer.domElement );


const bottomGeometry = new BoxGeometry(daysInWeek + borderWidth, 1, weeks + borderWidth);
const materialRed = new MeshBasicMaterial( { color: 0xff0000 } );
const materialWhite = new MeshBasicMaterial( { color: 0xa6a6a6 } );
const materialGreen = new MeshBasicMaterial( { color: 0x00ff00, wireframe: true } );
const materialBlue = new MeshBasicMaterial( { color: 0x0000ff, wireframe: true  } );


const numberOfDays = 365;
const cubeCenterOffset = 0.5;
const xOffset = daysInWeek/2;
const yOffset = weeks/2;

for (let week = 0; week < weeks; week++) {
    for (let dayOfWeek = 0; dayOfWeek < daysInWeek; dayOfWeek++) {
        var height = Math.floor(Math.random() * 5)
        const geometry = new BoxGeometry(1, height, 1);
        var cube = new Mesh( geometry, materialRed );
        cube.position.set(dayOfWeek + cubeCenterOffset - xOffset, height/2, week + cubeCenterOffset - yOffset);
        scene.add( cube );

        var geo = new EdgesGeometry( cube.geometry );
        var mat = new LineBasicMaterial( { color: 0x000000, linewidth: 10 } );
        var wireframe = new LineSegments( geo, mat );
        wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd
        cube.add( wireframe );

    }
}

var axesHelper = new AxesHelper( 5 );
scene.add( axesHelper );


let center = new Mesh( bottomGeometry, materialWhite);
scene.add( center );

var geo = new EdgesGeometry( center.geometry );
var mat = new LineBasicMaterial( { color: 0x000000, linewidth: 10 } );
var wireframe = new LineSegments( geo, mat );
wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd
center.add( wireframe );


//controls.update() must be called after any manual changes to the camera's transform
camera.position.set( daysInWeek/2, 20, 50 );
controls.update();

function animate() {

	requestAnimationFrame( animate );

	// required if controls.enableDamping or controls.autoRotate are set to true
	controls.update();

	renderer.render( scene, camera );

}

animate();