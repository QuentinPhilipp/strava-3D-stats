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
    Color,
    GridHelper,
    Vector3,
  } from "../three/build/three.module.js";
  
import { OrbitControls } from "../three/examples/jsm/controls/OrbitControls.js";
import { STLExporter } from "../three/examples/jsm/exporters/STLExporter.js";
import { ConvexGeometry } from "../three/examples/jsm/geometries/ConvexGeometry.js";
import { saveAs } from './FileSaver.js'


const BORDER_WIDTH = 2;
const BASE_HEIGHT = 4;
const TILE_HEIGHT = 0.1;

const renderer = new WebGLRenderer({
    preserveDrawingBuffer: true,
    antialias: true
});
document.querySelector('#main-layout').appendChild(renderer.domElement);
renderer.domElement.id = "canva-3d";

// Set size
window.addEventListener( 'resize', onWindowResize, false );
renderer.setSize( window.innerWidth, window.innerHeight );

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

const scene = new Scene();
scene.background = new Color( 0x0f0f0f );
const camera = new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
const controls = new OrbitControls( camera, renderer.domElement );

let stravaColor = new Color(0xFC4C02);
const helper = new GridHelper( 2000, 150 ,stravaColor, stravaColor);
helper.position.y = - 9;
helper.material.opacity = 0.25;
helper.material.transparent = true;
scene.add( helper );

// Object groups
var activityGroup = new Group();
var dayPlaceholderGroup = new Group();
var logoGroup = new Group();


// Materials
const placeholderMaterial = new MeshBasicMaterial( { color: 0x707070 } );
const stravaMaterial = new MeshBasicMaterial( { color: 0xFC4C02 } );
const runningMaterial = new MeshBasicMaterial( { color: 0x2ae830 } );
const cyclingMaterial = new MeshBasicMaterial( { color: 0xe8bf2a } );
const swimmingMaterial = new MeshBasicMaterial( { color: 0x2a86e8 } );
const stravaLogoTopMaterial = new MeshBasicMaterial( { color: 0xffffff } );
const stravaLogoBottomMaterial = new MeshBasicMaterial( { color: 0xfdb79a } );

camera.position.set( -50, 30, 0 );
controls.update();
animate();

function addWireframe(cube) {
    var geo = new EdgesGeometry( cube.geometry );
    var mat = new LineBasicMaterial( { color: 0x000000, linewidth: 1 } );
    var wireframe = new LineSegments( geo, mat );
    wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd
    cube.add( wireframe );
}

function createBottom() {
    // Base dimension
    let bbox = new Box3().setFromObject(dayPlaceholderGroup);

    const width = (bbox.max.x - bbox.min.x) + BORDER_WIDTH;
    const widthOffset = width*0.15

    const length = (bbox.max.z - bbox.min.z) + BORDER_WIDTH;
    const lengthOffset = length*0.03
    const height = -BASE_HEIGHT

    // Base
    const verticesOfCube = [
        // Top level
        new Vector3(0,0,0),
        new Vector3(0, 0, length),    
        new Vector3(width, 0, length),    
        new Vector3(width, 0, 0),

        // Bottom level
        new Vector3(width + widthOffset, height, 0 - lengthOffset),   
        new Vector3(width + widthOffset, height, length + lengthOffset),    
        new Vector3(0 - widthOffset, height, length + lengthOffset),
        new Vector3(0 - widthOffset, height, 0 - lengthOffset),
    ];
    const bottomGeometry = new ConvexGeometry( verticesOfCube);

    let baseMesh = new Mesh( bottomGeometry, stravaMaterial);
    baseMesh.position.set( -width / 2, -TILE_HEIGHT/2, -length / 2 + BORDER_WIDTH /2);

    scene.add( baseMesh );
    addWireframe(baseMesh);
}

function createName(username) {
    // Base dimension
    let bbox = new Box3().setFromObject(dayPlaceholderGroup);

    const width = (bbox.max.x - bbox.min.x) + BORDER_WIDTH;
    const widthOffset = width*0.15
    const height = -BASE_HEIGHT

    // Logo
    const extrudeSettings = { depth: 5, bevelEnabled: false, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };

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
            height: 5,
            curveSegments: 6,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelOffset: 0,
            bevelSegments: 4
        } );
        var name3D = new Mesh( geometry, stravaLogoTopMaterial);
        name3D.position.set(70, -20, 0);
        logoGroup.add(name3D);
    } );

    logoGroup.position.set( -5.1, -BASE_HEIGHT/2, -23);
    logoGroup.rotation.set( 0, -90 * (Math.PI/180), 0 );

    // match base inclination
    const baseInclination = Math.sin(widthOffset/height);

    logoGroup.rotateOnWorldAxis(new Vector3(0, 0, 1), baseInclination)
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
    const geometry = new BoxGeometry(1, TILE_HEIGHT, 1);
    var cube = new Mesh( geometry, placeholderMaterial );
    let position = getPositionFromDay(day);
    cube.position.set(position.x, 0, position.y);
    dayPlaceholderGroup.add( cube );
    addWireframe(cube);
}

const timer = ms => new Promise(res => setTimeout(res, ms))

async function populateActivities(activities, year) {
    activityGroup.position.set(-(7/2) + 0.5, 0, -year.getNumberOfWeeks()/2 +0.5);  // Center activities
    scene.add(activityGroup);

    let activityAddDelay = 1000/activities.length

    let metricSelector = document.getElementById("metric")
    let metric = "distance";
    if (metricSelector) {
        metric = metricSelector.value;
    }

    let sportSelector = document.getElementById("sport")
    let sport = "All sports";
    if (sportSelector) {
        sport = sportSelector.value;
    }

    for (let index = activities.length -1; index >= 0; index--) {
        const activity = activities[index];
        if (isSportCompatible(activity, sport)) {
            const activityDate = new Date(activity.start_date);

            let position = getPositionFromDay(activityDate);
            // Create block
            const height = getScaleFromSportAndMetric(sport, metric, activity);
            const geometry = new BoxGeometry(0.9, height, 0.9);
            var cube = new Mesh( geometry, stravaMaterial );
    
            cube.position.set(position.x , height/2, position.y);
            activityGroup.add(cube);
            addWireframe(cube);
            await timer(activityAddDelay);
        }
    }
}

