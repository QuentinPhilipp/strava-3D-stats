import {
    PerspectiveCamera,
    Mesh,
    MeshBasicMaterial,
    BoxGeometry,
    WebGLRenderer,
    Scene,
    EdgesGeometry,
    LineBasicMaterial,
    LineSegments,
    Group,
    Box3,
    TextGeometry,
    FontLoader,
    ExtrudeGeometry, 
    Shape,
    Vector2,
  } from "../three/build/three.module.js";
  
import { OrbitControls } from "../three/examples/jsm/controls/OrbitControls.js";

const BORDER_WIDTH = 2;
const BASE_HEIGHT = 4;

const renderer = new WebGLRenderer();
document.querySelector('#mainCanva').appendChild(renderer.domElement);

// Set size
window.addEventListener( 'resize', onWindowResize, false );
renderer.setSize( window.innerWidth, window.innerHeight );

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

const scene = new Scene();
const camera = new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
const controls = new OrbitControls( camera, renderer.domElement );

// Object groups
var activityGroup = new Group();
var dayPlaceholderGroup = new Group();
var logoGroup = new Group();


// Materials
const placeholderMaterial = new MeshBasicMaterial( { color: 0x707070 } );
const stravaMaterial = new MeshBasicMaterial( { color: 0xFC4C02 } );
const stravaLogoTopMaterial = new MeshBasicMaterial( { color: 0xffffff } );
const stravaLogoBottomMaterial = new MeshBasicMaterial( { color: 0xfdb79a } );


function addWireframe(cube) {
    var geo = new EdgesGeometry( cube.geometry );
    var mat = new LineBasicMaterial( { color: 0x000000, linewidth: 10 } );
    var wireframe = new LineSegments( geo, mat );
    wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd
    cube.add( wireframe );
}

function createBottom(tiles, username) {
    // Base
    let bbox = new Box3().setFromObject(tiles);

    const width = (bbox.max.x - bbox.min.x) + BORDER_WIDTH;
    const length = (bbox.max.z - bbox.min.z) + BORDER_WIDTH;

    // Base
    const bottomGeometry = new BoxGeometry(width, BASE_HEIGHT, length);
    let baseMesh = new Mesh( bottomGeometry, stravaMaterial);
    baseMesh.position.set((Math.abs(bbox.max.x) - Math.abs(bbox.min.x)) / 2, -BASE_HEIGHT/2, (Math.abs(bbox.max.z) - Math.abs(bbox.min.z)) / 2);

    scene.add( baseMesh );
    addWireframe(baseMesh);


    // Logo
    const extrudeSettings = { depth: 3, bevelEnabled: false, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };

    const stravaLogoTop = [];
    const stravaLogoBottom = [];

    stravaLogoTop.push( new Vector2( 0, 0 ) );
    stravaLogoTop.push( new Vector2( 42, 0 ) );
    stravaLogoTop.push( new Vector2( 70, 55 ) );
    stravaLogoTop.push( new Vector2( 98, 0 ) );
    stravaLogoTop.push( new Vector2( 140, 0 ) );
    stravaLogoTop.push( new Vector2( 70, 140 ) );
    stravaLogoTop.push( new Vector2( 0, 0 ) );

    stravaLogoBottom.push( new Vector2( 62, 0 ) );
    stravaLogoBottom.push( new Vector2( 98, 0 ) );
    stravaLogoBottom.push( new Vector2( 120, -38 ) );
    stravaLogoBottom.push( new Vector2( 140, 0 ) );
    stravaLogoBottom.push( new Vector2( 176, 0 ) );
    stravaLogoBottom.push( new Vector2( 120, -98 ) );
    stravaLogoBottom.push( new Vector2( 62, 0 ) );

    for ( let i = 0; i < stravaLogoTop.length; i ++ ) stravaLogoTop[ i ].multiplyScalar( 0.25 );
    for ( let i = 0; i < stravaLogoBottom.length; i ++ ) stravaLogoBottom[ i ].multiplyScalar( 0.25 );

    const stravaLogoTopShape = new Shape( stravaLogoTop );
    const stravaLogoBottomShape = new Shape( stravaLogoBottom );

    let geometryLogoTop = new ExtrudeGeometry( stravaLogoTopShape, extrudeSettings );
    let geometryLogoBottom = new ExtrudeGeometry( stravaLogoBottomShape, extrudeSettings );

    let meshTop = new Mesh( geometryLogoTop, stravaLogoTopMaterial );
    let meshBottom = new Mesh( geometryLogoBottom, stravaLogoBottomMaterial );
    logoGroup.add(meshTop);
    logoGroup.add(meshBottom);

    // Name
    const loader = new FontLoader();
    loader.load( '../three/examples/fonts/helvetiker_regular.typeface.json', function ( font ) {
        const size = 50;

        const geometry = new TextGeometry( username, {
            font: font,
            size: size,
            height: 3,
            curveSegments: 6,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelOffset: 0,
            bevelSegments: 4
        } );
        var name3D = new Mesh( geometry, stravaLogoTopMaterial);
        // name3D.rotation.y = -90 * (Math.PI/180);
        name3D.position.set(70, -20, 0);
        logoGroup.add(name3D);
    } );

    logoGroup.position.set( -4.51, -BASE_HEIGHT/2, -23);
    logoGroup.rotation.set( 0, -90 * (Math.PI/180), 0 );
    logoGroup.scale.set( 0.05, 0.05, 0.05 );
    scene.add( logoGroup );

}

