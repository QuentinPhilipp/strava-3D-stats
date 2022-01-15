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
  } from "../three/build/three.module.js";
  
import { OrbitControls } from "../three/examples/jsm/controls/OrbitControls.js";

const BORDER_WIDTH = 2;
const BASE_HEIGHT = 1;

const renderer = new WebGLRenderer();
document.body.appendChild( renderer.domElement );

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

// Materials
const activitiesMaterial = new MeshBasicMaterial( { color: 0xff0000 } );
const baseMaterial = new MeshBasicMaterial( { color: 0xa6a6a6 } );
const placeholderMaterial = new MeshBasicMaterial( { color: 0x707070 } );


function addWireframe(cube) {
    var geo = new EdgesGeometry( cube.geometry );
    var mat = new LineBasicMaterial( { color: 0x000000, linewidth: 10 } );
    var wireframe = new LineSegments( geo, mat );
    wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd
    cube.add( wireframe );
}


function createBottom(tiles) {
    let bbox = new Box3().setFromObject(tiles);
 
    console.log(bbox.min, bbox.max);
    const width = (bbox.max.x - bbox.min.x) + BORDER_WIDTH;
    const length = (bbox.max.z - bbox.min.z) + BORDER_WIDTH;

    const bottomGeometry = new BoxGeometry(width, BASE_HEIGHT, length);
    let center = new Mesh( bottomGeometry, baseMaterial);
    center.position.set((Math.abs(bbox.max.x) - Math.abs(bbox.min.x)) / 2, 0, (Math.abs(bbox.max.z) - Math.abs(bbox.min.z)) / 2);

    scene.add( center );
    addWireframe(center);
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
    cube.position.set(position.x, 0.5, position.y);
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
        var cube = new Mesh( geometry, activitiesMaterial );

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

function display(activities, year) {
    showActivityPlaceholder(year);
    createBottom(dayPlaceholderGroup);
    populateActivities(activities, year);
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
    console.log(data);
    return data.rawData;
}

let dataElt = document.getElementById("year-container");
let yearStr = dataElt.getAttribute("value");

camera.position.set( 7/2, 20, 50 );
controls.update();
animate();

let year = new Date(yearStr, 0, 1)
showActivityPlaceholder(year);
createBottom(dayPlaceholderGroup);

let activities = await loadData(yearStr);
populateActivities(activities, year);