function getScaleFromSportAndMetric(sport, metric, activity) {
    let height = 0;
    if (sport == "Cycling" || sport == "All sports") {
        if (metric == "distance") {
            height = activity.distance / 10000; // 10km = 1unit
        }
        else if (metric == "elevation") {
            height = activity.elevation / 200; // 200m = 1unit
        }
    }
    else if (sport == "Running" || sport == "Hiking") {
        if (metric == "distance") {
            height = activity.distance / 2000; // 2km = 1unit
        }
        else if (metric == "elevation") {
            height = activity.elevation / 50; // 200m = 1unit
        }
    }
    else if (sport == "Swimming") {
        if (metric == "distance") {
            height = activity.distance / 500; // 0.5km = 1unit
        }
        else if (metric == "elevation") {
            height = 0  // No elevation when swimming
        }
    }
    return height;
}

function isSportCompatible(activity, sport) {
    if (sport === "All sports") {
        return true;
    }
    else if (sport === "Cycling" && (activity.type === "Ride" || activity.type === "VirtualRide" || activity.type === "EBikeRide")) {
        return true;
    }
    else if (sport === "Running" && (activity.type === "Run" || activity.type === "VirtualRun")) {
        return true;
    }
    else if (sport === "Swimming" && (activity.type === "Swim")) {
        return true;
    }
    else if (sport === "Hiking" && (activity.type === "Walk" || activity.type === "Hike")) {
        return true;
    }
    return false;
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
    if (data.status === "success") {
        return data.rawData;
    }
    else if (response.status == 403) {
        console.log("Session expired, logout");
        window.location.href = window.location.href + "logout";
    }
    else {
        console.log("Error:", data.errorDesc)
        return [];
    }
}

async function loadExampleData() {
    let url = "/coverdata";
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === "success") {
        return data.rawData;
    }
    else {
        console.log("Error:", data.errorDesc)
        return [];
    }
}

function wipeData() {
    for (var i=activityGroup.children.length-1; i >= 0; --i) {
        activityGroup.remove(activityGroup.children[i]);
    }
    for (var i=logoGroup.children.length-1; i >= 0; --i) {
        logoGroup.remove(logoGroup.children[i]);
    }
}

function getUsername() {
    let dataElt = document.getElementById('data-container');
    let username = dataElt.getAttribute("user");
    return username
}

async function restart() {
    let year = document.getElementById("year");
    let name = document.getElementById("new_name").value;
    wipeData();
    let yearObj = new Date(year.value, 0, 1);

    showActivityPlaceholder(yearObj);
    createName(name);
    let activities = await loadData(yearObj.getFullYear());
    populateActivities(activities, yearObj);
}

async function start() {
    let today = new Date();
    let year = new Date(today.getFullYear()-1, 0, 1);
    
    setup(year, getUsername());
}

async function setup(year, username) {    

    showActivityPlaceholder(year);
    createBottom();
    createName(username);
    let activities = await loadData(year.getFullYear());
    
    populateActivities(activities, year);
}

async function demoSetup() {
    showActivityPlaceholder(new Date());
    createBottom();
    createName("3D Strava stats");
    
    let activities = await loadExampleData();
    
    populateActivities(activities, new Date());
}

window.addEventListener('load', function() {
    let loginElt = document.getElementById("login-container");
    if (loginElt) {
        demoSetup();
    }
    else {
        start();
        let yearBtn = document.getElementById("year-button");
        yearBtn.onclick = restart;
    
        // Default value is the last year
        document.getElementById("year").options[1].selected = true;
    }
    let mobileCloseElt = document.getElementById("close-mobile");
    mobileCloseElt.onclick = function() {
        let mobileElt = document.getElementById("popup-mobile");
        mobileElt.style.visibility = "hidden";
    }
})

const screenshot = document.getElementById('screenshot');
const exportSTL = document.getElementById('exportSTL');
const settings = document.getElementById('settings-button');

if (screenshot) {
    screenshot.addEventListener('click', function(e) {
        let canvas = document.getElementById("canva-3d");
        const link = document.createElement('a');

        var exportCanvas = document.createElement("canvas");
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;

        var ctx = exportCanvas.getContext('2d');
        ctx.fillStyle = "#FFF";

        ctx.drawImage(canvas, 0, 0);
        ctx.font = '16px sans-serif';
        var waterMark = "Made with " + window.location.host;
        ctx.fillText(waterMark, 30, canvas.height - 15);
        link.download = 'strava3D.png';
        link.href = exportCanvas.toDataURL();
        link.click();
        link.delete;
      });
}

if (exportSTL) {
    exportSTL.addEventListener('click', function(e) {
        const exporter = new STLExporter();
        const str = exporter.parse(scene);
        const blob = new Blob([str], {type: 'text/plain'});
        saveAs(blob, 'strava-3d.stl');
      });
}

if (settings) {
    settings.addEventListener('click', function(e) {
        const panel = document.getElementById('settings-panel');
        if (panel.style.display === "none") {
            panel.style.display = "block";
          } else {
            panel.style.display = "none";
          }
      });
}

var slider = document.getElementById("scale-slider");

slider.onchange = function () {
    activityGroup.scale.set(1, this.value, 1);
}


window.restart = restart;