function getPositionFromDay(day) {
    let dayOfWeek = day.getDay();
    let dayOfWeekOffset = ((dayOfWeek + 6) % 7)

    var position = {x: dayOfWeekOffset, y: 0};

    // Week number
    // Check if the year started with a rest a past year week
    let oneJan = new Date(day.getFullYear(), 0, 1);
    let firstWeek = oneJan.getWeekNumber();
    let weekNumbers = day.getWeekNumber();
    if (firstWeek[0] == day.getFullYear() - 1)
    {
        // Add 1 week for the last week of past year
        if (day.getWeekNumber()[0] != day.getFullYear()){
            position.y = 1
        }
        else {
            position.y = weekNumbers[1]+1
        }
    } 
    else {
        if (weekNumbers[0] == day.getFullYear()){
            position.y = weekNumbers[1];
        }
        else if (weekNumbers[0] == day.getFullYear() + 1){
            position.y = day.getNumberOfWeeks();

        }
    }
    return position;
}

function addDayPlaceholder(day) {
    const geometry = new BoxGeometry(1, 0.1, 1);
    var cube = new Mesh( geometry, placeholderMaterial );
    let position = getPositionFromDay(day);
    cube.position.set(position.x, 0, position.y);
    dayPlaceholderGroup.add( cube );
    addWireframe(cube);
}

function populateActivities(activities, year) {

    activities.forEach( function(activity) {
        const activityDate = new Date(activity.start_date);

        let position = getPositionFromDay(activityDate);

        // Create block
        const height = activity.distance / 10000; // 10km = 1unit
        const geometry = new BoxGeometry(0.9, height, 0.9);
        var cube = new Mesh( geometry, stravaMaterial );

        cube.position.set(position.x , height/2, position.y);
        activityGroup.add( cube );
        addWireframe(cube)
    })

    activityGroup.position.set(-(7/2) + 0.5, 0, -year.getNumberOfWeeks()/2 +0.5);  // Center activities

    scene.add(activityGroup);
}


function showActivityPlaceholder(year) {
    let start = new Date(year.getFullYear(), 0, 1);  // 1 Jan
    let stop = new Date(year.getFullYear(), 11, 31);  // 31 Dec
    for (var d = start; d <= stop; d.setDate(d.getDate() + 1)) {
        addDayPlaceholder(new Date(d));
    }
    scene.add(dayPlaceholderGroup);
    dayPlaceholderGroup.position.set(-(7/2) + 0.5, 0, -year.getNumberOfWeeks()/2 +0.5); // Center placeholders
}

function animate() {
	requestAnimationFrame( animate );
	controls.update();
	renderer.render( scene, camera );
}

Date.prototype.getNumberOfWeeks = function() {
    let oneJan = new Date(this.getFullYear(),0,1);
    let lastDec = new Date(this.getFullYear(), 11, 31);
    let numberOfDays = Math.floor((lastDec - oneJan) / (24 * 60 * 60 * 1000));
    let numberOfWeeks = Math.ceil(( oneJan.getDay() + 1 + numberOfDays) / 7);
    return numberOfWeeks;
}

Date.prototype.getWeekNumber = function() {
    let d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return [d.getUTCFullYear(), weekNo];
}

async function loadData(year) {
    let url = "/data?year="+year;
    const response = await fetch(url);
    const data = await response.json();
    // console.log(data);
    return data.rawData;
}

function wipeData() {
    for (var i=activityGroup.children.length-1; i >= 0; --i)            
        activityGroup.remove(activityGroup.children[i]);
    for (var i=dayPlaceholderGroup.children.length-1; i >= 0; --i)            
    dayPlaceholderGroup.remove(dayPlaceholderGroup.children[i]);
}

async function start() {
    let dataElt = document.getElementById("year-container");
    let yearStr = dataElt.getAttribute("value");
    let username = dataElt.getAttribute("user");
    setup(yearStr, username);
}

async function restart() {
    let year = document.getElementById("year");
    let dataElt = document.getElementById("year-container");
    let username = dataElt.getAttribute("user");
    wipeData();
    setup(year.value, username);
}

async function setup(yearStr, username) {
    camera.position.set( -50, 30, 0 );
    controls.update();
    animate();
    
    let year = new Date(yearStr, 0, 1)
    showActivityPlaceholder(year);
    createBottom(dayPlaceholderGroup, username);
    
    let activities = await loadData(yearStr);
    
    populateActivities(activities, year);
}

window.addEventListener('load', function() {
    start();
    let yearBtn = document.getElementById("year-button");
    yearBtn.onclick = restart;
})